/**
 * API Key Selector Dialog
 * 
 * Shown when a board needs to select between multiple available API keys
 * for a given provider. Used during board creation and in board settings.
 */

import { useState } from 'react';
import { Key, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PROVIDERS, type Provider } from '@/config/models';
import type { LLMProvider } from '@/types/database.types';
import type { AvailableApiKey } from '@/hooks/useBoardApiKeys';

interface ApiKeySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: LLMProvider;
  keys: AvailableApiKey[];
  selectedKeyId?: string | null;
  onSelect: (keyId: string) => void;
  isLoading?: boolean;
}

export function ApiKeySelector({
  open,
  onOpenChange,
  provider,
  keys,
  selectedKeyId,
  onSelect,
  isLoading,
}: ApiKeySelectorProps) {
  const [selected, setSelected] = useState<string>(selectedKeyId || '');
  
  const providerInfo = PROVIDERS[provider as Provider] || { name: provider, color: 'hsl(0 0% 50%)' };
  
  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
    }
  };
  
  if (keys.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              No API Keys Available
            </DialogTitle>
            <DialogDescription>
              No API keys are configured for {providerInfo.name}. 
              Please add an API key in Settings &gt; API Keys.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${providerInfo.color}20` }}
            >
              <Key className="h-4 w-4" style={{ color: providerInfo.color }} />
            </div>
            Select API Key for {providerInfo.name}
          </DialogTitle>
          <DialogDescription>
            Multiple API keys are available for this provider. 
            Choose which one this board should use.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup value={selected} onValueChange={setSelected} className="space-y-3">
            {keys.map((key, index) => (
              <div 
                key={key.id}
                className={`flex items-center space-x-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                  selected === key.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border/50 hover:border-border'
                }`}
                onClick={() => setSelected(key.id)}
              >
                <RadioGroupItem value={key.id} id={key.id} />
                <Label htmlFor={key.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Key {index + 1}</span>
                        {key.team_id && (
                          <Badge variant="secondary" className="text-xs">Team</Badge>
                        )}
                        {key.is_valid === false && (
                          <Badge variant="destructive" className="text-xs">Invalid</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {key.key_hint || '••••••'}
                      </p>
                    </div>
                    {selected === key.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selected || isLoading}
            className="gap-2"
          >
            {isLoading ? 'Saving...' : 'Use This Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
