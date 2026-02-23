import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Copy, Check, Plus, Trash2, PlugZap, BookOpen, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwZWxqd3F0a2pqa3Jpb2JraHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwOTA0OTcsImV4cCI6MjA4MDY2NjQ5N30.5hirMul5IdE2XW6H6v_rv8roO81hogPQsEAUMeHf8io";

function isConnectedRecently(lastHeartbeat: string | null): boolean {
  if (!lastHeartbeat) return false;
  return Date.now() - new Date(lastHeartbeat).getTime() < 2 * 60 * 1000;
}

interface OpenClawConnection {
  id: string;
  user_id: string;
  webhook_url: string;
  webhook_token: string;
  last_heartbeat: string | null;
  status: string | null;
  connection_name: string;
  created_at: string | null;
  updated_at: string | null;
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(label ? `${label} copied!` : "Copied!");
  };
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 h-9 w-9 p-0">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function ConnectionCard({
  connection,
  onDelete,
  onSetupView,
  onRename,
}: {
  connection: OpenClawConnection;
  onDelete: (id: string) => void;
  onSetupView: (c: OpenClawConnection) => void;
  onRename: (id: string, name: string) => void;
}) {
  const isConnected = isConnectedRecently(connection.last_heartbeat);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(connection.connection_name);

  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== connection.connection_name) {
      onRename(connection.id, trimmed);
    } else {
      setEditName(connection.connection_name);
    }
    setEditing(false);
  };

  const truncatedKey = SUPABASE_ANON_KEY.slice(0, 20) + "...";

  return (
    <Card className="border-border/50 flex flex-col">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between gap-2">
          {editing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              className="h-7 text-sm font-semibold"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors text-left truncate"
            >
              {connection.connection_name}
              <Pencil className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>
          )}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn("h-2 w-2 rounded-full", isConnected ? "bg-emerald-500" : "bg-destructive")} />
            <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0">
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0 space-y-3 flex-1">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Webhook URL</Label>
          <div className="flex gap-2">
            <Input value={connection.webhook_url} readOnly className="font-mono text-xs h-9" />
            <CopyButton value={connection.webhook_url} label="Webhook URL" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">API Key Header</Label>
          <div className="flex gap-2">
            <Input value={truncatedKey} readOnly className="font-mono text-xs h-9" />
            <CopyButton value={SUPABASE_ANON_KEY} label="API key" />
          </div>
          <p className="text-[10px] text-muted-foreground">Include this in the <code className="bg-secondary/60 px-1 rounded text-[10px]">apikey</code> header</p>
        </div>
        {connection.last_heartbeat && (
          <p className="text-[10px] text-muted-foreground">
            Last seen: {formatDistanceToNow(new Date(connection.last_heartbeat), { addSuffix: true })}
          </p>
        )}
      </CardContent>
      <CardFooter className="px-4 pb-3 pt-0 flex items-center justify-between">
        <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => onSetupView(connection)}>
          <BookOpen className="h-3 w-3 mr-1.5" />
          View Setup
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(connection.id)}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

export function OpenClawSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [setupConnection, setSetupConnection] = useState<OpenClawConnection | null>(null);

  const { data: connections, isLoading, isError } = useQuery({
    queryKey: ["openclaw-connections", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("openclaw_connections")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OpenClawConnection[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("openclaw_connections")
        .insert({ user_id: user!.id, connection_name: name });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openclaw-connections"] });
      setShowCreate(false);
      setNewName("");
      toast.success("Connection created!");
    },
    onError: () => toast.error("Failed to create connection"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("openclaw_connections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openclaw-connections"] });
      setDeleteId(null);
      toast.success("Connection deleted");
    },
    onError: () => toast.error("Failed to delete connection"),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("openclaw_connections")
        .update({ connection_name: name })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openclaw-connections"] });
    },
    onError: () => toast.error("Failed to rename connection"),
  });

  if (isError) {
    return (
      <Card className="mb-6 border-border/50">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Failed to load OpenClaw connections.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PlugZap className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">OpenClaw Connections</h2>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="h-3 w-3" />
            Add Connection
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2].map((i) => (
              <Card key={i} className="border-border/50 p-4 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </Card>
            ))}
          </div>
        ) : connections && connections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {connections.map((c) => (
              <ConnectionCard
                key={c.id}
                connection={c}
                onDelete={setDeleteId}
                onSetupView={setSetupConnection}
                onRename={(id, name) => renameMutation.mutate({ id, name })}
              />
            ))}
          </div>
        ) : (
          <Card className="border-border/50">
            <EmptyState
              icon={PlugZap}
              title="No connections yet"
              description="Add your first OpenClaw connection to start syncing."
              action={
                <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Add Connection
                </Button>
              }
              className="py-8"
            />
          </Card>
        )}
      </div>

      {/* Add Connection Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add OpenClaw Connection</DialogTitle>
            <DialogDescription>
              Name this connection to identify which device it's running on.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Connection Name</Label>
            <Input
              placeholder="e.g., Work Laptop, Home PC"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) createMutation.mutate(newName.trim());
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(newName.trim())}
              disabled={!newName.trim() || createMutation.isPending}
            >
              Create Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setup Instructions Dialog */}
      <Dialog open={!!setupConnection} onOpenChange={(o) => !o && setSetupConnection(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Setup Instructions for {setupConnection?.connection_name}</DialogTitle>
            <DialogDescription>Follow these steps to connect your OpenClaw installation.</DialogDescription>
          </DialogHeader>
          <Accordion type="single" collapsible defaultValue="step-1" className="w-full">
            <AccordionItem value="step-1">
              <AccordionTrigger className="text-sm">Step 1: Install OpenClaw</AccordionTrigger>
              <AccordionContent>
                <div className="bg-secondary/60 rounded-lg p-3 font-mono text-xs break-all">
                  curl -sSL https://openclaw.ai/install | sh
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="step-2">
              <AccordionTrigger className="text-sm">Step 2: Configure Webhook</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Set the webhook URL:</p>
                <div className="bg-secondary/60 rounded-lg p-3 font-mono text-xs break-all flex items-start gap-2">
                  <span className="flex-1">openclaw config set webhook.url "{setupConnection?.webhook_url}"</span>
                  {setupConnection && <CopyButton value={`openclaw config set webhook.url "${setupConnection.webhook_url}"`} />}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="step-3">
              <AccordionTrigger className="text-sm">Step 3: Add API Key</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Set the API key header:</p>
                <div className="bg-secondary/60 rounded-lg p-3 font-mono text-xs break-all flex items-start gap-2">
                  <span className="flex-1">openclaw config set webhook.headers '{`{"apikey": "${SUPABASE_ANON_KEY}"}`}'</span>
                  <CopyButton value={`openclaw config set webhook.headers '{"apikey": "${SUPABASE_ANON_KEY}"}'`} />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="step-4">
              <AccordionTrigger className="text-sm">Step 4: Restart OpenClaw</AccordionTrigger>
              <AccordionContent>
                <div className="bg-secondary/60 rounded-lg p-3 font-mono text-xs">
                  openclaw restart
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="step-5">
              <AccordionTrigger className="text-sm">Step 5: Verify Connection</AccordionTrigger>
              <AccordionContent>
                <p className="text-xs text-muted-foreground">
                  Return to this page and check if the status shows "Connected" (green badge). Status updates every 30 seconds.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupConnection(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Connection"
        description="Delete this connection? This cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </>
  );
}
