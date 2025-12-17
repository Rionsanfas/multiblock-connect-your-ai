import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Copy, Trash2, Edit, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconButton } from "@/components/ui/icon-button";
import { ProviderBadge } from "@/components/ui/provider-badge";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BlockChatModalProps {
  blockId: string;
}

export function BlockChatModal({ blockId }: BlockChatModalProps) {
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { blocks, messages, closeBlockChat, deleteMessage } = useAppStore();
  const block = blocks.find((b) => b.id === blockId);
  const blockMessages = messages.filter((m) => m.block_id === blockId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [blockMessages, streamingContent]);

  if (!block) return null;

  const getProviderFromModel = (model: string) => {
    if (model.includes("gpt")) return "openai";
    if (model.includes("claude")) return "anthropic";
    if (model.includes("gemini")) return "google";
    if (model.includes("pplx")) return "perplexity";
    if (model.includes("grok")) return "xai";
    return "openai";
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
      <DialogContent hideCloseButton className="max-w-2xl w-[90vw] h-[70vh] max-h-[600px] flex flex-col bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl p-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6),0_0_40px_-10px_hsl(var(--accent)/0.2)]">
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-border/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-base font-medium">{block.title}</DialogTitle>
              <ProviderBadge provider={getProviderFromModel(block.model)} model={block.model} />
            </div>
            <IconButton variant="ghost" size="sm" onClick={() => closeBlockChat()}>
              <X className="h-4 w-4" />
            </IconButton>
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
                {msg.meta && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20 text-xs opacity-60">
                    <span>{msg.meta.tokens} tokens</span>
                    <span>${msg.meta.cost}</span>
                    <span>{msg.meta.latency_ms}ms</span>
                  </div>
                )}
              </div>
              
              {/* Message actions */}
              <div className={cn(
                "flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
                msg.role === "user" && "order-first"
              )}>
                <IconButton variant="ghost" size="sm" onClick={() => handleCopy(msg.content)} tooltip="Copy">
                  <Copy className="h-3 w-3" />
                </IconButton>
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMessage(msg.id)}
                  tooltip="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </IconButton>
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
          {input && (
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>~{estimateTokens(input)} tokens</span>
              <span>~${estimateCost(estimateTokens(input))}</span>
            </div>
          )}
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
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isRunning}
              className="h-auto px-4 btn-3d-shiny text-foreground"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
