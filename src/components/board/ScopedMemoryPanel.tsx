import { useState, useMemo } from 'react';
import { Brain, Plus, Trash2, Edit2, Check, X, Lightbulb, Scale, AlertTriangle, StickyNote, Filter, Globe, Box, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchBar } from '@/components/ui/search-bar';
import { useScopedBoardMemory, useScopedMemoryActions, type MemoryScope, type ScopedMemoryItem } from '@/hooks/useScopedMemory';
import type { MemoryItemType } from '@/hooks/useBoardMemory';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ScopedMemoryPanelProps {
  boardId: string;
  currentBlockId?: string;
}

const TYPE_CONFIG: Record<MemoryItemType, { label: string; icon: typeof Lightbulb; color: string }> = {
  fact: { label: 'Fact', icon: Lightbulb, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  decision: { label: 'Decision', icon: Scale, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  constraint: { label: 'Constraint', icon: AlertTriangle, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  note: { label: 'Note', icon: StickyNote, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

const SCOPE_CONFIG: Record<MemoryScope, { label: string; icon: typeof Globe; color: string }> = {
  board: { label: 'Board', icon: Globe, color: 'bg-primary/20 text-primary border-primary/30' },
  block: { label: 'Block', icon: Box, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  chat: { label: 'Chat', icon: MessageSquare, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
};

function MemoryItemCard({ 
  item, 
  onUpdate, 
  onDelete,
  showScope = true,
}: { 
  item: ScopedMemoryItem; 
  onUpdate: (id: string, updates: { type?: MemoryItemType; content?: string; scope?: MemoryScope }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  showScope?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [editType, setEditType] = useState<MemoryItemType>(item.type);
  const [editScope, setEditScope] = useState<MemoryScope>(item.scope);
  const [isSaving, setIsSaving] = useState(false);

  const typeConfig = TYPE_CONFIG[item.type];
  const scopeConfig = SCOPE_CONFIG[item.scope];
  const TypeIcon = typeConfig.icon;
  const ScopeIcon = scopeConfig.icon;

  const handleSave = async () => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    try {
      await onUpdate(item.id, { 
        content: editContent.trim(),
        type: editType,
        scope: editScope,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(item.content);
    setEditType(item.type);
    setEditScope(item.scope);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg bg-secondary/40 border border-border/50 space-y-2">
        <div className="flex gap-2">
          <Select value={editType} onValueChange={(v) => setEditType(v as MemoryItemType)}>
            <SelectTrigger className="w-28 h-8 text-xs">
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
          <Select value={editScope} onValueChange={(v) => setEditScope(v as MemoryScope)}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SCOPE_CONFIG).map(([scope, cfg]) => (
                <SelectItem key={scope} value={scope}>
                  <span className="flex items-center gap-1.5">
                    <cfg.icon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <div className="flex flex-col gap-1 shrink-0">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", typeConfig.color)}>
            <TypeIcon className="h-2.5 w-2.5 mr-1" />
            {typeConfig.label}
          </Badge>
          {showScope && (
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", scopeConfig.color)}>
              <ScopeIcon className="h-2.5 w-2.5 mr-1" />
              {scopeConfig.label}
            </Badge>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/90 leading-relaxed">{item.content}</p>
          {item.keywords && item.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.keywords.slice(0, 3).map((kw) => (
                <span key={kw} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
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

export function ScopedMemoryPanel({ boardId, currentBlockId }: ScopedMemoryPanelProps) {
  const { data: items = [], isLoading } = useScopedBoardMemory(boardId);
  const { createMemory, updateMemory, deleteMemory, isCreating } = useScopedMemoryActions(boardId);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<MemoryItemType>('note');
  const [newScope, setNewScope] = useState<MemoryScope>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState<MemoryScope | 'all'>('all');

  // Filter items based on search and scope
  const filteredItems = useMemo(() => {
    let result = items;
    
    if (filterScope !== 'all') {
      result = result.filter(item => item.scope === filterScope);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.content.toLowerCase().includes(query) ||
        item.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [items, filterScope, searchQuery]);

  // Separate items by scope for tab counts
  const boardItems = items.filter(i => i.scope === 'board');
  const blockItems = items.filter(i => i.scope === 'block');
  const chatItems = items.filter(i => i.scope === 'chat');

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    try {
      await createMemory({ 
        type: newType, 
        content: newContent.trim(),
        scope: newScope,
        sourceBlockId: newScope !== 'board' ? currentBlockId : undefined,
      });
      setNewContent('');
      setIsAdding(false);
      toast.success('Memory saved');
    } catch (error) {
      toast.error('Failed to save memory');
    }
  };

  const handleUpdate = async (id: string, updates: { type?: MemoryItemType; content?: string; scope?: MemoryScope }) => {
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
      <SheetContent className="w-[380px] sm:w-[440px] flex flex-col">
        <SheetHeader className="pb-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Board Memory
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Curated knowledge shared across blocks. Filter by scope to control context.
          </p>
        </SheetHeader>

        {/* Search and Filter */}
        <div className="py-3 space-y-2 border-b border-border/30">
          <SearchBar 
            placeholder="Search memory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
          <div className="flex gap-2 items-center">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={filterScope} onValueChange={(v) => setFilterScope(v as MemoryScope | 'all')}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes ({items.length})</SelectItem>
                <SelectItem value="board">
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> Board ({boardItems.length})
                  </span>
                </SelectItem>
                <SelectItem value="block">
                  <span className="flex items-center gap-1.5">
                    <Box className="h-3 w-3" /> Block ({blockItems.length})
                  </span>
                </SelectItem>
                <SelectItem value="chat">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3" /> Chat ({chatItems.length})
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6 py-4">
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-sm text-muted-foreground text-center py-8">Loading...</div>
            ) : filteredItems.length === 0 && !isAdding ? (
              <div className="text-center py-8">
                <Brain className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  {searchQuery || filterScope !== 'all' ? 'No matching items' : 'No memory items yet'}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  {searchQuery || filterScope !== 'all' ? 'Try adjusting your filters' : 'Save important facts, decisions, or constraints here'}
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <MemoryItemCard 
                  key={item.id} 
                  item={item} 
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  showScope={filterScope === 'all'}
                />
              ))
            )}

            {isAdding && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex gap-2">
                  <Select value={newType} onValueChange={(v) => setNewType(v as MemoryItemType)}>
                    <SelectTrigger className="w-28 h-8 text-xs">
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
                  <Select value={newScope} onValueChange={(v) => setNewScope(v as MemoryScope)}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SCOPE_CONFIG).map(([scope, cfg]) => (
                        <SelectItem key={scope} value={scope}>
                          <span className="flex items-center gap-1.5">
                            <cfg.icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
