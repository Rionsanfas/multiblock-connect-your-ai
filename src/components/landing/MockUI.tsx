import { MessageSquare, Zap, Boxes } from "lucide-react";

const MockUI = () => {
  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Main Board */}
      <div className="glass-card p-6 md:p-8 rounded-2xl">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-accent/60" />
            <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
          </div>
          <span className="text-xs text-muted-foreground">My Workspace</span>
        </div>

        {/* Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Block 1 - GPT */}
          <div className="glass-card-hover p-4 animate-float" style={{ animationDelay: '0s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <MessageSquare size={16} className="text-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">GPT-4</span>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full w-full" />
              <div className="h-2 bg-muted rounded-full w-3/4" />
              <div className="h-2 bg-muted rounded-full w-1/2" />
            </div>
            <div className="mt-4 flex justify-end">
              <div className="w-3 h-3 rounded-full bg-accent border-2 border-background" />
            </div>
          </div>

          {/* Connector */}
          <div className="hidden md:flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-16 h-0.5 bg-gradient-to-r from-border to-accent/50" />
              <Zap size={20} className="text-accent animate-pulse-slow" />
              <div className="w-16 h-0.5 bg-gradient-to-l from-border to-accent/50" />
            </div>
          </div>

          {/* Block 2 - Claude */}
          <div className="glass-card-hover p-4 animate-float" style={{ animationDelay: '1s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Boxes size={16} className="text-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">Claude</span>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full w-2/3" />
              <div className="h-2 bg-muted rounded-full w-full" />
              <div className="h-2 bg-muted rounded-full w-4/5" />
            </div>
            <div className="mt-4 flex justify-start">
              <div className="w-3 h-3 rounded-full bg-muted-foreground border-2 border-background" />
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="px-4 py-2 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground">
            + Add Block
          </div>
          <div className="px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 text-xs text-accent">
            3 blocks connected
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockUI;
