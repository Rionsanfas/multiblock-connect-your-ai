import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Layers,
  Key,
  CreditCard,
  Settings,
  ChevronLeft,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkspaceSwitcher } from "@/components/teams/WorkspaceSwitcher";
import { useTeamContext } from "@/contexts/TeamContext";

const navItems = [
  { icon: Layers, label: "Boards", href: "/dashboard", showAlways: true },
  { icon: Key, label: "API Keys", href: "/settings/keys", showAlways: true },
  { icon: Users, label: "Team Settings", href: "/team/settings", showAlways: true },
  { icon: CreditCard, label: "Pricing", href: "/pricing", showForFreePlanOnly: true },
  { icon: Settings, label: "Settings", href: "/settings", showAlways: true },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useCurrentUser();

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-card/80 backdrop-blur-xl border-r border-border/10 transition-all duration-300 rounded-r-2xl",
        collapsed ? "w-[72px]" : "w-60"
      )}
    >
      {/* Dashboard Title */}
      <div className={cn("p-5 pb-2", collapsed && "px-3")}>
        <div className={cn("flex items-center justify-between", collapsed && "justify-center")}>
          {!collapsed && (
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Dashboard</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-all duration-200"
          >
            <ChevronLeft className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", collapsed && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className={cn("px-4 pb-4", collapsed && "px-3")}>
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 transition-all duration-200",
              collapsed && "justify-center p-2"
            )}
          >
            <Avatar className="h-9 w-9 ring-2 ring-background shadow-lg">
              <AvatarFallback className="bg-foreground text-background text-sm font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.plan} plan
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          // Show based on plan conditions
          const isFreePlan = user?.plan?.toLowerCase() === 'free';
          
          if (item.showForFreePlanOnly && !isFreePlan) return null;
          if (!item.showAlways && !item.showForFreePlanOnly) return null;
          
          const isActive = location.pathname === item.href;
          const NavItem = (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "sidebar-nav-item group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 overflow-hidden",
                isActive
                  ? "bg-secondary/60 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30",
                collapsed && "justify-center px-3"
              )}
            >
              {/* Gold highlight indicator */}
              <span
                className={cn(
                  "sidebar-indicator absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full transition-all duration-500 ease-out",
                  isActive
                    ? "bg-gradient-to-b from-[hsl(var(--accent))] via-[hsl(var(--glow-warm))] to-[hsl(var(--accent))] opacity-100 shadow-[0_0_12px_hsl(var(--accent)/0.6)]"
                    : "bg-transparent opacity-0 group-hover:opacity-40 group-hover:bg-[hsl(var(--accent)/0.5)]"
                )}
                style={{
                  animation: isActive ? "slideInFromLeft 0.5s ease-out forwards" : "none"
                }}
              />
              <div className={cn("icon-3d p-1.5 rounded-lg", isActive && "icon-3d-active")}>
                <item.icon className={cn("h-4 w-4 flex-shrink-0 transition-all duration-200 text-foreground/90", isActive && "text-foreground drop-shadow-[0_0_6px_hsl(0_0%_100%/0.5)]")} />
              </div>
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                <TooltipContent side="right" className="rounded-xl">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return NavItem;
        })}
      </nav>
    </aside>
  );
}