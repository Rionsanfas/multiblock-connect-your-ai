import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Lock, Plus, Zap, Star, ExternalLink, Image, Video, MessageSquare, Music, Code, Search, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MODEL_CONFIGS, 
  PROVIDERS, 
  getModelsByType,
  type Provider, 
  type ProviderInfo, 
  type ModelConfig, 
  type ModelType 
} from "@/config/models";
import { toast } from "sonner";
import { useConfiguredProviders } from "@/hooks/useApiKeys";
import { useAvailableProviders } from "@/hooks/useModelConfig";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedModelId?: string;
  onSelect: (modelId: string) => void;
  onAddApiKey?: (provider: Provider) => void;
  showAllTypes?: boolean;
  defaultTab?: 'chat' | 'image' | 'video';
}

const INITIAL_MODELS_SHOWN = 5;

// Get icon for model type
function getModelTypeIcon(type: ModelType) {
  switch (type) {
    case 'image': return <Image className="h-4 w-4" />;
    case 'video': return <Video className="h-4 w-4" />;
    case 'chat': return <MessageSquare className="h-4 w-4" />;
    case 'code': return <Code className="h-4 w-4" />;
    case 'embedding': return <Search className="h-4 w-4" />;
    case 'vision': return <Layers className="h-4 w-4" />;
    default: return <MessageSquare className="h-4 w-4" />;
  }
}

// Get tab color for model type
function getTypeColor(type: ModelType) {
  switch (type) {
    case 'image': return 'text-purple-400';
    case 'video': return 'text-orange-400';
    case 'chat': return 'text-green-400';
    case 'code': return 'text-cyan-400';
    default: return 'text-foreground';
  }
}

// Group models by provider for a specific type
function getModelsGroupedByProviderForType(type: ModelType): Record<Provider, ModelConfig[]> {
  const grouped: Partial<Record<Provider, ModelConfig[]>> = {};
  
  MODEL_CONFIGS.forEach((model) => {
    if (model.type === type) {
      if (!grouped[model.provider]) {
        grouped[model.provider] = [];
      }
      grouped[model.provider]!.push(model);
    }
  });
  
  return grouped as Record<Provider, ModelConfig[]>;
}

// Get all image models
function getImageModels(): ModelConfig[] {
  return MODEL_CONFIGS.filter(m => m.type === 'image');
}

// Get all video models
function getVideoModels(): ModelConfig[] {
  return MODEL_CONFIGS.filter(m => m.type === 'video');
}

// Get all chat models
function getChatModels(): ModelConfig[] {
  return MODEL_CONFIGS.filter(m => m.type === 'chat');
}

interface ProviderSectionProps {
  provider: ProviderInfo;
  models: ModelConfig[];
  hasKey: boolean;
  selectedModelId?: string;
  onSelect: (model: ModelConfig) => void;
  onAddApiKey?: (provider: Provider) => void;
  expandedProviders: Set<Provider>;
  onToggleProvider: (provider: Provider) => void;
}

function ProviderSection({ 
  provider, 
  models, 
  hasKey, 
  selectedModelId, 
  onSelect, 
  onAddApiKey,
  expandedProviders,
  onToggleProvider
}: ProviderSectionProps) {
  const isExpanded = expandedProviders.has(provider.id);
  const visibleModels = isExpanded ? models : models.slice(0, INITIAL_MODELS_SHOWN);
  const hasMore = models.length > INITIAL_MODELS_SHOWN;

  const handleGetApiKey = () => {
    window.open(provider.apiKeyUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-2">
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
                onClick={handleGetApiKey}
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

      <div className="grid gap-2">
        {visibleModels.map((model) => {
          const isSelected = model.id === selectedModelId;
          const isDisabled = !hasKey;

          return (
            <button
              key={model.id}
              onClick={() => !isDisabled && onSelect(model)}
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
          onClick={() => onToggleProvider(provider.id)}
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
}

export function ModelSelector({ 
  open, 
  onOpenChange, 
  selectedModelId, 
  onSelect, 
  onAddApiKey, 
  showAllTypes = true,
  defaultTab = 'chat'
}: ModelSelectorProps) {
  const providers = useAvailableProviders();
  const configuredProviders = useConfiguredProviders();
  const [expandedProviders, setExpandedProviders] = useState<Set<Provider>>(new Set());
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

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

  // Get models grouped by provider for each type
  const imageModelsByProvider = getModelsGroupedByProviderForType('image');
  const videoModelsByProvider = getModelsGroupedByProviderForType('video');
  const chatModelsByProvider = getModelsGroupedByProviderForType('chat');

  // Count models by type
  const imageCount = getImageModels().length;
  const videoCount = getVideoModels().length;
  const chatCount = getChatModels().length;

  const renderProviderSections = (modelsByProvider: Record<Provider, ModelConfig[]>) => {
    const providersWithModels = providers.filter(p => modelsByProvider[p.id]?.length > 0);
    
    if (providersWithModels.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No models available for this type
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {providersWithModels.map((provider) => {
          const hasKey = configuredProviders.includes(provider.id);
          const models = modelsByProvider[provider.id] || [];
          
          return (
            <ProviderSection
              key={provider.id}
              provider={provider}
              models={models}
              hasKey={hasKey}
              selectedModelId={selectedModelId}
              onSelect={(model) => handleSelect(model, hasKey)}
              onAddApiKey={onAddApiKey}
              expandedProviders={expandedProviders}
              onToggleProvider={toggleProvider}
            />
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-border/20 rounded-2xl max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Select Model</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose a model from your connected providers
          </p>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="chat" className="gap-1 whitespace-nowrap shrink-0">
              <MessageSquare className={cn("h-4 w-4 shrink-0", activeTab === 'chat' && "text-green-400")} />
              <span className="shrink-0">Chat</span>
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5 shrink-0">
                {chatCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-1 whitespace-nowrap shrink-0">
              <Image className={cn("h-4 w-4 shrink-0", activeTab === 'image' && "text-purple-400")} />
              <span className="shrink-0">Image</span>
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5 shrink-0">
                {imageCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="video" 
              className="gap-1 whitespace-nowrap shrink-0 opacity-50 cursor-not-allowed"
              onClick={(e) => {
                e.preventDefault();
                toast.info("Video generation is coming soon!", {
                  description: "This feature is not available right now."
                });
              }}
              disabled
            >
              <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="shrink-0">Video</span>
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5 shrink-0">
                {videoCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[55vh] pr-4">
            <TabsContent value="chat" className="mt-0">
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-400">
                  <MessageSquare className="h-3 w-3 inline mr-1" />
                  Chat models for conversations, reasoning, and text generation
                </p>
              </div>
              {renderProviderSections(chatModelsByProvider)}
            </TabsContent>

            <TabsContent value="image" className="mt-0">
              <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-xs text-purple-400">
                  <Image className="h-3 w-3 inline mr-1" />
                  Image models for generating images from text prompts
                </p>
              </div>
              {renderProviderSections(imageModelsByProvider)}
            </TabsContent>

            <TabsContent value="video" className="mt-0">
              <div className="mb-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="text-xs text-orange-400">
                  <Video className="h-3 w-3 inline mr-1" />
                  Video models for generating videos from text prompts
                </p>
              </div>
              {renderProviderSections(videoModelsByProvider)}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}