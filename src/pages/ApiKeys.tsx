import { useState } from "react";
import { Plus, Key, Eye, EyeOff, Trash2, Check, X, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/api";
import { toast } from "sonner";
import { MODEL_PROVIDERS } from "@/types";

export default function ApiKeys() {
  const { apiKeys, addApiKey, removeApiKey } = useAppStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const [newKey, setNewKey] = useState({
    provider: "",
    key: "",
    clientOnly: false,
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);

  const handleTest = async () => {
    if (!newKey.provider || !newKey.key) return;
    setIsTesting(true);
    setTestResult(null);
    
    const result = await api.keys.test(newKey.provider, newKey.key);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleAdd = () => {
    if (!newKey.provider || !newKey.key) return;
    
    const masked = newKey.key.slice(0, 5) + "..." + newKey.key.slice(-4);
    addApiKey({
      provider: newKey.provider,
      key_masked: masked,
      is_valid: testResult?.valid ?? false,
      client_only: newKey.clientOnly,
    });
    
    toast.success("API key added");
    setIsAddModalOpen(false);
    setNewKey({ provider: "", key: "", clientOnly: false });
    setTestResult(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    removeApiKey(deleteId);
    toast.success("API key removed");
    setDeleteId(null);
  };

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">API Keys</h1>
            <p className="text-muted-foreground">Manage your AI provider API keys</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Key
          </Button>
        </div>

        {apiKeys.length === 0 ? (
          <EmptyState
            icon={Key}
            title="No API keys configured"
            description="Add your AI provider API keys to start using the app"
            action={
              <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Key
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <GlassCard key={key.id} variant="hover" className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${MODEL_PROVIDERS[key.provider as keyof typeof MODEL_PROVIDERS]?.color || "hsl(0 0% 60%)"}20`,
                      }}
                    >
                      <Key className="h-5 w-5" style={{
                        color: MODEL_PROVIDERS[key.provider as keyof typeof MODEL_PROVIDERS]?.color || "hsl(0 0% 60%)",
                      }} />
                    </div>
                    <div>
                      <h3 className="font-medium capitalize">{key.provider}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{showKeys[key.id] ? key.key_masked : "••••••••••••"}</span>
                        <button onClick={() => toggleShowKey(key.id)}>
                          {showKeys[key.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${key.is_valid ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {key.is_valid ? "Valid" : "Unverified"}
                    </span>
                    {key.client_only && (
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                        Client-only
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(key.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Add Key Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={newKey.provider} onValueChange={(v) => setNewKey({ ...newKey, provider: v })}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(MODEL_PROVIDERS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={newKey.key}
                onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                placeholder="sk-..."
                className="bg-secondary/50"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Client-only mode</Label>
                <p className="text-xs text-muted-foreground">Store key in browser only</p>
              </div>
              <Switch
                checked={newKey.clientOnly}
                onCheckedChange={(c) => setNewKey({ ...newKey, clientOnly: c })}
              />
            </div>
            {testResult && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${testResult.valid ? "bg-green-500/20 text-green-400" : "bg-destructive/20 text-destructive"}`}>
                {testResult.valid ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {testResult.valid ? "API key is valid!" : testResult.error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleTest} disabled={!newKey.provider || !newKey.key || isTesting}>
              {isTesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Test Key
            </Button>
            <Button onClick={handleAdd} disabled={!newKey.provider || !newKey.key}>
              Add Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Remove API Key"
        description="Are you sure you want to remove this API key? You'll need to add it again to use this provider."
        confirmText="Remove"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
