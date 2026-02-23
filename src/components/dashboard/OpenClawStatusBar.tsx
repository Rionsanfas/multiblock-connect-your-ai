import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Terminal } from "lucide-react";

export function OpenClawStatusBar() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["openclaw-stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("openclaw_connections")
        .select("status, last_heartbeat");

      const connected =
        data?.filter(
          (c) =>
            c.last_heartbeat &&
            Date.now() - new Date(c.last_heartbeat).getTime() < 2 * 60 * 1000
        ).length || 0;

      return { total: data?.length || 0, connected };
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="mb-6 p-4 border border-border/50 rounded-lg bg-card">
        <Skeleton className="h-5 w-48" />
      </div>
    );
  }

  // Hide if user has never created a connection
  if (!stats || stats.total === 0) {
    return (
      <div className="mb-6 p-4 border border-border/50 rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Connect OpenClaw</span>
            <Badge variant="secondary" className="text-[10px]">Not Connected</Badge>
          </div>
          <Button variant="default" size="sm" className="h-8 text-xs" asChild>
            <Link to="/settings/openclaw">Get Started</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isAnyConnected = stats.connected > 0;

  return (
    <div className="mb-6 p-4 border border-border/50 rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">OpenClaw</span>
            <Badge
              variant={isAnyConnected ? "default" : "secondary"}
              className={isAnyConnected ? "bg-emerald-600 hover:bg-emerald-600 text-[10px]" : "text-[10px]"}
            >
              {stats.connected} Connected
            </Badge>
          </div>
          {!isAnyConnected && (
            <span className="text-xs text-muted-foreground">No connections active</span>
          )}
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
          <Link to="/settings/openclaw">Manage Connections</Link>
        </Button>
      </div>
    </div>
  );
}
