import { cn } from "@/lib/utils";
import { MODEL_PROVIDERS, type Provider } from "@/types";

interface ProviderBadgeProps {
  provider: Provider | string;
  model?: string;
  size?: "sm" | "md";
  className?: string;
}

export function ProviderBadge({ provider, model, size = "sm", className }: ProviderBadgeProps) {
  const providerInfo = MODEL_PROVIDERS[provider as Provider];
  const color = providerInfo?.color || "hsl(0 0% 60%)";
  const name = providerInfo?.name || provider;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {model || name}
    </span>
  );
}
