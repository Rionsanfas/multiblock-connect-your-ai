import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/use-toast";
import { Copy, Check, Plug, PlugZap, Unplug, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OpenClawSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);

  const { data: connection, isLoading } = useQuery({
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
  });

  const createConnection = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("openclaw_connections")
        .insert({ user_id: user!.id })
        .select()
        .single();
      if (error) {
        if (error.code === "23505") throw new Error("Connection already exists");
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openclaw-connection"] });
      toast({ title: "Connection created", description: "Your webhook URL is ready." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("openclaw_connections")
        .delete()
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openclaw-connection"] });
      setShowDisconnect(false);
      toast({ title: "Disconnected", description: "OpenClaw connection removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to disconnect.", variant: "destructive" });
    },
  });

  const copyUrl = async () => {
    if (!connection?.webhook_url) return;
    await navigator.clipboard.writeText(connection.webhook_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Webhook URL copied to clipboard." });
  };

  const statusColor = connection?.status === "connected"
    ? "bg-emerald-500"
    : connection?.status === "pending"
      ? "bg-amber-500"
      : "bg-destructive";

  const statusLabel = connection?.status === "connected"
    ? "Connected"
    : connection?.status === "pending"
      ? "Pending"
      : connection
        ? "Disconnected"
        : "Not Connected";

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">OpenClaw Integration</h1>
            <p className="text-sm text-muted-foreground">
              Connect your local OpenClaw installation to Multiblock.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", statusColor)} />
            <Badge variant="outline" className="text-xs font-medium">
              {statusLabel}
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : !connection ? (
          /* No connection — setup card */
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Plug className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Set Up Connection</CardTitle>
                  <CardDescription>Generate a webhook URL to link OpenClaw.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => createConnection.mutate()}
                disabled={createConnection.isPending}
                className="w-full"
              >
                {createConnection.isPending ? (
                  <Spinner size="sm" className="mr-2 text-background" />
                ) : (
                  <PlugZap className="mr-2 h-4 w-4" />
                )}
                Generate Webhook URL
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Connected / Pending — details card */
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                  <PlugZap className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Connection Details</CardTitle>
                  <CardDescription>
                    {connection.status === "connected"
                      ? "OpenClaw is actively connected."
                      : "Waiting for first heartbeat from OpenClaw."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Webhook URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Webhook URL
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-secondary/60 rounded-xl px-3 py-2.5 text-xs font-mono break-all select-all border border-border/30">
                    {connection.webhook_url}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyUrl}
                    className="shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Last heartbeat */}
              {connection.last_heartbeat && (
                <div className="text-xs text-muted-foreground">
                  Last heartbeat:{" "}
                  <span className="text-foreground">
                    {new Date(connection.last_heartbeat).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Disconnect */}
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                onClick={() => setShowDisconnect(true)}
              >
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Setup Instructions */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <Accordion type="single" collapsible defaultValue="instructions">
              <AccordionItem value="instructions" className="border-none">
                <AccordionTrigger className="hover:no-underline py-0">
                  <span className="text-sm font-medium">Setup Instructions</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Open your OpenClaw configuration</li>
                    <li>Add the webhook URL above to your config</li>
                    <li>Restart OpenClaw</li>
                    <li>Connection will show as active once OpenClaw sends its first heartbeat</li>
                  </ol>
                  <a
                    href="https://openclaw.dev/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors"
                  >
                    View full documentation
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Disconnect Dialog */}
        <ConfirmDialog
          open={showDisconnect}
          onOpenChange={setShowDisconnect}
          title="Disconnect OpenClaw"
          description="This will remove your webhook connection. You can reconnect later by generating a new URL."
          confirmText="Disconnect"
          variant="destructive"
          onConfirm={() => disconnectMutation.mutate()}
        />
      </div>
    </DashboardLayout>
  );
}
