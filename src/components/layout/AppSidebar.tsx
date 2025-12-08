import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  Key,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  const { user, logout } = useAppStore();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-card/30 backdrop-blur-xl border-r border-border/30 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-border/30">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
          <Zap className="h-5 w-5" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-lg">MultiBlock</span>
        )}
      </div>

      {/* User dropdown */}
      {user && (
        <div className={cn("p-3 border-b border-border/30", collapsed && "px-2")}>
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer",
              collapsed && "justify-center p-2"
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.plan} plan
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const NavItem = (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return NavItem;
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 space-y-1 border-t border-border/30">
        <button
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <HelpCircle className="h-5 w-5" />
          {!collapsed && <span className="text-sm">Help</span>}
        </button>
        <button
          onClick={logout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="text-sm">Log out</span>}
        </button>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-20 -right-3 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-secondary/80 transition-colors"
      >
        <ChevronLeft
          className={cn(
            "h-4 w-4 transition-transform",
            collapsed && "rotate-180"
          )}
        />
      </button>
    </aside>
  );
}
