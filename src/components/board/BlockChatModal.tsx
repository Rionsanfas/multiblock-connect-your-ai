/**
 * BlockChatModal - Supabase-backed chat interface
 * 
 * CRITICAL: All messages are persisted to Supabase.
 * No Zustand-only messages allowed.
 * 
 * Features:
 * - Text selection referencing (attach quoted text to next message)
 * - Branch to new block (create new block from selected text)
 */

import { useState, useRef, useEffect, useCallback, MouseEvent as ReactMouseEvent } from "react";
import { X, Settings, Pencil, Check, Sparkles, ChevronDown, Brain, Zap, Lock, ExternalLink, Link2, AlertCircle, Maximize2, Minimize2, PanelLeftClose, PanelLeft, MessageSquare, Image, Video, ArrowDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProviderBadge } from "@/components/ui/provider-badge";
import { Spinner } from "@/components/ui/spinner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store/useAppStore";
import { useBlockMessages, useMessageActions, useBlockUsage, formatBytes } from "@/hooks/useBlockMessages";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { chatService, type ChatAttachment } from "@/services/chatService";
import { useUserApiKeys } from "@/hooks/useApiKeys";
import { useModelsGroupedByProvider, useAvailableProviders, useModelsGroupedByTypeAndProvider } from "@/hooks/useModelConfig";
import { useBlockIncomingContext } from "@/hooks/useBlockConnections";
import { useBlockContextSync } from "@/hooks/useConnectionSync";
import { useBlock } from "@/hooks/useBlockData";
import { useBoardBlocks } from "@/hooks/useBoardBlocks";
import { blocksDb, messagesDb } from "@/lib/database";
import { getModelConfig, PROVIDERS, type Provider } from "@/config/models";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Message as LegacyMessage } from "@/types";
import type { ChatReference } from "@/types/chat-references";
import { createReference, formatReferencesForContext } from "@/types/chat-references";
interface BlockChatModalProps {
  blockId: string;
}
type MessageStatus = 'idle' | 'waiting_llm' | 'error';

