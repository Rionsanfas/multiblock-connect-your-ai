import { useState } from 'react';
import { Settings2, Link2, Brain, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface ChatOptions {
  temperature: number;
  maxTokens: number;
  enableLinkContext: boolean;
  linkUrl?: string;
  thinkMore: boolean;
}

interface AdvancedOptionsProps {
  options: ChatOptions;
  onChange: (options: ChatOptions) => void;
  className?: string;
}

export function AdvancedOptions({ options, onChange, className }: AdvancedOptionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateOption = <K extends keyof ChatOptions>(key: K, value: ChatOptions[K]) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className={cn("border-t border-border/20", className)}>
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <Settings2 className="h-3.5 w-3.5" />
          Advanced Options
        </span>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Options panel */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Temperature</Label>
              <span className="text-xs text-muted-foreground">{options.temperature.toFixed(1)}</span>
            </div>
            <Slider
              value={[options.temperature]}
              onValueChange={([v]) => updateOption('temperature', v)}
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
            <p className="text-[10px] text-muted-foreground">
              Lower = more focused, Higher = more creative
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Max Response Length</Label>
              <span className="text-xs text-muted-foreground">{options.maxTokens}</span>
            </div>
            <Slider
              value={[options.maxTokens]}
              onValueChange={([v]) => updateOption('maxTokens', v)}
              min={256}
              max={8192}
              step={256}
              className="w-full"
            />
          </div>

          {/* Think More toggle */}
          <div className="flex items-center justify-between py-2 border-t border-border/20">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-xs">Think More</Label>
                <p className="text-[10px] text-muted-foreground">
                  Deeper reasoning (slower, uses more tokens)
                </p>
              </div>
            </div>
            <Switch
              checked={options.thinkMore}
              onCheckedChange={(v) => updateOption('thinkMore', v)}
            />
          </div>

          {/* Link Context */}
          <div className="py-2 border-t border-border/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-xs">Link Context</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Fetch and include content from a URL
                  </p>
                </div>
              </div>
              <Switch
                checked={options.enableLinkContext}
                onCheckedChange={(v) => updateOption('enableLinkContext', v)}
              />
            </div>

            {options.enableLinkContext && (
              <div className="space-y-2">
                <Input
                  value={options.linkUrl || ''}
                  onChange={(e) => updateOption('linkUrl', e.target.value)}
                  placeholder="https://example.com/article"
                  className="text-xs h-8"
                />
                <div className="flex items-start gap-1.5 text-[10px] text-amber-500">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Only fetches text content. Max 50KB. No authentication.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const DEFAULT_CHAT_OPTIONS: ChatOptions = {
  temperature: 0.7,
  maxTokens: 2048,
  enableLinkContext: false,
  thinkMore: false,
};
