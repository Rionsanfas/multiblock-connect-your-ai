import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useInboxCount } from "@/hooks/useInboxCount";
import { Layers, Key, Users, Settings, Inbox, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface DashboardLayoutProps {
  children: ReactNode;
  boardId?: string;
  boardTitle?: string;
  showBoardControls?: boolean;
  hideSidebar?: boolean;
}

export function DashboardLayout({
  children,
  boardId,
  boardTitle,
  showBoardControls = false,
  hideSidebar = false,
}: DashboardLayoutProps) {
  const location = useLocation();
  const { count: inboxCount } = useInboxCount();
  const { user } = useCurrentUser();
  const isFreePlan = user?.plan?.toLowerCase() === 'free';

  const mobileNavItems = [
    { icon: Layers, label: "Boards", href: "/dashboard" },
    { icon: Key, label: "Keys", href: "/settings/keys" },
    { icon: Users, label: "Team", href: "/team/settings" },
    ...(isFreePlan ? [{ icon: CreditCard, label: "Pricing", href: "/pricing" }] : []),
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="flex h-screen w-full bg-background noise-bg">
      {!hideSidebar && <AppSidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          boardId={boardId}
          boardTitle={boardTitle}
          showBoardControls={showBoardControls}
        />
        <main
          className={cn(
            "flex-1 overflow-auto relative pb-20 sm:pb-16 md:pb-0",
            showBoardControls ? "" : "mx-auto w-full max-w-[1440px]"
          )}
        >
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        {!hideSidebar && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/10 px-1 sm:px-2 py-1.5 sm:py-2 z-50 safe-area-bottom">
            <div className="flex items-center justify-around">
              {mobileNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all touch-target",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-[9px] sm:text-[10px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Inbox with badge */}
              <Link
                to="/inbox"
                className={cn(
                  "flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all relative touch-target",
                  location.pathname === "/inbox" ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <Inbox className="h-4 w-4 sm:h-5 sm:w-5" />
                  {inboxCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 h-3.5 sm:h-4 min-w-[12px] sm:min-w-[14px] px-0.5 sm:px-1 text-[8px] sm:text-[9px] font-bold flex items-center justify-center"
                    >
                      {inboxCount}
                    </Badge>
                  )}
                </div>
                <span className="text-[9px] sm:text-[10px] font-medium">Inbox</span>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
