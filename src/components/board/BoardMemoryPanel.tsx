import { useState } from 'react';
import { Brain, Plus, Trash2, Edit2, Check, X, Lightbulb, Scale, AlertTriangle, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useBoardMemory, useMemoryActions, type MemoryItemType, type MemoryItem } from '@/hooks/useBoardMemory';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BoardMemoryPanelProps {
  boardId: string;
}

const TYPE_CONFIG: Record<MemoryItemType, { label: string; icon: typeof Lightbulb; color: string }> = {
  fact: { label: 'Fact', icon: Lightbulb, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  decision: { label: 'Decision', icon: Scale, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  constraint: { label: 'Constraint', icon: AlertTriangle, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  note: { label: 'Note', icon: StickyNote, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

function MemoryItemCard({ item, onUpdate, onDelete }: { 
  item: MemoryItem; 
  onUpdate: (id: string, updates: { type?: MemoryItemType; content?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [editType, setEditType] = useState<MemoryItemType>(item.type);
  const [isSaving, setIsSaving] = useState(false);

  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  const handleSave = async () => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    try {
      await onUpdate(item.id, { 
        content: editContent.trim(),
        type: editType,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(item.content);
    setEditType(item.type);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg bg-secondary/40 border border-border/50 space-y-2">
        <Select value={editType} onValueChange={(v) => setEditType(v as MemoryItemType)}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
              <SelectItem key={type} value={type}>
                <span className="flex items-center gap-1.5">
                  <cfg.icon className="h-3 w-3" />
                  {cfg.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea 
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="min-h-[60px] text-sm resize-none"
          autoFocus
        />
        <div className="flex gap-1.5 justify-end">
          <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving}>
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || !editContent.trim()}>
            <Check className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group p-3 rounded-lg bg-secondary/30 border border-border/30 hover:border-border/50 transition-colors">
      <div className="flex items-start gap-2">
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", config.color)}>
          <Icon className="h-2.5 w-2.5 mr-1" />
          {config.label}
        </Badge>
        <p className="text-sm text-foreground/90 flex-1 leading-relaxed">{item.content}</p>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BoardMemoryPanel({ boardId }: BoardMemoryPanelProps) {
  const { data: items = [], isLoading } = useBoardMemory(boardId);
  const { createMemory, updateMemory, deleteMemory, isCreating } = useMemoryActions(boardId);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<MemoryItemType>('note');

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    try {
      await createMemory({ type: newType, content: newContent.trim() });
      setNewContent('');
      setIsAdding(false);
      toast.success('Memory saved');
    } catch (error) {
      toast.error('Failed to save memory');
    }
  };

  const handleUpdate = async (id: string, updates: { type?: MemoryItemType; content?: string }) => {
    try {
      await updateMemory({ id, ...updates });
      toast.success('Memory updated');
    } catch (error) {
      toast.error('Failed to update memory');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMemory(id);
      toast.success('Memory deleted');
    } catch (error) {
      toast.error('Failed to delete memory');
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="p-2.5 sm:p-3 rounded-xl key-icon-3d text-foreground h-9 w-9 sm:h-10 sm:w-10 relative"
        >
          <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
          {items.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {items.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[340px] sm:w-[400px] flex flex-col">
        <SheetHeader className="pb-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Board Memory
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Curated knowledge shared across all blocks on this board.
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 py-4">
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-sm text-muted-foreground text-center py-8">Loading...</div>
            ) : items.length === 0 && !isAdding ? (
              <div className="text-center py-8">
                <Brain className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">No memory items yet</p>
                <p className="text-xs text-muted-foreground/60">
                  Save important facts, decisions, or constraints here
                </p>
              </div>
            ) : (
              items.map((item) => (
                <MemoryItemCard 
                  key={item.id} 
                  item={item} 
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))
            )}

            {isAdding && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <Select value={newType} onValueChange={(v) => setNewType(v as MemoryItemType)}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                      <SelectItem key={type} value={type}>
                        <span className="flex items-center gap-1.5">
                          <cfg.icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea 
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter memory content..."
                  className="min-h-[80px] text-sm resize-none"
                  autoFocus
                />
                <div className="flex gap-1.5 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => { setIsAdding(false); setNewContent(''); }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleCreate} disabled={isCreating || !newContent.trim()}>
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {!isAdding && (
          <div className="pt-4 border-t border-border/50">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Memory
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
