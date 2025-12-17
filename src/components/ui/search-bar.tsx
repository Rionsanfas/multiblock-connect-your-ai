import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, value, onClear, ...props }, ref) => {
    return (
      <div className={cn("relative", className)}>
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={ref}
          value={value}
          className={cn(
            "flex h-11 w-full rounded-xl bg-secondary/40 px-4 pl-11 pr-10 text-sm",
            "border border-border/20 shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-border/40",
            "transition-all duration-200"
          )}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
SearchBar.displayName = "SearchBar";

export { SearchBar };