// Transform DB message to legacy Message format for ChatMessage component
function toDisplayMessage(m: {
  id: string;
  block_id: string;
  role: string;
  content: string;
  meta?: unknown;
  size_bytes?: number | null;
  created_at: string;
}): LegacyMessage {
  return {
    id: m.id,
    block_id: m.block_id,
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
    meta: m.meta as LegacyMessage['meta'],
    size_bytes: m.size_bytes || 0,
    created_at: m.created_at
  };
}
export function BlockChatModal({
  blockId
}: BlockChatModalProps) {
  const [messageStatus, setMessageStatus] = useState<MessageStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  // CRITICAL: Sidebar starts CLOSED when entering fullscreen
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);
  const [isSwitchingModel, setIsSwitchingModel] = useState(false);

  // References state
  const [pendingReferences, setPendingReferences] = useState<ChatReference[]>([]);

  // Sidebar resize constants
  const MIN_SIDEBAR_WIDTH = 180;
  const MAX_SIDEBAR_WIDTH = 320;

  // Handle sidebar resize
  const handleResizeStart = useCallback((e: ReactMouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, startWidth + delta));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidebarWidth]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Smart auto-scroll state - only auto-scroll when user is at bottom
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    data: supabaseBlock,
    isLoading: blockLoading,
    error: blockError
  } = useBlock(blockId);
  const {
    closeBlockChat,
    openBlockChat
  } = useAppStore();
  const block = supabaseBlock ? {
    id: supabaseBlock.id,
    board_id: supabaseBlock.board_id,
    title: supabaseBlock.title || 'Untitled Block',
    model_id: supabaseBlock.model_id,
    system_prompt: supabaseBlock.system_prompt || '',
    position: {
      x: supabaseBlock.position_x,
      y: supabaseBlock.position_y
    },
    created_at: supabaseBlock.created_at,
    updated_at: supabaseBlock.updated_at
  } : null;
  const userApiKeys = useUserApiKeys();
  const modelsByProvider = useModelsGroupedByProvider();
  const {
    chat: chatModels,
    image: imageModels,
    video: videoModels
  } = useModelsGroupedByTypeAndProvider();
  const providers = useAvailableProviders();
  const {
    messages: blockMessages,
    isLoading: messagesLoading
  } = useBlockMessages(blockId);
  const {
    sendMessage: persistMessage,
    deleteMessage: deletePersistedMessage
  } = useMessageActions(blockId);
  const blockUsage = useBlockUsage(blockId);
  const incomingContext = useBlockIncomingContext(blockId);

  // Live sync: automatically update context when connected blocks send messages
  useBlockContextSync(blockId);

  // Model selector tab state
  const [modelTab, setModelTab] = useState<'chat' | 'image' | 'video'>('chat');

  // Get all blocks on this board for the sidebar
  const boardBlocks = useBoardBlocks(block?.board_id || '');
  // Smart auto-scroll: only scroll if user is at bottom
  useEffect(() => {
    if (isUserAtBottom) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth"
      });
    }
  }, [blockMessages, streamingContent, isUserAtBottom]);
  
  // Handle scroll events to detect user position
  const handleChatScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    
    const threshold = 100; // pixels from bottom
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    
    setIsUserAtBottom(isNearBottom);
    setShowScrollButton(!isNearBottom);
  }, []);
  
  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsUserAtBottom(true);
    setShowScrollButton(false);
  }, []);
  useEffect(() => {
    if (block) setTitle(block.title);
  }, [block?.title]);
  const currentModel = block?.model_id ? getModelConfig(block.model_id) : null;
  const currentProvider = currentModel?.provider;
  const needsModelSelection = !block?.model_id || !currentModel;
  const hasKeyForCurrentProvider = currentProvider ? userApiKeys.keys.some(k => k.provider === currentProvider) : false;
  const getProviderHasKey = (provider: Provider) => userApiKeys.keys.some(k => k.provider === provider);
  const handleModelSwitch = async (newModelId: string) => {
    // Prevent switching while already switching or while sending
    if (isSwitchingModel || messageStatus !== 'idle') {
      toast.error("Please wait for the current operation to complete");
      return;
    }
    const newModel = getModelConfig(newModelId);
    if (!newModel) {
      toast.error("Invalid model selected");
      return;
    }
    if (!getProviderHasKey(newModel.provider)) {
      toast.error(`Add an API key for ${PROVIDERS[newModel.provider].name} first`, {
        action: {
          label: "Get Key",
          onClick: () => window.open(PROVIDERS[newModel.provider].apiKeyUrl, '_blank')
        }
      });
      return;
    }
    setIsSwitchingModel(true);
    setErrorMessage(null);
    try {
      // Persist to Supabase immediately
      await blocksDb.update(blockId, {
        model_id: newModelId
      });

      // Update React Query cache for this block
      queryClient.setQueryData(['block', blockId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          model_id: newModelId
        };
      });

      // Also update the board-blocks cache if available
      const allCacheKeys = queryClient.getQueryCache().getAll();
      for (const query of allCacheKeys) {
        if (query.queryKey[0] === 'board-blocks') {
          queryClient.setQueryData(query.queryKey, (old: any[]) => {
            if (!Array.isArray(old)) return old;
            return old.map(b => b.id === blockId ? {
              ...b,
              model_id: newModelId
            } : b);
          });
        }
      }
      toast.success(`Switched to ${newModel.name}`);
    } catch (error) {
      console.error('[BlockChatModal] Model switch failed:', error);
      toast.error("Failed to switch model. Please try again.");
    } finally {
      setIsSwitchingModel(false);
    }
  };
  const handleTitleSave = async () => {
    if (title.trim() && blockId) {
      try {
        await blocksDb.update(blockId, {
          title: title.trim()
        });
        queryClient.invalidateQueries({
          queryKey: ['block', blockId]
        });
      } catch {
        toast.error('Failed to save title');
      }
    }
    setIsEditingTitle(false);
  };
  const handleSend = useCallback(async (content: string, attachments?: ChatAttachment[], references?: ChatReference[]) => {
    // Block sending while model is switching
    if (isSwitchingModel) {
      toast.error("Please wait for model switch to complete");
      return;
    }
    if (!content.trim() && (!references || references.length === 0) || messageStatus !== 'idle' || !block) return;

    // Pre-flight validation: ensure we have a valid model
    const activeModelId = block.model_id;
    if (!activeModelId) {
      setErrorMessage("Please select a model first");
      toast.error("No model selected", {
        action: {
          label: "Select Model",
          onClick: () => {}
        }
      });
      return;
    }
    const activeModelConfig = getModelConfig(activeModelId);
    if (!activeModelConfig) {
      setErrorMessage(`Invalid model: ${activeModelId}`);
      toast.error("Selected model is not valid. Please choose another.");
      return;
    }

    // Validate API key exists for the provider
    if (!hasKeyForCurrentProvider) {
      setErrorMessage(`No API key for ${PROVIDERS[activeModelConfig.provider].name}`);
      toast.error("No API key configured", {
        action: {
          label: "Add Key",
          onClick: () => navigate("/settings/keys")
        }
      });
      return;
    }
    setErrorMessage(null);

    // Build content with references
    let fullContent = content;
    if (references && references.length > 0) {
      const referencesContext = formatReferencesForContext(references);
      fullContent = `${referencesContext}\n\n${content}`;
    }

    // 1) Append locally (optimistic) so UI is instant
    let userMessage;
    try {
      userMessage = await persistMessage('user', fullContent);
    } catch {
      setMessageStatus('error');
      setErrorMessage('Message failed to send.');
      return;
    }

    // 2) Start the LLM request immediately (no refetch)
    setMessageStatus('waiting_llm');
    setStreamingContent("");
    const connectedContext = incomingContext.length > 0 ? incomingContext.map(ctx => `[From "${ctx.source_block_title}"]:\n${ctx.content}`).join('\n\n') : undefined;
    const cacheMessages = queryClient.getQueryData(['block-messages', blockId]) as any[] | undefined ?? [];
    const history = chatService.buildConversationHistory(cacheMessages.map(m => toDisplayMessage(m)), activeModelId,
    // Use validated model ID
    block.system_prompt, undefined, connectedContext);

    // Use the validated model ID for the request, pass boardId for API key resolution
    await chatService.streamChat(
      activeModelId,
      history,
      {
        onChunk: (chunk) => setStreamingContent((prev) => prev + chunk),
        onComplete: (response, meta) => {
          // 3) Convert streaming -> real assistant message instantly, then persist in background
          persistMessage('assistant', response, meta as Record<string, unknown>);
          setStreamingContent("");
          setMessageStatus('idle');
        },
        onError: (errorMsg) => {
          setMessageStatus('error');
          // Surface the actual error message from chatService instead of generic
          setErrorMessage(errorMsg || 'Assistant failed. Please try again.');
          setStreamingContent("");

          // Log for debugging
          console.error('[BlockChatModal] Chat error:', errorMsg);
        },
      },
      undefined,
      // config
      attachments,
      block.board_id,
      block.id
    );
  }, [block, blockId, hasKeyForCurrentProvider, incomingContext, isSwitchingModel, messageStatus, navigate, persistMessage, queryClient]);
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

  // Show brief loading state - optimistic blocks should load instantly from cache
  if (blockLoading) {
    return <Dialog open onOpenChange={() => closeBlockChat()}>
        <DialogContent className="max-w-2xl w-[90vw] h-[80vh] flex flex-col items-center justify-center rounded-2xl p-0 border border-border/30 bg-card/95 backdrop-blur-xl">
          <Spinner className="h-8 w-8" /><p className="text-muted-foreground mt-4">Loading block...</p>
        </DialogContent>
      </Dialog>;
  }

  // Only show error after loading completes and block genuinely not found
  // This prevents false "not found" for optimistic blocks
  if (!blockLoading && (blockError || !block)) {
    return <Dialog open onOpenChange={() => closeBlockChat()}>
        <DialogContent className="max-w-2xl w-[90vw] h-[80vh] flex flex-col items-center justify-center rounded-2xl p-0 border border-border/30 bg-card/95 backdrop-blur-xl">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground mt-4">{blockError ? 'Failed to load block' : 'Block not found'}</p>
          <Button variant="outline" onClick={() => closeBlockChat()} className="mt-4">Close</Button>
        </DialogContent>
      </Dialog>;
  }
  return <>
      <Dialog open onOpenChange={() => closeBlockChat()}>
        <DialogContent hideCloseButton className={cn("flex flex-col rounded-xl sm:rounded-2xl p-0 border border-border/30 bg-card/95 backdrop-blur-xl transition-all duration-300", isFullscreen ? "w-[100vw] h-[100dvh] max-w-none max-h-none rounded-none" : "w-[98vw] sm:w-[95vw] md:w-[90vw] max-w-2xl h-[92dvh] sm:h-[90dvh] md:h-[80vh] max-h-none sm:max-h-[700px]")}>
        <DialogHeader className="px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 border-b border-border/20 flex-shrink-0">
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                {/* Sidebar toggle - only show in fullscreen */}
                {isFullscreen && <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 p-1 sm:p-1.5 rounded-lg flex-shrink-0" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <PanelLeftClose className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <PanelLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  </Button>}
                <DialogTitle className="text-xs sm:text-sm font-medium truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none">{block.title}</DialogTitle>
                {/* Model selector - responsive sizing */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" disabled={isSwitchingModel} className={cn("flex items-center gap-1 sm:gap-1.5 md:gap-2 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg border border-border/20 h-auto text-[10px] sm:text-xs", hasKeyForCurrentProvider ? "bg-secondary/50" : "bg-destructive/10")}>
                      {isSwitchingModel ? <>
                          <Spinner className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="text-[10px] sm:text-xs hidden sm:inline">Switching...</span>
                        </> : currentModel ? <ProviderBadge provider={currentModel.provider} model={currentModel.name} /> : <span className="text-[10px] sm:text-xs text-muted-foreground">Select</span>}
                      {!hasKeyForCurrentProvider && !isSwitchingModel && <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-destructive" />}
                      <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[280px] sm:w-80 max-h-[400px] sm:max-h-[450px] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/30 rounded-xl" align="start">
                    <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground border-b border-border/20">
                      <Brain className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span>Switch model</span>
                    </div>
                    
                    {/* Type tabs - responsive */}
                    <div className="flex gap-0.5 sm:gap-1 p-1.5 sm:p-2 border-b border-border/20">
                      <button onClick={() => setModelTab('chat')} className={cn("flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap", modelTab === 'chat' ? "bg-primary text-primary-foreground" : "hover:bg-secondary/60 text-muted-foreground")}>
                        <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                        <span className="shrink-0">Chat</span> <span className="shrink-0">({Object.values(chatModels).flat().length})</span>
                      </button>
                      <button onClick={() => setModelTab('image')} className={cn("flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap", modelTab === 'image' ? "bg-purple-500 text-white" : "hover:bg-secondary/60 text-muted-foreground")}>
                        <Image className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                        <span className="shrink-0">Image</span> <span className="shrink-0">({Object.values(imageModels).flat().length})</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          toast.info("Video generation is coming soon!", {
                            description: "This feature is not available right now."
                          });
                        }} 
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap opacity-50 cursor-not-allowed text-muted-foreground"
                        disabled
                      >
                        <Video className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                        <span className="shrink-0">Video</span> <span className="shrink-0">({Object.values(videoModels).flat().length})</span>
                      </button>
                    </div>

                    {/* Models list based on active tab */}
                    {(() => {
                    const modelsToShow = modelTab === 'chat' ? chatModels : modelTab === 'image' ? imageModels : videoModels;
                    const providersWithModels = providers.filter(p => modelsToShow[p.id]?.length > 0);
                    if (providersWithModels.length === 0) {
                      return <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                            No {modelTab} models available
                          </div>;
                    }
                    return providersWithModels.map(provider => {
                      const hasKey = getProviderHasKey(provider.id);
                      const models = modelsToShow[provider.id] || [];
                      return <div key={provider.id}>
                            <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{
                              backgroundColor: provider.color
                            }} />
                                <span className="text-xs font-medium">{provider.name}</span>
                              </div>
                              {hasKey ? <span className="flex items-center gap-1 text-[10px] text-green-500">
                                  <Zap className="h-2.5 w-2.5" />Connected
                                </span> : <button onClick={e => {
                            e.stopPropagation();
                            window.open(provider.apiKeyUrl, '_blank', 'noopener,noreferrer');
                          }} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                                  <ExternalLink className="h-2.5 w-2.5" />Get Key
                                </button>}
                            </DropdownMenuLabel>
                            {models.map(model => <DropdownMenuItem key={model.id} disabled={!hasKey || isSwitchingModel} className={cn("mx-1 rounded-md", !hasKey && "opacity-50", block.model_id === model.id && "bg-primary/10")} onClick={() => hasKey && !isSwitchingModel && handleModelSwitch(model.id)}>
                                <span className="flex items-center gap-2 w-full">
                                  <span className={cn("w-1.5 h-1.5 rounded-full", block.model_id === model.id ? "bg-primary" : "bg-muted-foreground/30")} />
                                  <span className="text-sm truncate flex-1">{model.name}</span>
                                  {model.type === 'image' && <Image className="h-3 w-3 text-white" />}
                                  {model.type === 'video' && <Video className="h-3 w-3 text-white" />}
                                  {block.model_id === model.id && <Check className="h-3 w-3 text-primary" />}
                                </span>
                              </DropdownMenuItem>)}
                            <DropdownMenuSeparator className="my-1" />
                          </div>;
                    });
                  })()}
                    <DropdownMenuItem className="mx-1 rounded-md text-primary" onClick={() => navigate("/settings/keys")}>
                      <Zap className="h-3 w-3 mr-2" />Manage API Keys
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {blockUsage && <span className="hidden xs:inline text-[10px] sm:text-xs text-muted-foreground">{blockUsage.message_count} msgs · {formatBytes(blockUsage.total_bytes)}</span>}
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Popover>
                  <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 p-1 sm:p-1.5 rounded-lg"><Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button></PopoverTrigger>
                  <PopoverContent className="w-[260px] sm:w-80 p-3 sm:p-4 space-y-3 sm:space-y-4 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl" side="bottom" align="end">
                    <div className="font-semibold text-xs sm:text-sm">Block Settings</div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label className="text-[10px] sm:text-xs text-muted-foreground">Title</Label>
                      {isEditingTitle ? <div className="flex gap-1.5 sm:gap-2"><Input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && handleTitleSave()} className="bg-secondary/50 rounded-lg border-border/30 h-8 sm:h-9 text-sm" autoFocus /><button className="p-1.5 sm:p-2 rounded-lg" onClick={handleTitleSave}><Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></button></div> : <button onClick={() => {
                      setTitle(block.title);
                      setIsEditingTitle(true);
                    }} className="w-full text-left p-1.5 sm:p-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 flex items-center justify-between group text-xs sm:text-sm"><span>{block.title}</span><Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-0 group-hover:opacity-100" /></button>}
                    </div>
                  </PopoverContent>
                </Popover>
                {/* Fullscreen toggle button */}
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 p-1 sm:p-1.5 rounded-lg" onClick={() => setIsFullscreen(!isFullscreen)}>
                  {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 p-1 sm:p-1.5 rounded-lg" onClick={() => closeBlockChat()}><X className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
              </div>
            </div>
          </DialogHeader>

          {!hasKeyForCurrentProvider && currentProvider && <div className="px-3 sm:px-5 py-2 sm:py-3 bg-destructive/10 border-b border-destructive/20 flex-shrink-0">
              <div className="flex items-center justify-between"><div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"><Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" /><span>No API key for {PROVIDERS[currentProvider].name}</span></div><button onClick={() => navigate("/settings/keys")} className="text-[10px] sm:text-xs text-primary hover:underline">Add Key</button></div>
            </div>}

          {errorMessage && <div className="px-3 sm:px-5 py-2 sm:py-3 bg-destructive/10 border-b border-destructive/20 flex-shrink-0">
              <div className="flex items-center justify-between"><div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-destructive"><AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /><span className="truncate">{errorMessage}</span></div><Button variant="ghost" size="sm" onClick={() => {
              setErrorMessage(null);
              setMessageStatus('idle');
            }} className="text-[10px] sm:text-xs h-7">Dismiss</Button></div>
            </div>}

          {incomingContext.length > 0 && <div className="px-3 sm:px-5 py-1.5 sm:py-2 bg-primary/5 border-b border-primary/10 flex-shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground"><Link2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" /><span className="truncate">Context from: {incomingContext.map(ctx => ctx.source_block_title).join(', ')}</span></div>
            </div>}

          {incomingContext.length > 0 && <div className="px-5 py-2 bg-primary/5 border-b border-primary/10 flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Link2 className="h-3 w-3" /><span>Context from: {incomingContext.map(ctx => ctx.source_block_title).join(', ')}</span></div>
            </div>}

          {/* Main content area with optional sidebar */}
          <div className="flex-1 flex overflow-hidden">
            {/* Premium Sidebar with 3D glass effect and smooth animations */}
            {isFullscreen && <aside style={{
            width: isSidebarOpen ? sidebarWidth : 0
          }} className={cn("chat-sidebar flex-shrink-0 flex flex-col relative", "bg-gradient-to-b from-card/95 via-card/90 to-card/85", "backdrop-blur-2xl border-r border-border/10", "transition-[opacity,transform] duration-300 ease-out", isSidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 overflow-hidden")}>
                {/* Sidebar header with subtle depth */}
                <div className="p-4 pb-2 border-b border-border/5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Board Chats
                  </h3>
                </div>
                
                {/* Resize handle */}
                <div onMouseDown={handleResizeStart} className={cn("absolute top-0 right-0 w-1 h-full cursor-col-resize z-10", "transition-all duration-150", "hover:bg-primary/40 hover:shadow-[0_0_8px_2px_rgba(var(--primary),0.3)]", isResizing && "bg-primary/60 shadow-[0_0_12px_4px_rgba(var(--primary),0.4)]")} />
                
                {/* Navigation with premium styling */}
                <ScrollArea className="flex-1 py-2">
                  <nav className="px-2 space-y-0.5">
                    {boardBlocks.map(b => {
                  const isActive = b.id === blockId;
                  const bModelConfig = b.model_id ? getModelConfig(b.model_id) : null;
                  return <button key={b.id} onClick={() => openBlockChat(b.id)} className={cn("chat-sidebar-item group relative flex items-center gap-2.5 w-full text-left", "px-3 py-2.5 rounded-lg transition-all duration-200", isActive ? "bg-secondary/80 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40")}>
                          {/* Glowing side indicator - premium 3D effect */}
                          <span className={cn("absolute right-0 top-1/2 -translate-y-1/2 w-[3px] rounded-l-full transition-all duration-300 ease-out", isActive ? "h-8 bg-gradient-to-b from-amber-400 via-amber-300 to-amber-400 opacity-100 shadow-[0_0_16px_4px_rgba(251,191,36,0.4),-2px_0_8px_rgba(251,191,36,0.3)]" : "h-5 opacity-0 bg-amber-400/50 group-hover:opacity-50 group-hover:shadow-[0_0_8px_2px_rgba(251,191,36,0.2)]")} />
                          
                          {/* Icon with subtle 3D effect */}
                          <div className={cn("p-1.5 rounded-md transition-all duration-200", isActive ? "bg-secondary/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.2)]" : "bg-transparent group-hover:bg-secondary/30")}>
                            <MessageSquare className={cn("h-3.5 w-3.5 transition-all duration-200", isActive ? "text-foreground drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]" : "text-muted-foreground group-hover:text-foreground")} />
                          </div>
                          
                          {/* Text content */}
                          <div className="flex-1 min-w-0">
                            <span className={cn("text-sm font-medium truncate block transition-all duration-200", isActive && "text-foreground")}>
                              {b.title}
                            </span>
                            {bModelConfig && <span className="text-[10px] text-muted-foreground/60 truncate block mt-0.5">
                                {bModelConfig.name}
                              </span>}
                          </div>
                        </button>;
                })}
                  </nav>
                </ScrollArea>
              </aside>}

            {/* Chat content area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div 
                ref={chatContainerRef} 
                onScroll={handleChatScroll}
                className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-5 py-3 sm:py-4 space-y-4 sm:space-y-5"
              >
                {messagesLoading ? <div className="flex items-center justify-center h-full"><Spinner className="h-5 w-5 sm:h-6 sm:w-6" /></div> : blockMessages.length === 0 && !streamingContent ? <div className="flex flex-col items-center justify-center h-full text-center px-4"><Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50 mb-2 sm:mb-3" /><p className="text-muted-foreground text-sm sm:text-base">{needsModelSelection ? "Select a model above to start chatting" : "Start a conversation"}</p></div> : <>
                    {blockMessages.map(message => <ChatMessage key={message.id} message={toDisplayMessage(message)} onRetry={message.role === 'assistant' ? () => handleRetry(toDisplayMessage(message)) : undefined} onDelete={() => handleDeleteMessage(message.id)} selectable />)}
                    {streamingContent && <ChatMessage message={{
                  id: 'streaming',
                  block_id: blockId,
                  role: 'assistant',
                  content: streamingContent,
                  size_bytes: 0,
                  created_at: new Date().toISOString()
                }} isStreaming />}
                    {messageStatus === 'waiting_llm' && !streamingContent && <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground text-sm">
                        <Spinner className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>Thinking...</span>
                      </div>}
                    <div ref={messagesEndRef} />
                  </>}
              </div>
              
              {/* Scroll to bottom button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-20 right-4 sm:right-6 p-2.5 rounded-full bg-secondary/90 hover:bg-secondary border border-border/30 shadow-lg backdrop-blur-sm transition-all hover:scale-105 z-10"
                  aria-label="Scroll to bottom"
                >
                  <ArrowDown className="h-4 w-4 text-foreground" />
                </button>
              )}

              <ChatInput onSend={handleSend} onStop={handleStop} isRunning={isRunning} disabled={needsModelSelection || !hasKeyForCurrentProvider} placeholder={needsModelSelection ? "Select a model..." : !hasKeyForCurrentProvider ? "Add an API key..." : "Type a message..."} references={pendingReferences} onReferencesChange={setPendingReferences} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>;
}