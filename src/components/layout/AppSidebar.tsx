import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  Key,
  CreditCard,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Layers, label: "Boards", href: "/dashboard" },
  { icon: Key, label: "API Keys", href: "/settings/keys" },
  { icon: CreditCard, label: "Pricing", href: "/pricing" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAppStore();

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-card/50 backdrop-blur-xl border-r border-border/20 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* User Profile Section */}
      {user && (
        <div className={cn("p-4", collapsed && "px-3")}>
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-2xl bg-secondary/40 transition-all duration-200",
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
            {!collapsed && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const NavItem = (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-foreground text-background shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                collapsed && "justify-center px-3"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-background")} />
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

      {/* Collapse button when collapsed */}
      {collapsed && (
        <div className="p-3 mt-auto">
          <button
            onClick={() => setCollapsed(false)}
            className="w-full p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
          </button>
        </div>
      )}
    </aside>
  );
}
