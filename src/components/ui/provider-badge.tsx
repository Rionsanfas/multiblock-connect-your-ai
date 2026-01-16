import { cn } from "@/lib/utils";
import { PROVIDERS, type Provider } from "@/config/models";

interface ProviderBadgeProps {
  provider: Provider | string;
  model?: string;
  modelType?: string;
  size?: "sm" | "md";
  className?: string;
}

export function ProviderBadge({ provider, model, modelType, size = "sm", className }: ProviderBadgeProps) {
  const providerInfo = PROVIDERS[provider as Provider];
  const color = providerInfo?.color || "hsl(0 0% 60%)";
  const name = providerInfo?.name || provider;

  // Get type color
  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'image': return 'hsl(280 70% 55%)';
      case 'video': return 'hsl(24 90% 55%)';
      case 'audio': return 'hsl(200 80% 50%)';
      case 'embedding': return 'hsl(45 90% 50%)';
      case 'code': return 'hsl(217 90% 60%)';
      default: return color;
    }
  };

  const displayColor = modelType ? getTypeColor(modelType) : color;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        className
      )}
      style={{
        backgroundColor: `${displayColor}20`,
        color: displayColor,
        border: `1px solid ${displayColor}40`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: displayColor }}
      />
      {model || name}
      {modelType && modelType !== 'chat' && (
        <span className="ml-1 opacity-70 text-[10px] uppercase">{modelType}</span>
      )}
    </span>
  );
}
