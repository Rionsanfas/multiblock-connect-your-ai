import { useState } from "react";
import { Check, X, Loader2, Clock, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeyAccessService, ApiKeyAccessRequest } from "@/services/apiKeyAccessService";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { LLMProvider } from "@/types/database.types";

const PROVIDER_COLORS: Record<LLMProvider, string> = {
  openai: 'hsl(142 70% 45%)',
  anthropic: 'hsl(24 90% 55%)',
  google: 'hsl(217 90% 60%)',
  xai: 'hsl(0 0% 70%)',
  deepseek: 'hsl(200 80% 50%)',
  mistral: 'hsl(35 90% 55%)',
  cohere: 'hsl(280 70% 55%)',
  together: 'hsl(220 80% 55%)',
  perplexity: 'hsl(180 70% 45%)',
};

interface PendingAccessRequestsProps {
  teamId: string;
}

export function PendingAccessRequests({ teamId }: PendingAccessRequestsProps) {
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['api-key-access-requests', teamId],
    queryFn: () => apiKeyAccessService.getPendingRequests(teamId),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ requestId, approved, reason }: { requestId: string; approved: boolean; reason?: string }) =>
      apiKeyAccessService.resolveRequest(requestId, approved, reason),
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['api-key-access-requests', teamId] });
      queryClient.invalidateQueries({ queryKey: ['api-key-access-pending'] });
      toast.success(approved ? 'Access granted' : 'Request rejected');
      setRejectingId(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to resolve request');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-500" />
        <h3 className="font-semibold text-sm">Pending Access Requests</h3>
        <Badge variant="secondary" className="text-xs">{requests.length}</Badge>
      </div>

      <div className="space-y-3">
        {requests.map((request) => {
          const providerColor = request.api_key?.provider 
            ? PROVIDER_COLORS[request.api_key.provider] 
            : 'hsl(0 0% 50%)';
          
          return (
            <GlassCard key={request.id} variant="soft" className="p-4 rounded-xl">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${providerColor}20` }}
                    >
                      <Key className="h-4 w-4" style={{ color: providerColor }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {request.requester?.full_name || request.requester?.email || 'Unknown user'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {request.api_key?.provider || 'Unknown'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Requested {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {rejectingId !== request.id && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRejectingId(request.id)}
                        disabled={resolveMutation.isPending}
                        className="h-8 text-xs gap-1.5 rounded-lg text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => resolveMutation.mutate({ requestId: request.id, approved: true })}
                        disabled={resolveMutation.isPending}
                        className="h-8 text-xs gap-1.5 rounded-lg btn-3d-shiny text-foreground"
                      >
                        {resolveMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Approve
                      </Button>
                    </div>
                  )}
                </div>

                {rejectingId === request.id && (
                  <div className="flex items-center gap-2 pl-12">
                    <Input
                      placeholder="Reason (optional)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="h-8 text-xs rounded-lg flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectionReason("");
                      }}
                      className="h-8 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => resolveMutation.mutate({ 
                        requestId: request.id, 
                        approved: false, 
                        reason: rejectionReason 
                      })}
                      disabled={resolveMutation.isPending}
                      className="h-8 text-xs gap-1.5"
                    >
                      {resolveMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                      Confirm Reject
                    </Button>
                  </div>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
