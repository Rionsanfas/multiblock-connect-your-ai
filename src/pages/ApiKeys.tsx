import { useState } from "react";
import { Plus, Key, Eye, EyeOff, Trash2, Check, X, Loader2, Shield, ExternalLink, AlertCircle, Users } from "lucide-react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { toast } from "sonner";
import type { LLMProvider } from "@/types/database.types";
import type { ApiKeyWithTeam } from "@/services/apiKeyService";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTeamContext } from "@/contexts/TeamContext";
import { useApiKeysRefresh } from "@/hooks/usePageRefresh";

// Use canonical provider config from models.ts - SINGLE SOURCE OF TRUTH
import { PROVIDERS, type Provider } from '@/config/models';

// Derive supported providers from the canonical config
const SUPPORTED_PROVIDERS: { id: LLMProvider; name: string; color: string; apiKeyUrl: string }[] = (Object.values(PROVIDERS) as { id: Provider; name: string; color: string; apiKeyUrl: string }[]).map(p => ({
  id: p.id as LLMProvider,
  name: p.name,
  color: p.color,
  apiKeyUrl: p.apiKeyUrl,
}));

export default function ApiKeys() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isTeamWorkspace, currentTeamId, currentTeam, canManageTeam } = useTeamContext();
  
  // Refresh data on page mount
  useApiKeysRefresh();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const [newKey, setNewKey] = useState({
    provider: "" as LLMProvider | "",
    key: "",
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);

  // Fetch API keys based on current workspace
  // Query key includes workspace context for proper cache separation
  const workspaceKey = isTeamWorkspace && currentTeamId ? `team-${currentTeamId}` : 'personal';
  
  const { data: userKeys = [], isLoading: keysLoading, error: keysError, refetch } = useQuery({
    queryKey: ['api-keys', workspaceKey],
    queryFn: async () => {
      console.log('[ApiKeys] Fetching keys for workspace:', workspaceKey);
      const result = isTeamWorkspace && currentTeamId 
        ? await api.keys.listTeamKeys(currentTeamId) 
        : await api.keys.list();
      console.log('[ApiKeys] Fetched keys:', result.length, 'keys');
      return result;
    },
    enabled: isAuthenticated && (!isTeamWorkspace || !!currentTeamId),
    staleTime: 0, // Always treat as stale to ensure fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Mutation to add/update API key
  const addKeyMutation = useMutation({
    mutationFn: ({ provider, apiKey }: { provider: LLMProvider; apiKey: string }) => 
      api.keys.upsert(provider, apiKey, isTeamWorkspace ? currentTeamId : null),
    onSuccess: (data) => {
      console.log('[ApiKeys] Key saved, invalidating cache for:', workspaceKey);
      // Invalidate ALL api-keys queries to ensure fresh data across all views
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      // Also invalidate API key count for plan limits
      queryClient.invalidateQueries({ queryKey: ['user-apikey-count'] });
      // Also invalidate board-specific key queries
      queryClient.invalidateQueries({ queryKey: ['available-keys-for-board'] });
      // Force refetch the current query
      refetch();
      toast.success(isTeamWorkspace ? "Team API key saved successfully" : "API key saved successfully");
      setIsAddModalOpen(false);
      setNewKey({ provider: "", key: "" });
      setTestResult(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to save API key: ${error.message}`);
    },
  });

  // Mutation to delete API key
  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => api.keys.delete(id),
    onSuccess: () => {
      console.log('[ApiKeys] Key deleted, invalidating cache');
      // Invalidate ALL api-keys queries
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      // Also invalidate API key count for plan limits
      queryClient.invalidateQueries({ queryKey: ['user-apikey-count'] });
      // Also invalidate board-specific key queries
      queryClient.invalidateQueries({ queryKey: ['available-keys-for-board'] });
      refetch();
      toast.success("API key removed");
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove API key: ${error.message}`);
    },
  });

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
    addKeyMutation.mutate({ provider: newKey.provider as LLMProvider, apiKey: newKey.key });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteKeyMutation.mutate(deleteId);
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

  const getProviderInfo = (providerId: LLMProvider) => {
    return SUPPORTED_PROVIDERS.find((p) => p.id === providerId) || { 
      id: providerId, 
      name: providerId, 
      color: 'hsl(0 0% 50%)', 
      apiKeyUrl: '#' 
    };
  };

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate("/auth");
    return null;
  }

  if (authLoading || keysLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Check if user can add/delete keys in current workspace
  const canManageKeys = isTeamWorkspace ? canManageTeam : true;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">API Keys</h1>
              {isTeamWorkspace && currentTeam && (
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {currentTeam.team_name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isTeamWorkspace 
                ? "Team API keys are shared with all team members" 
                : "Manage your personal AI provider API keys (BYOK)"}
            </p>
          </div>
          {canManageKeys && (
            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 btn-3d-shiny text-foreground font-medium rounded-xl w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Key
            </Button>
          )}
        </div>

        {/* Security Notice */}
        <GlassCard variant="soft" className="p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 border-primary/20">
          <div className="flex items-center gap-2 sm:gap-3">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-medium">Your keys are stored securely</span>
              <span className="text-muted-foreground ml-1 sm:ml-2 hidden sm:inline">
                {isTeamWorkspace 
                  ? "Team keys are encrypted and accessible to all team members"
                  : "Keys are encrypted in our database"}
              </span>
            </div>
          </div>
        </GlassCard>


        {/* Error State */}
        {keysError && (
          <GlassCard variant="soft" className="p-4 rounded-xl mb-6 border-destructive/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="text-sm text-destructive">
                Failed to load API keys. Please try again.
              </div>
            </div>
          </GlassCard>
        )}

        {userKeys.length === 0 ? (
          <EmptyState
            icon={Key}
            title={isTeamWorkspace ? "No team API keys configured" : "No API keys configured"}
            description={isTeamWorkspace 
              ? "Add team API keys that will be shared with all team members"
              : "Add your AI provider API keys to start using the app with your own accounts"}
            action={canManageKeys ? (
              <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 btn-3d-shiny text-foreground font-medium rounded-xl">
                <Plus className="h-4 w-4" />
                Add Your First Key
              </Button>
            ) : undefined}
          />
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {(userKeys as ApiKeyWithTeam[]).map((key) => {
              const providerInfo = getProviderInfo(key.provider);
              const isTeamKey = !!key.team_id;
              return (
                <GlassCard key={key.id} variant="soft" className="p-3 sm:p-5 rounded-xl sm:rounded-2xl">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center key-icon-3d flex-shrink-0"
                        style={{ backgroundColor: `${providerInfo.color}20` }}
                      >
                        <Key className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: providerInfo.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm sm:text-lg text-foreground truncate">{providerInfo.name}</h3>
                          {key.is_valid === false && (
                            <Badge variant="destructive" className="text-xs">Invalid</Badge>
                          )}
                          {isTeamKey && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Users className="h-3 w-3" />
                              Team
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs text-muted-foreground mt-0.5 sm:mt-1">
                          <span className="font-mono">{showKeys[key.id] ? key.key_hint : "••••••"}</span>
                          <button 
                            onClick={() => toggleShowKey(key.id)}
                            className="p-1 rounded hover:bg-secondary/50 transition-colors"
                          >
                            {showKeys[key.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">Added {formatDate(key.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {canManageKeys && (
                        <button
                          onClick={() => setDeleteId(key.id)}
                          disabled={deleteKeyMutation.isPending}
                          className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all duration-200 hover:scale-105 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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
            <DialogTitle className="text-xl font-semibold">
              {isTeamWorkspace ? "Add Team API Key" : "Add API Key"}
            </DialogTitle>
          </DialogHeader>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Provider</Label>
              <Select 
                value={newKey.provider} 
                onValueChange={(v) => setNewKey({ ...newKey, provider: v as LLMProvider })}
              >
                <SelectTrigger className="bg-secondary/40 border-border/20 rounded-xl h-11">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-xl border-border/30 rounded-xl">
                  {SUPPORTED_PROVIDERS.map((provider) => (
                    <SelectItem 
                      key={provider.id} 
                      value={provider.id}
                      className="rounded-lg cursor-pointer"
                    >
                      {provider.name}
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
                  href={getProviderInfo(newKey.provider as LLMProvider).apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Get one from {getProviderInfo(newKey.provider as LLMProvider).name}
                </a>
              </div>
            )}
            
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
                Your key will be encrypted. Only the first/last characters will be visible.
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
              disabled={!newKey.provider || !newKey.key || addKeyMutation.isPending}
              className="rounded-xl btn-3d-shiny text-foreground font-medium"
            >
              {addKeyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Key
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
