import { useState } from "react";
import { Lock, Loader2, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeyAccessService } from "@/services/apiKeyAccessService";
import { toast } from "sonner";

interface ApiKeyAccessRequestButtonProps {
  teamId: string;
  apiKeyId: string;
  providerName: string;
}

export function ApiKeyAccessRequestButton({ 
  teamId, 
  apiKeyId, 
  providerName 
}: ApiKeyAccessRequestButtonProps) {
  const queryClient = useQueryClient();

  // Check if user already has a pending request
  const { data: hasPendingRequest, isLoading: checkingPending } = useQuery({
    queryKey: ['api-key-access-pending', apiKeyId],
    queryFn: () => apiKeyAccessService.hasPendingRequest(apiKeyId),
  });

  // Check if user already has access
  const { data: hasAccess, isLoading: checkingAccess } = useQuery({
    queryKey: ['api-key-access', apiKeyId],
    queryFn: () => apiKeyAccessService.hasAccess(apiKeyId),
  });

  const requestMutation = useMutation({
    mutationFn: () => apiKeyAccessService.requestAccess(teamId, apiKeyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-key-access-pending', apiKeyId] });
      toast.success(`Access requested for ${providerName} key`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to request access');
    }
  });

  const isLoading = checkingPending || checkingAccess || requestMutation.isPending;

  if (hasAccess) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-500">
        <Check className="h-3 w-3" />
        <span>Access granted</span>
      </div>
    );
  }

  if (hasPendingRequest) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-500">
        <Clock className="h-3 w-3" />
        <span>Request pending</span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => requestMutation.mutate()}
      disabled={isLoading}
      className="h-7 text-xs gap-1.5 rounded-lg"
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Lock className="h-3 w-3" />
      )}
      Request Access
    </Button>
  );
}
