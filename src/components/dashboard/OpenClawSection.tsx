import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, ChevronDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function isConnectedRecently(lastHeartbeat: string | null): boolean {
  if (!lastHeartbeat) return false;
  return Date.now() - new Date(lastHeartbeat).getTime() < 2 * 60 * 1000;
}

export function OpenClawSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const hasAutoCreated = useRef(false);

  const { data: connection, isLoading, isError } = useQuery({
    queryKey: ["openclaw-connection", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("openclaw_connections")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const createConnection = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("openclaw_connections")
        .insert({ user_id: user!.id })
        .select()
        .single();
      if (error) {
        if (error.code === "23505") return null; // already exists
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openclaw-connection"] });
    },
  });

  useEffect(() => {
    if (!isLoading && connection === null && user?.id && !createConnection.isPending && !hasAutoCreated.current) {
      hasAutoCreated.current = true;
      createConnection.mutate();
    }
  }, [isLoading, connection, user?.id, createConnection.isPending]);

  const copyUrl = async () => {
    if (!connection?.webhook_url) return;
    await navigator.clipboard.writeText(connection.webhook_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Webhook URL copied!");
  };

  const isConnected = isConnectedRecently(connection?.last_heartbeat ?? null);

  if (isError) {
    return (
      <Card className="mb-6 border-border/50">
        <CardContent className="py-3">
          <p className="text-xs text-muted-foreground">Failed to load OpenClaw connection.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-border/50">
      <CardHeader className="py-3 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">OpenClaw Connection</CardTitle>
          {isLoading ? (
            <Skeleton className="h-5 w-20" />
          ) : connection ? (
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", isConnected ? "bg-emerald-500" : "bg-destructive")} />
              <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0">
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-3 pt-0 space-y-3">
        {isLoading || (!connection && createConnection.isPending) ? (
          <Skeleton className="h-10 w-full" />
        ) : connection ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  value={connection.webhook_url}
                  readOnly
                  className="font-mono text-xs h-9"
                />
                <Button variant="outline" size="sm" onClick={copyUrl} className="shrink-0 h-9 w-9 p-0">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className={cn("h-3 w-3 transition-transform", instructionsOpen && "rotate-180")} />
                Setup Instructions
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                  <li>Copy the webhook URL above</li>
                  <li>Add it to your OpenClaw config file</li>
                  <li>Restart OpenClaw</li>
                  <li>Status will change to "Connected"</li>
                </ol>
                <a
                  href="https://openclaw.dev/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mt-2 transition-colors"
                >
                  Full docs <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
