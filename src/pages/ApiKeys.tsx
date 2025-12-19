import { useState } from "react";
import { Plus, Key, Eye, EyeOff, Trash2, Check, X, Loader2, Shield, Star, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/api";
import { toast } from "sonner";
import { PROVIDERS, type Provider } from "@/types";

export default function ApiKeys() {
  const { apiKeys, addApiKey, removeApiKey, updateApiKey, user } = useAppStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const [newKey, setNewKey] = useState({
    provider: "" as Provider | "",
    name: "",
    key: "",
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);

  // Filter keys for current user
  const userKeys = apiKeys.filter((k) => k.user_id === user?.id);

  const handleTest = async () => {
    if (!newKey.provider || !newKey.key) return;
    setIsTesting(true);
    setTestResult(null);
    
    const result = await api.keys.test(newKey.provider, newKey.key);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleAdd = () => {
    if (!newKey.provider || !newKey.key || !user) return;
    
    const masked = newKey.key.slice(0, 5) + "..." + newKey.key.slice(-4);
    const isFirstForProvider = !userKeys.some((k) => k.provider === newKey.provider);
    
    addApiKey({
      user_id: user.id,
      provider: newKey.provider as Provider,
      name: newKey.name || `${PROVIDERS[newKey.provider as Provider].name} Key`,
      key_value: newKey.key, // Store the actual key for API calls
      key_masked: masked,
      key_hash: `hash-${Date.now()}`,
      encryption_method: 'mock',
      is_valid: true, // Valid until proven otherwise at runtime
      is_default: isFirstForProvider,
      usage_count: 0,
    });
    
    toast.success("API key added successfully");
    setIsAddModalOpen(false);
    setNewKey({ provider: "", name: "", key: "" });
    setTestResult(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    removeApiKey(deleteId);
    toast.success("API key removed");
    setDeleteId(null);
  };

  const handleSetDefault = (keyId: string, provider: Provider) => {
    // Unset current default for this provider
    userKeys
      .filter((k) => k.provider === provider && k.is_default)
      .forEach((k) => updateApiKey(k.id, { is_default: false }));
    
    // Set new default
    updateApiKey(keyId, { is_default: true });
    toast.success("Default key updated");
  };

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">API Keys</h1>
            <p className="text-muted-foreground">Manage your AI provider API keys (BYOK)</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 btn-3d-shiny text-foreground font-medium rounded-xl">
            <Plus className="h-4 w-4" />
            Add Key
          </Button>
        </div>

        {/* Security Notice */}
        <GlassCard variant="soft" className="p-4 rounded-xl mb-6 border-primary/20">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div className="text-sm">
              <span className="font-medium">Your keys are encrypted</span>
              <span className="text-muted-foreground ml-2">Keys are stored securely and never exposed after creation</span>
            </div>
          </div>
        </GlassCard>

        {userKeys.length === 0 ? (
          <EmptyState
            icon={Key}
            title="No API keys configured"
            description="Add your AI provider API keys to start using the app with your own accounts"
            action={
              <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 btn-3d-shiny text-foreground font-medium rounded-xl">
                <Plus className="h-4 w-4" />
                Add Your First Key
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {userKeys.map((key) => {
              const providerInfo = PROVIDERS[key.provider];
              return (
                <GlassCard key={key.id} variant="soft" className="p-5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center key-icon-3d"
                        style={{ backgroundColor: `${providerInfo.color}20` }}
                      >
                        <Key className="h-5 w-5" style={{ color: providerInfo.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-white">{key.name}</h3>
                          {key.is_default && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Star className="h-3 w-3" />
                              Default
                            </Badge>
                          )}
                          {!key.is_valid && (
                            <Badge variant="destructive" className="text-xs">Invalid</Badge>
                          )}
                        </div>
                        <p className="text-sm text-white/60 capitalize">{providerInfo.name}</p>
                        <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                          <span className="font-mono">{showKeys[key.id] ? key.key_masked : "••••••••••••"}</span>
                          <button 
                            onClick={() => toggleShowKey(key.id)}
                            className="p-1 rounded hover:bg-white/10 transition-colors"
                          >
                            {showKeys[key.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                          <span>•</span>
                          <span>Used {key.usage_count} times</span>
                          {key.last_used_at && (
                            <>
                              <span>•</span>
                              <span>Last used {formatDate(key.last_used_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!key.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(key.id, key.provider)}
                          className="text-xs"
                        >
                          Set Default
                        </Button>
                      )}
                      <button
                        onClick={() => setDeleteId(key.id)}
                        className="p-2.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all duration-200 hover:scale-105"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
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
              <Select 
                value={newKey.provider} 
                onValueChange={(v) => setNewKey({ ...newKey, provider: v as Provider })}
              >
                <SelectTrigger className="select-trigger-shiny">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent className="select-content-shiny">
                  {Object.entries(PROVIDERS).map(([key, value]) => (
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
            {/* Get API Key Link */}
            {newKey.provider && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30 border border-border/20">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Don't have a key?</span>
                <a
                  href={PROVIDERS[newKey.provider as Provider].apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Get one from {PROVIDERS[newKey.provider as Provider].name}
                </a>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Name (optional)</Label>
              <Input
                value={newKey.name}
                onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                placeholder="e.g., Production Key, Personal Key"
                className="bg-secondary/40 border-border/20 rounded-xl h-12"
              />
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
              <p className="text-xs text-muted-foreground">
                Your key will be encrypted and only the last 4 characters will be visible
              </p>
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