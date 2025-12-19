import { useState, useRef, useEffect, useCallback } from "react";
import { X, Settings, Pencil, Check, Quote, Sparkles, ChevronDown, Brain, Zap, Lock, ExternalLink, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProviderBadge } from "@/components/ui/provider-badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { useBlockMessages, useBlockUsage, formatBytes } from "@/hooks/useBlockMessages";
import { useTextSelection } from "@/hooks/useTextSelection";
import { TextSelectionPopover } from "./TextSelectionPopover";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { chatService, type ChatAttachment } from "@/services/chatService";
import { useUserApiKeys } from "@/hooks/useApiKeys";
import { useModelsGroupedByProvider, useAvailableProviders } from "@/hooks/useModelConfig";
import { useBlockIncomingContext } from "@/hooks/useBlockConnections";
import { getModelConfig, PROVIDERS, type Provider } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface BlockChatModalProps {
  blockId: string;
}

export function BlockChatModal({ blockId }: BlockChatModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { blocks, closeBlockChat, deleteMessage, updateBlock, addMessage } = useAppStore();
  const block = blocks.find((b) => b.id === blockId);
  
  const userApiKeys = useUserApiKeys();
  const modelsByProvider = useModelsGroupedByProvider();
  const providers = useAvailableProviders();
  const blockMessages = useBlockMessages(blockId);
  const blockUsage = useBlockUsage(blockId);
  const incomingContext = useBlockIncomingContext(blockId);
  
  const { selectedText, messageId, selectionRect, hasSelection, clearSelection } = 
    useTextSelection(messagesContainerRef);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [blockMessages, streamingContent]);

  useEffect(() => {
    if (block) setTitle(block.title);
  }, [block]);

  const currentModel = block?.model_id ? getModelConfig(block.model_id) : null;
  const currentProvider = currentModel?.provider;
  const needsModelSelection = !block?.model_id || !currentModel;
  const hasKeyForCurrentProvider = currentProvider 
    ? userApiKeys.some(k => k.provider === currentProvider)
    : false;

  const getProviderHasKey = (provider: Provider) => 
    userApiKeys.some(k => k.provider === provider);

  const handleModelSwitch = (newModelId: string) => {
    const newModel = getModelConfig(newModelId);
    if (!newModel) return;
    
    const hasKey = getProviderHasKey(newModel.provider);
    if (!hasKey) {
      toast.error(`Add an API key for ${PROVIDERS[newModel.provider].name} first`);
      return;
    }
    
    updateBlock(blockId, { model_id: newModelId });
    toast.success(`Switched to ${newModel.name}`);
  };

  const handleTitleSave = () => {
    if (title.trim()) {
      updateBlock(blockId, { title: title.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleSend = useCallback(async (content: string, attachments?: ChatAttachment[]) => {
    if (!content.trim() || isRunning || !block) return;
    
    if (!hasKeyForCurrentProvider) {
      toast.error("No API key configured", {
        description: `Add an API key for ${currentProvider ? PROVIDERS[currentProvider].name : 'this provider'}`,
        action: { label: "Add Key", onClick: () => navigate("/api-keys") }
      });
      return;
    }

    // Add user message
    const userMessage = addMessage({
      block_id: blockId,
      role: 'user',
      content: content,
    });

    setIsRunning(true);
    setStreamingContent("");

    // Build incoming block context from connections
    const connectedContext = incomingContext.length > 0
      ? incomingContext.map(ctx => `[From "${ctx.source_block_title}"]:\n${ctx.content}`).join('\n\n')
      : undefined;

    // Build conversation history with model identity and connected block context
    const history = chatService.buildConversationHistory(
      [...blockMessages, userMessage],
      block.model_id,
      block.system_prompt,
      block.source_context?.selected_text,
      connectedContext
    );

    // Real API call to the selected provider
    await chatService.streamChat(
      block.model_id,
      history,
      {
        onChunk: (chunk) => {
          setStreamingContent(prev => prev + chunk);
        },
        onComplete: (fullResponse, meta) => {
          addMessage({
            block_id: blockId,
            role: 'assistant',
            content: fullResponse,
            meta,
          });
          setStreamingContent("");
          setIsRunning(false);
        },
        onError: (error) => {
          toast.error("API Error", { description: error });
          setStreamingContent("");
          setIsRunning(false);
        },
      }
    );
  }, [block, blockId, blockMessages, hasKeyForCurrentProvider, currentProvider, isRunning, addMessage, navigate, incomingContext]);

  const handleStop = useCallback(() => {
    chatService.stopGeneration();
    if (streamingContent) {
      addMessage({
        block_id: blockId,
        role: 'assistant',
        content: streamingContent + " [stopped]",
      });
    }
    setStreamingContent("");
    setIsRunning(false);
  }, [blockId, streamingContent, addMessage]);

  const handleRetry = useCallback(async (message: any) => {
    // Find the user message before this assistant message
    const messageIndex = blockMessages.findIndex(m => m.id === message.id);
    if (messageIndex <= 0) return;

    const userMessage = blockMessages[messageIndex - 1];
    if (userMessage.role !== 'user') return;

    // Delete the old assistant message
    deleteMessage(message.id);

    // Re-send with the same user message content
    handleSend(userMessage.content);
  }, [blockMessages, deleteMessage, handleSend]);

  const handleGoToApiKeys = () => navigate("/api-keys");

  if (!block) return null;

  return (
    <Dialog open onOpenChange={() => closeBlockChat()}>
      <DialogContent hideCloseButton className="max-w-2xl w-[90vw] h-[80vh] max-h-[700px] flex flex-col rounded-2xl p-0 border border-border/30 bg-card/95 backdrop-blur-xl shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.6)]">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-border/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-base font-medium">{block.title}</DialogTitle>
              
              {/* Model Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all group border border-border/20",
                    hasKeyForCurrentProvider ? "bg-secondary/50 hover:bg-secondary/70" : "bg-destructive/10 border-destructive/30"
                  )}>
                    {currentModel ? (
                      <ProviderBadge provider={currentModel.provider} model={currentModel.name} />
                    ) : (
                      <span className="text-sm text-muted-foreground">Select Model</span>
                    )}
                    {!hasKeyForCurrentProvider && <Lock className="h-3 w-3 text-destructive" />}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto bg-card/95 backdrop-blur-xl border-border/30 rounded-xl" align="start">
                  <div className="px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground border-b border-border/20">
                    <Brain className="h-3 w-3" />
                    <span>Switch model - chat history preserved</span>
                  </div>
                  
                  {providers.map((provider) => {
                    const hasKey = getProviderHasKey(provider.id);
                    const models = (modelsByProvider[provider.id] || []).slice(0, 6);
                    
                    return (
                      <div key={provider.id}>
                        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: provider.color }} />
                            <span className="text-xs font-medium">{provider.name}</span>
                          </div>
                          {hasKey ? (
                            <span className="flex items-center gap-1 text-[10px] text-green-500">
                              <Zap className="h-2.5 w-2.5" />Connected
                            </span>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); window.open(provider.apiKeyUrl, '_blank'); }}
                              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                              <ExternalLink className="h-2.5 w-2.5" />Get Key
                            </button>
                          )}
                        </DropdownMenuLabel>
                        {models.map((model) => (
                          <DropdownMenuItem key={model.id} disabled={!hasKey}
                            className={cn("mx-1 rounded-md", !hasKey && "opacity-50", block.model_id === model.id && "bg-primary/10")}
                            onClick={() => hasKey && handleModelSwitch(model.id)}>
                            <span className="flex items-center gap-2 w-full">
                              <span className={cn("w-1.5 h-1.5 rounded-full", block.model_id === model.id ? "bg-primary" : "bg-muted-foreground/30")} />
                              <span className="text-sm truncate flex-1">{model.name}</span>
                              {!hasKey && <Lock className="h-3 w-3 text-muted-foreground" />}
                              {block.model_id === model.id && <Check className="h-3 w-3 text-primary" />}
                            </span>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="my-1" />
                      </div>
                    );
                  })}
                  
                  <DropdownMenuItem className="mx-1 rounded-md text-primary" onClick={handleGoToApiKeys}>
                    <Zap className="h-3 w-3 mr-2" />Manage API Keys
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {blockUsage && (
                <span className="text-xs text-muted-foreground">
                  {blockUsage.message_count} msgs · {formatBytes(blockUsage.total_bytes)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="key-icon-3d p-2 rounded-lg"><Settings className="h-4 w-4" /></button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 space-y-4 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl" side="bottom" align="end">
                  <div className="font-semibold text-sm">Block Settings</div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    {isEditingTitle ? (
                      <div className="flex gap-2">
                        <Input value={title} onChange={(e) => setTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                          className="bg-secondary/50 rounded-lg border-border/30 h-9" autoFocus />
                        <button className="key-icon-3d p-2 rounded-lg" onClick={handleTitleSave}>
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setTitle(block.title); setIsEditingTitle(true); }}
                        className="w-full text-left p-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors flex items-center justify-between group text-sm">
                        <span>{block.title}</span>
                        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <button className="key-icon-3d p-2 rounded-lg" onClick={() => closeBlockChat()}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* No API Key Warning */}
        {!hasKeyForCurrentProvider && currentProvider && (
          <div className="px-5 py-3 bg-destructive/10 border-b border-destructive/20 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-destructive" />
                <span>No API key for {PROVIDERS[currentProvider].name}</span>
              </div>
              <button onClick={handleGoToApiKeys} className="text-xs text-primary hover:underline">Add API Key</button>
            </div>
          </div>
        )}

        {/* Source Context */}
        {block.source_context && (
          <div className="px-5 py-3 bg-accent/10 border-b border-accent/20 flex-shrink-0">
            <div className="flex items-start gap-2">
              <Quote className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Sparkles className="h-3 w-3 text-accent" />
                  <span>Context from <strong>{block.source_context.source_block_title}</strong></span>
                </div>
                <p className="text-sm line-clamp-2 text-foreground/80">"{block.source_context.selected_text}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Connected Block Context Indicator */}
        {incomingContext.length > 0 && (
          <div className="px-5 py-2 bg-primary/5 border-b border-primary/20 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <Link2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">
                Receiving context from {incomingContext.length} connected {incomingContext.length === 1 ? 'block' : 'blocks'}:
              </span>
              <span className="text-foreground font-medium">
                {incomingContext.map(ctx => ctx.source_block_title).join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Model Selection Screen */}
        {needsModelSelection ? (
          <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Select a Model</h3>
              <p className="text-sm text-muted-foreground max-w-xs">Choose an AI model to start chatting</p>
            </div>
            <div className="w-full max-w-sm space-y-3">
              {providers.slice(0, 4).map((provider) => {
                const hasKey = getProviderHasKey(provider.id);
                const models = (modelsByProvider[provider.id] || []).slice(0, 3);
                return (
                  <div key={provider.id} className="rounded-xl border border-border/30 p-3 bg-secondary/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: provider.color }} />
                        <span className="text-sm font-medium">{provider.name}</span>
                      </div>
                      {hasKey ? (
                        <span className="flex items-center gap-1 text-[10px] text-green-500"><Zap className="h-2.5 w-2.5" />Ready</span>
                      ) : (
                        <button onClick={() => window.open(provider.apiKeyUrl, '_blank')} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                          <ExternalLink className="h-2.5 w-2.5" />Get Key
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {models.map((model) => (
                        <button key={model.id} disabled={!hasKey} onClick={() => hasKey && handleModelSwitch(model.id)}
                          className={cn("px-2 py-1 text-xs rounded-lg transition-all",
                            hasKey ? "bg-secondary/50 hover:bg-secondary text-foreground cursor-pointer" : "bg-muted/30 text-muted-foreground cursor-not-allowed")}>
                          {model.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <button onClick={handleGoToApiKeys} className="w-full py-2 text-sm text-primary hover:underline flex items-center justify-center gap-2">
                <Zap className="h-3 w-3" />Manage API Keys
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-auto px-5 py-4 space-y-4">
              {blockMessages.length === 0 && !streamingContent && (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm mb-1">Start a conversation</p>
                  <p className="text-xs opacity-70">
                    {block.source_context ? "Use the context above to guide your conversation" : "Send a message to interact with this block"}
                  </p>
                </div>
              )}

              {blockMessages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onDelete={deleteMessage}
                  onRetry={msg.role === 'assistant' ? handleRetry : undefined}
                />
              ))}

              {/* Streaming message */}
              {streamingContent && (
                <ChatMessage
                  message={{
                    id: 'streaming',
                    block_id: blockId,
                    role: 'assistant',
                    content: streamingContent,
                    size_bytes: 0,
                    created_at: new Date().toISOString(),
                  }}
                  isStreaming
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Text Selection Popover */}
            {hasSelection && messageId && (
              <TextSelectionPopover selectedText={selectedText} messageId={messageId} blockId={blockId}
                boardId={block.board_id} selectionRect={selectionRect} containerRef={messagesContainerRef} onClose={clearSelection} />
            )}

            {/* Input */}
            <ChatInput
              onSend={handleSend}
              onStop={handleStop}
              isRunning={isRunning}
              disabled={!hasKeyForCurrentProvider}
              placeholder={hasKeyForCurrentProvider ? "Type your message..." : "Add an API key to send messages..."}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
