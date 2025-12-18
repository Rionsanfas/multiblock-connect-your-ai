import { useState, useMemo } from "react";
import { Check, ChevronDown, ChevronUp, Lock, Plus, Zap, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModelsGroupedByProvider, useAvailableProviders } from "@/hooks/useModelConfig";
import { useConfiguredProviders } from "@/hooks/useApiKeys";
import { PROVIDERS, type Provider, type ModelConfig } from "@/types";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedModelId?: string;
  onSelect: (modelId: string) => void;
  onAddApiKey?: (provider: Provider) => void;
}

const INITIAL_MODELS_SHOWN = 5;

export function ModelSelector({ open, onOpenChange, selectedModelId, onSelect, onAddApiKey }: ModelSelectorProps) {
  const modelsByProvider = useModelsGroupedByProvider();
  const providers = useAvailableProviders();
  const configuredProviders = useConfiguredProviders();
  const [expandedProviders, setExpandedProviders] = useState<Set<Provider>>(new Set());

  const toggleProvider = (provider: Provider) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(provider)) {
        next.delete(provider);
      } else {
        next.add(provider);
      }
      return next;
    });
  };

  const handleSelect = (model: ModelConfig, hasKey: boolean) => {
    if (!hasKey) return;
    onSelect(model.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-border/20 rounded-2xl max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Select Model</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {providers.map((provider) => {
              const hasKey = configuredProviders.includes(provider.id);
              const models = modelsByProvider[provider.id] || [];
              const isExpanded = expandedProviders.has(provider.id);
              const visibleModels = isExpanded ? models : models.slice(0, INITIAL_MODELS_SHOWN);
              const hasMore = models.length > INITIAL_MODELS_SHOWN;

              return (
                <div key={provider.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: provider.color }}
                      />
                      <h3 className="font-semibold text-base">{provider.name}</h3>
                      {hasKey ? (
                        <Badge variant="secondary" className="text-xs gap-1 bg-green-500/20 text-green-400">
                          <Check className="h-3 w-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          No API Key
                        </Badge>
                      )}
                    </div>
                    {!hasKey && onAddApiKey && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddApiKey(provider.id)}
                        className="text-xs gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Key
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-2">
                    {visibleModels.map((model) => {
                      const isSelected = model.id === selectedModelId;
                      const isDisabled = !hasKey;

                      return (
                        <button
                          key={model.id}
                          onClick={() => handleSelect(model, hasKey)}
                          disabled={isDisabled}
                          className={cn(
                            "w-full p-3 rounded-xl text-left transition-all",
                            "border border-border/20",
                            isDisabled
                              ? "opacity-50 cursor-not-allowed bg-muted/20"
                              : "hover:bg-accent/50 cursor-pointer",
                            isSelected && "ring-2 ring-primary bg-primary/10"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{model.name}</span>
                              {model.quality === "premium" && (
                                <Star className="h-3 w-3 text-yellow-500" />
                              )}
                              {model.speed === "fast" && (
                                <Zap className="h-3 w-3 text-green-500" />
                              )}
                              {isDisabled && <Lock className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {model.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {hasMore && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleProvider(provider.id)}
                      className="w-full text-xs text-muted-foreground gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          See {models.length - INITIAL_MODELS_SHOWN} more models
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
