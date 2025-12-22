/**
 * BlockChatModal - Supabase-backed chat interface
 * 
 * CRITICAL: All messages are persisted to Supabase.
 * No Zustand-only messages allowed.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Settings, Pencil, Check, Sparkles, ChevronDown, Brain, Zap, Lock, ExternalLink, Link2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProviderBadge } from "@/components/ui/provider-badge";
import { Spinner } from "@/components/ui/spinner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { useBlockMessages, useMessageActions, useBlockUsage, formatBytes } from "@/hooks/useBlockMessages";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { chatService, type ChatAttachment } from "@/services/chatService";
import { useUserApiKeys } from "@/hooks/useApiKeys";
import { useModelsGroupedByProvider, useAvailableProviders } from "@/hooks/useModelConfig";
import { useBlockIncomingContext } from "@/hooks/useBlockConnections";
import { useBlock } from "@/hooks/useBlockData";
import { blocksDb } from "@/lib/database";
import { getModelConfig, PROVIDERS, type Provider } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Message as LegacyMessage } from "@/types";

interface BlockChatModalProps {
  blockId: string;
}

type MessageStatus = 'idle' | 'waiting_llm' | 'error';

// Transform DB message to legacy Message format for ChatMessage component
function toDisplayMessage(m: { id: string; block_id: string; role: string; content: string; meta?: unknown; size_bytes?: number | null; created_at: string }): LegacyMessage {
  return {
    id: m.id,
    block_id: m.block_id,
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
    meta: m.meta as LegacyMessage['meta'],
    size_bytes: m.size_bytes || 0,
    created_at: m.created_at,
  };
}

export function BlockChatModal({ blockId }: BlockChatModalProps) {
  const [messageStatus, setMessageStatus] = useState<MessageStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: supabaseBlock, isLoading: blockLoading, error: blockError } = useBlock(blockId);
  const { closeBlockChat } = useAppStore();
  
  const block = supabaseBlock ? {
    id: supabaseBlock.id,
    board_id: supabaseBlock.board_id,
    title: supabaseBlock.title || 'Untitled Block',
    model_id: supabaseBlock.model_id,
    system_prompt: supabaseBlock.system_prompt || '',
    position: { x: supabaseBlock.position_x, y: supabaseBlock.position_y },
    created_at: supabaseBlock.created_at,
    updated_at: supabaseBlock.updated_at,
  } : null;

  const userApiKeys = useUserApiKeys();
  const modelsByProvider = useModelsGroupedByProvider();
  const providers = useAvailableProviders();
  const { messages: blockMessages, isLoading: messagesLoading } = useBlockMessages(blockId);
  const { sendMessage: persistMessage, deleteMessage: deletePersistedMessage } = useMessageActions(blockId);
  const blockUsage = useBlockUsage(blockId);
  const incomingContext = useBlockIncomingContext(blockId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [blockMessages, streamingContent]);

  useEffect(() => {
    if (block) setTitle(block.title);
  }, [block?.title]);

  const currentModel = block?.model_id ? getModelConfig(block.model_id) : null;
  const currentProvider = currentModel?.provider;
  const needsModelSelection = !block?.model_id || !currentModel;
  const hasKeyForCurrentProvider = currentProvider ? userApiKeys.keys.some(k => k.provider === currentProvider) : false;
  const getProviderHasKey = (provider: Provider) => userApiKeys.keys.some(k => k.provider === provider);

  const handleModelSwitch = async (newModelId: string) => {
    const newModel = getModelConfig(newModelId);
    if (!newModel || !getProviderHasKey(newModel.provider)) {
      toast.error(`Add an API key for ${newModel ? PROVIDERS[newModel.provider].name : 'this provider'} first`);
      return;
    }
    try {
      await blocksDb.update(blockId, { model_id: newModelId });
      queryClient.invalidateQueries({ queryKey: ['block', blockId] });
      toast.success(`Switched to ${newModel.name}`);
    } catch { toast.error('Failed to switch model'); }
  };

  const handleTitleSave = async () => {
    if (title.trim() && blockId) {
      try {
        await blocksDb.update(blockId, { title: title.trim() });
        queryClient.invalidateQueries({ queryKey: ['block', blockId] });
      } catch { toast.error('Failed to save title'); }
    }
    setIsEditingTitle(false);
  };

  const handleSend = useCallback(async (content: string, attachments?: ChatAttachment[]) => {
    if (!content.trim() || messageStatus !== 'idle' || !block) return;

    if (!hasKeyForCurrentProvider) {
      toast.error("No API key configured", { action: { label: "Add Key", onClick: () => navigate("/api-keys") } });
      return;
    }

    setErrorMessage(null);

    // 1) Append locally (optimistic) so UI is instant
    let userMessage;
    try {
      userMessage = await persistMessage('user', content);
    } catch {
      setMessageStatus('error');
      setErrorMessage('Message failed to send.');
      return;
    }

    // 2) Start the LLM request immediately (no refetch)
    setMessageStatus('waiting_llm');
    setStreamingContent("");

    const connectedContext = incomingContext.length > 0
      ? incomingContext.map(ctx => `[From "${ctx.source_block_title}"]:\n${ctx.content}`).join('\n\n')
      : undefined;

    const cacheMessages = (queryClient.getQueryData(['block-messages', blockId]) as any[] | undefined) ?? [];
    const history = chatService.buildConversationHistory(
      cacheMessages.map(m => toDisplayMessage(m)),
      block.model_id,
      block.system_prompt,
      undefined,
      connectedContext
    );

    await chatService.streamChat(block.model_id, history, {
      onChunk: (chunk) => setStreamingContent(prev => prev + chunk),
      onComplete: (response, meta) => {
        // 3) Convert streaming -> real assistant message instantly, then persist in background
        persistMessage('assistant', response, meta as Record<string, unknown>);
        setStreamingContent("");
        setMessageStatus('idle');
      },
      onError: () => {
        setMessageStatus('error');
        setErrorMessage('Assistant failed. Please try again.');
        setStreamingContent("");
      },
    });
  }, [block, blockId, hasKeyForCurrentProvider, incomingContext, messageStatus, navigate, persistMessage, queryClient]);

  const handleStop = useCallback(() => {
    chatService.stopGeneration();
    if (streamingContent) {
      persistMessage('assistant', streamingContent + " [stopped]");
    }
    setStreamingContent("");
    setMessageStatus('idle');
  }, [persistMessage, streamingContent]);

  const handleRetry = useCallback(async (message: LegacyMessage) => {
    if (message.role !== 'assistant') return;
    const idx = blockMessages.findIndex(m => m.id === message.id);
    if (idx <= 0) return;
    const userMsg = blockMessages[idx - 1];
    if (userMsg.role !== 'user') return;
    await deletePersistedMessage(message.id);
    handleSend(userMsg.content);
  }, [blockMessages, deletePersistedMessage, handleSend]);

  const handleDeleteMessage = useCallback(async (id: string) => {
    await deletePersistedMessage(id);
  }, [deletePersistedMessage]);

  const isRunning = messageStatus !== 'idle' && messageStatus !== 'error';

  if (blockLoading) {
    return (
      <Dialog open onOpenChange={() => closeBlockChat()}>
        <DialogContent className="max-w-2xl w-[90vw] h-[80vh] flex flex-col items-center justify-center rounded-2xl p-0 border border-border/30 bg-card/95 backdrop-blur-xl">
          <Spinner className="h-8 w-8" /><p className="text-muted-foreground mt-4">Loading block...</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (blockError || !block) {
    return (
      <Dialog open onOpenChange={() => closeBlockChat()}>
        <DialogContent className="max-w-2xl w-[90vw] h-[80vh] flex flex-col items-center justify-center rounded-2xl p-0 border border-border/30 bg-card/95 backdrop-blur-xl">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground mt-4">{blockError ? 'Failed to load block' : 'Block not found'}</p>
          <Button variant="outline" onClick={() => closeBlockChat()} className="mt-4">Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={() => closeBlockChat()}>
      <DialogContent hideCloseButton className="max-w-2xl w-[90vw] h-[80vh] max-h-[700px] flex flex-col rounded-2xl p-0 border border-border/30 bg-card/95 backdrop-blur-xl">
        <DialogHeader className="px-5 py-4 border-b border-border/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-base font-medium">{block.title}</DialogTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/20 h-auto", hasKeyForCurrentProvider ? "bg-secondary/50" : "bg-destructive/10")}>
                    {currentModel ? <ProviderBadge provider={currentModel.provider} model={currentModel.name} /> : <span className="text-sm text-muted-foreground">Select Model</span>}
                    {!hasKeyForCurrentProvider && <Lock className="h-3 w-3 text-destructive" />}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto bg-card/95 backdrop-blur-xl border-border/30 rounded-xl" align="start">
                  <div className="px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground border-b border-border/20"><Brain className="h-3 w-3" /><span>Switch model</span></div>
                  {providers.map((provider) => {
                    const hasKey = getProviderHasKey(provider.id);
                    const models = (modelsByProvider[provider.id] || []).slice(0, 6);
                    return (
                      <div key={provider.id}>
                        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: provider.color }} /><span className="text-xs font-medium">{provider.name}</span></div>
                          {hasKey ? <span className="flex items-center gap-1 text-[10px] text-green-500"><Zap className="h-2.5 w-2.5" />Connected</span> : <button onClick={(e) => { e.stopPropagation(); window.open(provider.apiKeyUrl, '_blank'); }} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"><ExternalLink className="h-2.5 w-2.5" />Get Key</button>}
                        </DropdownMenuLabel>
                        {models.map((model) => (
                          <DropdownMenuItem key={model.id} disabled={!hasKey} className={cn("mx-1 rounded-md", !hasKey && "opacity-50", block.model_id === model.id && "bg-primary/10")} onClick={() => hasKey && handleModelSwitch(model.id)}>
                            <span className="flex items-center gap-2 w-full"><span className={cn("w-1.5 h-1.5 rounded-full", block.model_id === model.id ? "bg-primary" : "bg-muted-foreground/30")} /><span className="text-sm truncate flex-1">{model.name}</span>{block.model_id === model.id && <Check className="h-3 w-3 text-primary" />}</span>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="my-1" />
                      </div>
                    );
                  })}
                  <DropdownMenuItem className="mx-1 rounded-md text-primary" onClick={() => navigate("/api-keys")}><Zap className="h-3 w-3 mr-2" />Manage API Keys</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {blockUsage && <span className="text-xs text-muted-foreground">{blockUsage.message_count} msgs · {formatBytes(blockUsage.total_bytes)}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="p-2 rounded-lg"><Settings className="h-4 w-4" /></Button></PopoverTrigger>
                <PopoverContent className="w-80 p-4 space-y-4 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl" side="bottom" align="end">
                  <div className="font-semibold text-sm">Block Settings</div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    {isEditingTitle ? (
                      <div className="flex gap-2"><Input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleTitleSave()} className="bg-secondary/50 rounded-lg border-border/30 h-9" autoFocus /><button className="p-2 rounded-lg" onClick={handleTitleSave}><Check className="h-3.5 w-3.5" /></button></div>
                    ) : (
                      <button onClick={() => { setTitle(block.title); setIsEditingTitle(true); }} className="w-full text-left p-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 flex items-center justify-between group text-sm"><span>{block.title}</span><Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" /></button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" className="p-2 rounded-lg" onClick={() => closeBlockChat()}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogHeader>

        {!hasKeyForCurrentProvider && currentProvider && (
          <div className="px-5 py-3 bg-destructive/10 border-b border-destructive/20 flex-shrink-0">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4 text-destructive" /><span>No API key for {PROVIDERS[currentProvider].name}</span></div><button onClick={() => navigate("/api-keys")} className="text-xs text-primary hover:underline">Add API Key</button></div>
          </div>
        )}

        {errorMessage && (
          <div className="px-5 py-3 bg-destructive/10 border-b border-destructive/20 flex-shrink-0">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" /><span>{errorMessage}</span></div><Button variant="ghost" size="sm" onClick={() => { setErrorMessage(null); setMessageStatus('idle'); }} className="text-xs">Dismiss</Button></div>
          </div>
        )}

        {incomingContext.length > 0 && (
          <div className="px-5 py-2 bg-primary/5 border-b border-primary/10 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Link2 className="h-3 w-3" /><span>Context from: {incomingContext.map(ctx => ctx.source_block_title).join(', ')}</span></div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messagesLoading ? <div className="flex items-center justify-center h-full"><Spinner className="h-6 w-6" /></div>
          : blockMessages.length === 0 && !streamingContent ? (
            <div className="flex flex-col items-center justify-center h-full text-center"><Sparkles className="h-8 w-8 text-muted-foreground/50 mb-3" /><p className="text-muted-foreground text-sm">{needsModelSelection ? "Select a model above to start chatting" : "Start a conversation"}</p></div>
          ) : (
            <>
              {blockMessages.map((message) => (
                <ChatMessage key={message.id} message={toDisplayMessage(message)} onRetry={message.role === 'assistant' ? () => handleRetry(toDisplayMessage(message)) : undefined} onDelete={() => handleDeleteMessage(message.id)} />
              ))}
              {streamingContent && <ChatMessage message={{ id: 'streaming', block_id: blockId, role: 'assistant', content: streamingContent, size_bytes: 0, created_at: new Date().toISOString() }} isStreaming />}
              {messageStatus === 'waiting_llm' && !streamingContent && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Spinner className="h-4 w-4" />
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border/20 flex-shrink-0">
          <ChatInput onSend={handleSend} onStop={handleStop} isRunning={isRunning} disabled={needsModelSelection || !hasKeyForCurrentProvider} placeholder={needsModelSelection ? "Select a model..." : !hasKeyForCurrentProvider ? "Add an API key..." : "Type a message..."} />
        </div>
      </DialogContent>
    </Dialog>
  );
}