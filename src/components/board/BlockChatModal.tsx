import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Copy, Trash2, Settings, Pencil, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProviderBadge } from "@/components/ui/provider-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MODEL_PROVIDERS } from "@/types";

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

  const { blocks, messages, closeBlockChat, deleteMessage, updateBlock } = useAppStore();
  const block = blocks.find((b) => b.id === blockId);
  const blockMessages = messages.filter((m) => m.block_id === blockId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [blockMessages, streamingContent]);

  useEffect(() => {
    if (block) setTitle(block.title);
  }, [block]);

  if (!block) return null;

  const allModels = Object.entries(MODEL_PROVIDERS).flatMap(([provider, info]) =>
    info.models.map((model) => ({ provider, model, name: info.name }))
  );

  const getProviderFromModel = (model: string) => {
    if (model.includes("gpt")) return "openai";
    if (model.includes("claude")) return "anthropic";
    if (model.includes("gemini")) return "google";
    if (model.includes("pplx")) return "perplexity";
    if (model.includes("grok")) return "xai";
    return "openai";
  };

  const handleTitleSave = () => {
    if (title.trim()) {
      updateBlock(blockId, { title: title.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isRunning) return;

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

  const estimateTokens = (text: string) => Math.ceil(text.length / 4);
  const estimateCost = (tokens: number) => (tokens * 0.00001).toFixed(4);

  return (
    <Dialog open onOpenChange={() => closeBlockChat()}>
      <DialogContent hideCloseButton className="max-w-2xl w-[90vw] h-[70vh] max-h-[600px] flex flex-col rounded-2xl p-0 border border-border/30 bg-card/95 backdrop-blur-xl shadow-[0_8px_32px_-8px_hsl(0_0%_0%/0.6),inset_0_1px_0_0_hsl(0_0%_100%/0.06),0_0_0_1px_hsl(0_0%_100%/0.05)]">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-border/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-base font-medium">{block.title}</DialogTitle>
              <ProviderBadge provider={getProviderFromModel(block.model)} model={block.model} />
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

                  {/* Model */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Model</Label>
                    <Select
                      value={block.model}
                      onValueChange={(value) => updateBlock(blockId, { model: value })}
                    >
                      <SelectTrigger className="bg-secondary/40 rounded-lg border-border/20 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card/95 backdrop-blur-xl border-border/30 rounded-lg">
                        {allModels.map(({ provider, model, name }) => (
                          <SelectItem key={model} value={model} className="rounded-md">
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{name}</span>
                              {model}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* System Prompt */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">System Prompt</Label>
                    <Textarea
                      value={block.system_prompt}
                      onChange={(e) => updateBlock(blockId, { system_prompt: e.target.value })}
                      className="bg-secondary/40 min-h-[80px] resize-none rounded-lg border-border/20 text-sm"
                      placeholder="You are a helpful assistant..."
                    />
                  </div>
                </PopoverContent>
              </Popover>
              
              <button className="key-icon-3d p-2 rounded-lg" onClick={() => closeBlockChat()}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
          {blockMessages.length === 0 && !streamingContent && (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm mb-1">Start a conversation</p>
              <p className="text-xs opacity-70">Send a message to interact with this block</p>
            </div>
          )}

          {blockMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "group flex gap-2",
                msg.role === "user" && "justify-end"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-gradient-to-r from-[hsl(35,45%,35%)] to-[hsl(40,50%,40%)] text-foreground border border-[hsl(40,50%,45%/0.3)]"
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
              placeholder="Type your message..."
              className="min-h-[50px] max-h-[150px] bg-secondary/50 resize-none rounded-xl border-border/20 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isRunning}
              className={cn(
                "key-icon-3d h-auto px-4 py-3 rounded-xl transition-all",
                (!input.trim() || isRunning) && "opacity-50 cursor-not-allowed"
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
