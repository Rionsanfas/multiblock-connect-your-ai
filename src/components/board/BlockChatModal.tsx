import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Copy, Trash2, Settings, Pencil, Check, Quote, Sparkles, ChevronDown, Brain, Zap, Lock, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProviderBadge } from "@/components/ui/provider-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { useBlockMessages, useBlockUsage, formatBytes } from "@/hooks/useBlockMessages";
import { useTextSelection } from "@/hooks/useTextSelection";
import { TextSelectionPopover } from "./TextSelectionPopover";
import { useUserApiKeys } from "@/hooks/useApiKeys";
import { useModelsGroupedByProvider, useAvailableProviders } from "@/hooks/useModelConfig";
import { getModelConfig, PROVIDERS, type Provider } from "@/types";
import { api } from "@/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface BlockChatModalProps {
  blockId: string;
}

export function BlockChatModal({ blockId }: BlockChatModalProps) {
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { blocks, closeBlockChat, deleteMessage, updateBlock } = useAppStore();
  const block = blocks.find((b) => b.id === blockId);
  
  // Use hooks for models and API keys
  const userApiKeys = useUserApiKeys();
  const modelsByProvider = useModelsGroupedByProvider();
  const providers = useAvailableProviders();
  
  // Use the new hooks for messages and usage
  const blockMessages = useBlockMessages(blockId);
  const blockUsage = useBlockUsage(blockId);
  
  // Text selection for creating new blocks
  const { selectedText, messageId, selectionRect, hasSelection, clearSelection } = 
    useTextSelection(messagesContainerRef);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [blockMessages, streamingContent]);

  useEffect(() => {
    if (block) setTitle(block.title);
  }, [block]);

  if (!block) return null;

  // Get current model config
  const currentModel = getModelConfig(block.model_id);
  const currentProvider = currentModel?.provider;

  // Check if user has API key for current provider
  const hasKeyForCurrentProvider = currentProvider 
    ? userApiKeys.some(k => k.provider === currentProvider && k.is_valid)
    : false;

  // Get provider info for model dropdown
  const getProviderHasKey = (provider: Provider) => 
    userApiKeys.some(k => k.provider === provider && k.is_valid);

  const handleModelSwitch = (newModelId: string) => {
    const newModel = getModelConfig(newModelId);
    if (!newModel) return;
    
    const hasKey = getProviderHasKey(newModel.provider);
    if (!hasKey) {
      toast.error(`Add an API key for ${PROVIDERS[newModel.provider].name} first`);
      return;
    }
    
    const previousModel = block.model_id;
    updateBlock(blockId, { model_id: newModelId });
    toast.success(
      `Switched to ${newModel.name}`,
      { description: "Chat history preserved - continue your conversation" }
    );
  };

  const handleTitleSave = () => {
    if (title.trim()) {
      updateBlock(blockId, { title: title.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isRunning) return;
    
    // Check if user has API key for current provider
    if (!hasKeyForCurrentProvider) {
      toast.error("No API key configured", {
        description: `Add an API key for ${currentProvider ? PROVIDERS[currentProvider].name : 'this provider'} to send messages`,
        action: {
          label: "Add Key",
          onClick: () => navigate("/api-keys")
        }
      });
      return;
    }

    const userInput = input.trim();
    setInput("");
    setIsRunning(true);
    setStreamingContent("");

    const result = await api.blocks.run(blockId, userInput, (chunk) => {
      setStreamingContent((prev) => prev + chunk);
    });

    if (!result.success) {
      toast.error(result.error || "Failed to run block");
    }

    setStreamingContent("");
    setIsRunning(false);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleGoToApiKeys = () => {
    navigate("/api-keys");
  };

  return (
    <Dialog open onOpenChange={() => closeBlockChat()}>
      <DialogContent hideCloseButton className="max-w-2xl w-[90vw] h-[70vh] max-h-[600px] flex flex-col rounded-2xl p-0 border border-border/30 bg-card/95 backdrop-blur-xl shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.6),inset_0_1px_0_0_hsl(0_0%_100%/0.06),0_0_0_1px_hsl(0_0%_100%/0.05)]">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-border/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-base font-medium">{block.title}</DialogTitle>
              
              {/* Model Switcher Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all group border border-border/20",
                    hasKeyForCurrentProvider 
                      ? "bg-secondary/50 hover:bg-secondary/70" 
                      : "bg-destructive/10 border-destructive/30"
                  )}>
                    {currentModel ? (
                      <ProviderBadge provider={currentModel.provider} model={currentModel.name} />
                    ) : (
                      <span className="text-sm text-muted-foreground">Select Model</span>
                    )}
                    {!hasKeyForCurrentProvider && <Lock className="h-3 w-3 text-destructive" />}
                    <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-80 max-h-96 overflow-y-auto bg-card/95 backdrop-blur-xl border-border/30 rounded-xl shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.6)]" 
                  align="start"
                >
                  <div className="px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground border-b border-border/20">
                    <Brain className="h-3 w-3" />
                    <span>Switch model - chat history preserved</span>
                  </div>
                  
                  {providers.map((provider) => {
                    const hasKey = getProviderHasKey(provider.id);
                    const models = (modelsByProvider[provider.id] || []).slice(0, 8);
                    
                    return (
                      <div key={provider.id}>
                        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: provider.color }} 
                            />
                            <span className="text-xs font-medium">{provider.name}</span>
                          </div>
                          {hasKey ? (
                            <span className="flex items-center gap-1 text-[10px] text-green-500">
                              <Zap className="h-2.5 w-2.5" />
                              Connected
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(provider.apiKeyUrl, '_blank');
                              }}
                              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                              Get Key
                            </button>
                          )}
                        </DropdownMenuLabel>
                        {models.map((model) => (
                          <DropdownMenuItem
                            key={model.id}
                            className={cn(
                              "mx-1 rounded-md cursor-pointer",
                              !hasKey && "opacity-50 cursor-not-allowed",
                              block.model_id === model.id && "bg-primary/10"
                            )}
                            disabled={!hasKey}
                            onClick={() => hasKey && handleModelSwitch(model.id)}
                          >
                            <span className="flex items-center gap-2 w-full">
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                block.model_id === model.id ? "bg-primary" : "bg-muted-foreground/30"
                              )} />
                              <span className="text-sm truncate flex-1">{model.name}</span>
                              {!hasKey && <Lock className="h-3 w-3 text-muted-foreground" />}
                              {block.model_id === model.id && (
                                <Check className="h-3 w-3 text-primary" />
                              )}
                            </span>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="my-1" />
                      </div>
                    );
                  })}
                  
                  {/* Add API Key action */}
                  <DropdownMenuItem
                    className="mx-1 rounded-md cursor-pointer text-primary"
                    onClick={handleGoToApiKeys}
                  >
                    <span className="flex items-center gap-2 w-full text-sm">
                      <Zap className="h-3 w-3" />
                      Manage API Keys
                    </span>
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
              {/* Settings Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="key-icon-3d p-2 rounded-lg">
                    <Settings className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 space-y-4 bg-card/95 backdrop-blur-xl border border-border/30 rounded-xl shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.6),inset_0_1px_0_0_hsl(0_0%_100%/0.06)]" side="bottom" align="end">
                  <div className="font-semibold text-sm">Block Settings</div>
                  
                  {/* Title */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    {isEditingTitle ? (
                      <div className="flex gap-2">
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                          className="bg-secondary/50 rounded-lg border-border/30 h-9"
                          autoFocus
                        />
                        <button className="key-icon-3d p-2 rounded-lg" onClick={handleTitleSave}>
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setTitle(block.title); setIsEditingTitle(true); }}
                        className="w-full text-left p-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors flex items-center justify-between group text-sm"
                      >
                        <span>{block.title}</span>
                        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>

                  {/* Current Model Info */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Current Model</Label>
                    <div className="p-2 rounded-lg bg-secondary/40 text-sm">
                      {currentModel ? (
                        <div className="flex items-center justify-between">
                          <span>{currentModel.name}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {currentModel.provider}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No model selected</span>
                      )}
                    </div>
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
          <div className="px-5 py-3 bg-destructive/10 border-b border-destructive/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-destructive" />
                <span>No API key for {PROVIDERS[currentProvider].name}</span>
              </div>
              <button
                onClick={handleGoToApiKeys}
                className="text-xs text-primary hover:underline"
              >
                Add API Key
              </button>
            </div>
          </div>
        )}

        {/* Source Context Banner */}
        {block.source_context && (
          <div className="px-5 py-3 bg-[hsl(var(--accent)/0.1)] border-b border-[hsl(var(--accent)/0.2)]">
            <div className="flex items-start gap-2">
              <Quote className="h-4 w-4 text-[hsl(var(--accent))] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Sparkles className="h-3 w-3 text-[hsl(var(--accent))]" />
                  <span>Context from <strong>{block.source_context.source_block_title}</strong></span>
                </div>
                <p className="text-sm line-clamp-2 text-foreground/80">
                  "{block.source_context.selected_text}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-auto px-5 py-4 space-y-3"
        >
          {blockMessages.length === 0 && !streamingContent && (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm mb-1">Start a conversation</p>
              <p className="text-xs opacity-70">
                {block.source_context 
                  ? "Use the context above to guide your conversation"
                  : "Send a message to interact with this block"
                }
              </p>
            </div>
          )}

          {blockMessages.map((msg) => (
            <div
              key={msg.id}
              data-message-id={msg.id}
              className={cn(
                "group flex gap-2",
                msg.role === "user" && "justify-end"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm select-text",
                  msg.role === "user"
                    ? "user-message-bubble"
                    : "btn-soft"
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
              
              {/* Message actions */}
              <div className={cn(
                "flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
                msg.role === "user" && "order-first"
              )}>
                <button className="key-icon-3d p-1.5 rounded-lg" onClick={() => handleCopy(msg.content)}>
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  className="key-icon-3d p-1.5 rounded-lg"
                  onClick={() => deleteMessage(msg.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {streamingContent && (
            <div className="flex gap-2">
              <div className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm btn-soft">
                <p className="whitespace-pre-wrap leading-relaxed">{streamingContent}</p>
                <span className="inline-block w-1.5 h-3.5 bg-[hsl(var(--accent))] animate-pulse ml-1" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Text Selection Popover */}
        {hasSelection && messageId && (
          <TextSelectionPopover
            selectedText={selectedText}
            messageId={messageId}
            blockId={blockId}
            boardId={block.board_id}
            selectionRect={selectionRect}
            containerRef={messagesContainerRef}
            onClose={clearSelection}
          />
        )}

        {/* Input */}
        <div className="px-5 py-4 border-t border-border/20">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={hasKeyForCurrentProvider ? "Type your message..." : "Add an API key to send messages..."}
              disabled={!hasKeyForCurrentProvider}
              className={cn(
                "min-h-[50px] max-h-[150px] resize-none rounded-xl border-border/30 text-sm input-3d",
                !hasKeyForCurrentProvider && "opacity-50"
              )}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isRunning || !hasKeyForCurrentProvider}
              className={cn(
                "key-icon-3d h-auto px-4 py-3 rounded-xl transition-all",
                (!input.trim() || isRunning || !hasKeyForCurrentProvider) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
