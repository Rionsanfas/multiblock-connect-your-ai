import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Lock, Plus, Zap, Star, ExternalLink, Image, Video, Music, Code, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatModelsGroupedByProvider, useAvailableProviders } from "@/hooks/useModelConfig";
import { useConfiguredProviders } from "@/hooks/useApiKeys";
import { PROVIDERS, type Provider, type ProviderInfo, type ModelConfig, type ModelType } from "@/config/models";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedModelId?: string;
  onSelect: (modelId: string) => void;
  onAddApiKey?: (provider: Provider) => void;
  showAllTypes?: boolean; // If true, show all model types, not just chat
}

const INITIAL_MODELS_SHOWN = 5;

// Get icon for model type
function getModelTypeIcon(type: ModelType) {
  switch (type) {
    case 'image': return <Image className="h-3 w-3 text-purple-400" />;
    case 'video': return <Video className="h-3 w-3 text-orange-400" />;
    case 'audio': return <Music className="h-3 w-3 text-blue-400" />;
    case 'code': return <Code className="h-3 w-3 text-cyan-400" />;
    case 'embedding': return <Search className="h-3 w-3 text-yellow-400" />;
    default: return null;
  }
}

// Get badge color for model type
function getModelTypeBadge(type: ModelType) {
  switch (type) {
    case 'chat': return null; // No badge for chat, it's the default
    case 'image': return { label: 'Image', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    case 'video': return { label: 'Video', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    case 'audio': return { label: 'Audio', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    case 'code': return { label: 'Code', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    case 'embedding': return { label: 'Embed', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    case 'vision': return { label: 'Vision', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    case 'rerank': return { label: 'Rerank', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' };
    default: return null;
  }
}

export function ModelSelector({ open, onOpenChange, selectedModelId, onSelect, onAddApiKey, showAllTypes = false }: ModelSelectorProps) {
  const modelsByProvider = useChatModelsGroupedByProvider();
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

  const handleGetApiKey = (provider: ProviderInfo) => {
    window.open(provider.apiKeyUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-border/20 rounded-2xl max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Select Model</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose a model from your connected providers
          </p>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {providers.map((provider) => {
              const hasKey = configuredProviders.includes(provider.id);
              const models = modelsByProvider[provider.id] || [];
              const isExpanded = expandedProviders.has(provider.id);
              const visibleModels = isExpanded ? models : models.slice(0, INITIAL_MODELS_SHOWN);
              const hasMore = models.length > INITIAL_MODELS_SHOWN;

              // Skip providers with no chat models
              if (models.length === 0) return null;

              return (
                <div key={provider.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: provider.color }}
                      />
                      <h3 className="font-semibold text-base">{provider.name}</h3>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted/50">
                        {models.length}
                      </Badge>
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
                    <div className="flex items-center gap-2">
                      {!hasKey && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGetApiKey(provider)}
                            className="text-xs gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Get API Key
                          </Button>
                          {onAddApiKey && (
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
                        </>
                      )}
                    </div>
                  </div>

                  {/* Provider description */}
                  <p className="text-xs text-muted-foreground ml-5">
                    {provider.description}
                  </p>

                  <div className="grid gap-2">
                    {visibleModels.map((model) => {
                      const isSelected = model.id === selectedModelId;
                      const isDisabled = !hasKey;
                      const typeBadge = getModelTypeBadge(model.type);

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
                              {getModelTypeIcon(model.type)}
                              <span className="font-medium text-sm">{model.name}</span>
                              {typeBadge && (
                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", typeBadge.color)}>
                                  {typeBadge.label}
                                </Badge>
                              )}
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
