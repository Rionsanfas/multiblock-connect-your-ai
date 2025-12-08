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
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col bg-card/95 backdrop-blur-xl border-border/50 p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-lg">{block.title}</DialogTitle>
              <ProviderBadge provider={getProviderFromModel(block.model)} model={block.model} />
            </div>
            <IconButton variant="ghost" size="sm" onClick={() => closeBlockChat()}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
          {blockMessages.length === 0 && !streamingContent && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg mb-2">Start a conversation</p>
              <p className="text-sm">Send a message to interact with this block</p>
            </div>
          )}

          {blockMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "group flex gap-3",
                msg.role === "user" && "justify-end"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-3",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.meta && (
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/20 text-xs opacity-70">
                    <span>{msg.meta.tokens} tokens</span>
                    <span>${msg.meta.cost}</span>
                    <span>{msg.meta.latency_ms}ms</span>
                  </div>
                )}
              </div>
              
              {/* Message actions */}
              <div className={cn(
                "flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                msg.role === "user" && "order-first"
              )}>
                <IconButton variant="ghost" size="sm" onClick={() => handleCopy(msg.content)} tooltip="Copy">
                  <Copy className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMessage(msg.id)}
                  tooltip="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {streamingContent && (
            <div className="flex gap-3">
              <div className="max-w-[80%] rounded-xl px-4 py-3 bg-secondary/50">
                <p className="whitespace-pre-wrap">{streamingContent}</p>
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-border/30">
          {input && (
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>~{estimateTokens(input)} tokens</span>
              <span>~${estimateCost(estimateTokens(input))}</span>
            </div>
          )}
          <div className="flex gap-3">
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
              className="min-h-[60px] max-h-[200px] bg-secondary/50 resize-none"
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isRunning}
                className="h-full"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
