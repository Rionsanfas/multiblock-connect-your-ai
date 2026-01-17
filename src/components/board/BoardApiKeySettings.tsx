/**
 * Board API Key Settings
 * 
 * Allows users to view and change the API key linked to a board.
 * Shows in board settings panel.
 */

import { useState } from 'react';
import { Key, ChevronDown, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  useAvailableKeysForBoard, 
  useBoardLinkedKey, 
  useUpdateBoardApiKey,
  type AvailableApiKey 
} from '@/hooks/useBoardApiKeys';
import { PROVIDERS, type Provider } from '@/config/models';
import type { LLMProvider } from '@/types/database.types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface BoardApiKeySettingsProps {
  boardId: string;
  /** Optional: filter to show only keys for a specific provider */
  provider?: LLMProvider;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Callback after key is changed */
  onKeyChange?: (keyId: string | null) => void;
}

export function BoardApiKeySettings({ 
  boardId, 
  provider,
  compact = false,
  onKeyChange,
}: BoardApiKeySettingsProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: availableKeys = [], isLoading: keysLoading } = useAvailableKeysForBoard(boardId);
  const { data: linkedKeyId, isLoading: linkedLoading } = useBoardLinkedKey(boardId);
  const updateBoardKey = useUpdateBoardApiKey();
  
  // Filter keys by provider if specified
  const filteredKeys = provider 
    ? availableKeys.filter(k => k.provider === provider)
    : availableKeys;
  
  // Group keys by provider for the dropdown
  const keysByProvider = filteredKeys.reduce((acc, key) => {
    if (!acc[key.provider]) {
      acc[key.provider] = [];
    }
    acc[key.provider].push(key);
    return acc;
  }, {} as Record<LLMProvider, AvailableApiKey[]>);
  
  const linkedKey = availableKeys.find(k => k.id === linkedKeyId);
  const isLoading = keysLoading || linkedLoading;
  
  const handleSelectKey = async (keyId: string) => {
    try {
      await updateBoardKey.mutateAsync({ boardId, apiKeyId: keyId });
      toast.success('Board API key updated');
      onKeyChange?.(keyId);
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to update API key');
    }
  };
  
  const handleClearKey = async () => {
    try {
      await updateBoardKey.mutateAsync({ boardId, apiKeyId: null });
      toast.success('Board API key cleared');
      onKeyChange?.(null);
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to clear API key');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }
  
  if (filteredKeys.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <span className="text-sm text-muted-foreground">
          No API keys configured
        </span>
        <Button 
          variant="link" 
          size="sm" 
          className="text-primary p-0 h-auto"
          onClick={() => navigate('/settings/keys')}
        >
          Add keys
        </Button>
      </div>
    );
  }
  
  const getProviderInfo = (p: LLMProvider) => 
    PROVIDERS[p as Provider] || { name: p, color: 'hsl(0 0% 50%)' };
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size={compact ? "sm" : "default"}
          className="gap-2 justify-between"
          disabled={updateBoardKey.isPending}
        >
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            {linkedKey ? (
              <>
                <span>{getProviderInfo(linkedKey.provider).name}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {linkedKey.key_hint}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Select API Key</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Select API Key for Board</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {Object.entries(keysByProvider).map(([prov, keys]) => {
          const provInfo = getProviderInfo(prov as LLMProvider);
          return (
            <div key={prov}>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                {provInfo.name}
              </DropdownMenuLabel>
              {keys.map((key, idx) => (
                <DropdownMenuItem
                  key={key.id}
                  onClick={() => handleSelectKey(key.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${provInfo.color}20` }}
                    >
                      <Key className="h-3 w-3" style={{ color: provInfo.color }} />
                    </div>
                    <div>
                      <span className="text-sm">Key {idx + 1}</span>
                      {key.team_id && (
                        <Badge variant="secondary" className="ml-1 text-[10px] py-0">Team</Badge>
                      )}
                      <p className="text-xs text-muted-foreground font-mono">
                        {key.key_hint}
                      </p>
                    </div>
                  </div>
                  {linkedKeyId === key.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          );
        })}
        
        {linkedKeyId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleClearKey}
              className="text-muted-foreground cursor-pointer"
            >
              Clear selection
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
