import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Lock, Plus, Zap, Star, ExternalLink, Image, Video, MessageSquare, Code, Search, Layers, Globe } from "lucide-react";
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
import { useOpenRouterModels, type OpenRouterModel } from "@/hooks/useOpenRouterModels";
import { cn } from "@/lib/utils";
import { useModelDisableStore } from "@/store/useModelDisableStore";

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

function getImageModels(): ModelConfig[] {
  return MODEL_CONFIGS.filter(m => m.type === 'image');
}

function getVideoModels(): ModelConfig[] {
  return MODEL_CONFIGS.filter(m => m.type === 'video');
}

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
  const getDisabledReason = useModelDisableStore((s) => s.getDisabledReason);
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
          const disabledReason = getDisabledReason(model.id);
          const isDisabled = !hasKey || !!disabledReason;

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
                {disabledReason ? `Disabled: ${disabledReason}` : model.description}
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

// OpenRouter models section
interface OpenRouterSectionProps {
  models: OpenRouterModel[];
  hasKey: boolean;
  selectedModelId?: string;
  onSelect: (modelId: string) => void;
  onAddApiKey?: (provider: Provider) => void;
  isLoading: boolean;
}

function OpenRouterSection({
  models,
  hasKey,
  selectedModelId,
  onSelect,
  onAddApiKey,
  isLoading,
}: OpenRouterSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");

  const filteredModels = search
    ? models.filter(m => 
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase())
      )
    : models;

  const visibleModels = expanded ? filteredModels : filteredModels.slice(0, 10);
  const hasMore = filteredModels.length > 10;

  if (!hasKey) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-purple-400" />
            <h3 className="font-semibold text-base">OpenRouter Models</h3>
            <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
              <Lock className="h-3 w-3" />
              No API Key
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://openrouter.ai/keys', '_blank', 'noopener,noreferrer')}
              className="text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              Get API Key
            </Button>
            {onAddApiKey && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddApiKey('openrouter')}
                className="text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Key
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Add your OpenRouter API key to access 200+ models from all providers through a single key.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-purple-400" />
        <h3 className="font-semibold text-base">OpenRouter Models</h3>
        <Badge variant="secondary" className="text-xs gap-1 bg-green-500/20 text-green-400">
          <Check className="h-3 w-3" />
          Connected
        </Badge>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted/50">
          {models.length}
        </Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-sm text-muted-foreground">Loading models...</div>
      ) : (
        <>
          {models.length > 10 && (
            <input
              type="text"
              placeholder="Search OpenRouter models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-secondary/40 border border-border/20 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}

          <div className="grid gap-2">
            {visibleModels.map((model) => {
              const isSelected = model.id === selectedModelId;
              return (
                <button
                  key={model.id}
                  onClick={() => onSelect(model.id)}
                  className={cn(
                    "w-full p-3 rounded-xl text-left transition-all",
                    "border border-border/20",
                    "hover:bg-accent/50 cursor-pointer",
                    isSelected && "ring-2 ring-primary bg-primary/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{model.name}</span>
                      {model.context_length >= 100000 && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">
                          {Math.round(model.context_length / 1000)}K
                        </Badge>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1 font-mono">
                    {model.id}
                  </p>
                </button>
              );
            })}
          </div>

          {hasMore && !search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full text-xs text-muted-foreground gap-1"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  See {filteredModels.length - 10} more models
                </>
              )}
            </Button>
          )}
        </>
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
  const { models: openRouterModels, isLoading: orLoading, hasKey: hasOrKey } = useOpenRouterModels();
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

  const handleOpenRouterSelect = (modelId: string) => {
    onSelect(modelId);
    onOpenChange(false);
  };

  // Get models grouped by provider for each type (excluding openrouter from default)
  const imageModelsByProvider = getModelsGroupedByProviderForType('image');
  const videoModelsByProvider = getModelsGroupedByProviderForType('video');
  const chatModelsByProvider = getModelsGroupedByProviderForType('chat');

  // Count models by type
  const imageCount = getImageModels().length;
  const videoCount = getVideoModels().length;
  const chatCount = getChatModels().length;
  const orCount = openRouterModels.length;

  const renderProviderSections = (modelsByProvider: Record<Provider, ModelConfig[]>) => {
    // Filter out openrouter from default providers (it gets its own section)
    const providersWithModels = providers
      .filter(p => p.id !== 'openrouter' && modelsByProvider[p.id]?.length > 0);
    
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
            Choose from default providers or your OpenRouter models
          </p>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="chat" className="gap-1 whitespace-nowrap shrink-0">
              <MessageSquare className={cn("h-4 w-4 shrink-0", activeTab === 'chat' && "text-green-400")} />
              <span className="shrink-0">Chat</span>
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5 shrink-0">
                {chatCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="openrouter" className="gap-1 whitespace-nowrap shrink-0">
              <Globe className={cn("h-4 w-4 shrink-0", activeTab === 'openrouter' && "text-purple-400")} />
              <span className="shrink-0">OpenRouter</span>
              {orCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5 shrink-0">
                  {orCount}
                </Badge>
              )}
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
                  Default models — use your provider API keys
                </p>
              </div>
              {renderProviderSections(chatModelsByProvider)}
            </TabsContent>

            <TabsContent value="openrouter" className="mt-0">
              <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-xs text-purple-400">
                  <Globe className="h-3 w-3 inline mr-1" />
                  Access 200+ models through OpenRouter with a single API key
                </p>
              </div>
              <OpenRouterSection
                models={openRouterModels}
                hasKey={hasOrKey}
                selectedModelId={selectedModelId}
                onSelect={handleOpenRouterSelect}
                onAddApiKey={onAddApiKey}
                isLoading={orLoading}
              />
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
