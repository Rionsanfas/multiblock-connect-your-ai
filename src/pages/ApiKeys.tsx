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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">API Keys</h1>
            <p className="text-muted-foreground">Manage your AI provider API keys</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 btn-3d-shiny text-foreground font-medium rounded-xl">
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
              <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 btn-3d-shiny text-foreground font-medium rounded-xl">
                <Plus className="h-4 w-4" />
                Add Your First Key
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <GlassCard key={key.id} variant="soft" className="p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10 key-icon-3d">
                      <Key className="h-5 w-5 text-white drop-shadow-[0_2px_4px_rgba(255,255,255,0.3)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold capitalize text-lg text-white">{key.provider}</h3>
                      <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
                        <span className="font-mono">{showKeys[key.id] ? key.key_masked : "••••••••••••"}</span>
                        <button 
                          onClick={() => toggleShowKey(key.id)}
                          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          {showKeys[key.id] ? <EyeOff className="h-3.5 w-3.5 text-white/60" /> : <Eye className="h-3.5 w-3.5 text-white/60" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDeleteId(key.id)}
                      className="p-2.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all duration-200 hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Add Key Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/20 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Provider</Label>
              <Select value={newKey.provider} onValueChange={(v) => setNewKey({ ...newKey, provider: v })}>
                <SelectTrigger className="select-trigger-shiny">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent className="select-content-shiny">
                  {Object.entries(MODEL_PROVIDERS).map(([key, value]) => (
                    <SelectItem 
                      key={key} 
                      value={key}
                      className="select-item-shiny"
                    >
                      {value.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">API Key</Label>
              <Input
                type="password"
                value={newKey.key}
                onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                placeholder="sk-..."
                className="bg-secondary/40 border-border/20 rounded-xl h-12"
              />
            </div>
            {testResult && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${
                testResult.valid 
                  ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                  : "bg-destructive/20 text-destructive border border-destructive/30"
              }`}>
                {testResult.valid ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                <span className="font-medium">{testResult.valid ? "API key is valid!" : testResult.error}</span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={handleTest} 
              disabled={!newKey.provider || !newKey.key || isTesting}
              className="rounded-xl btn-3d"
            >
              {isTesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Test Key
            </Button>
            <Button 
              onClick={handleAdd} 
              disabled={!newKey.provider || !newKey.key}
              className="rounded-xl btn-3d-shiny text-foreground font-medium"
            >
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