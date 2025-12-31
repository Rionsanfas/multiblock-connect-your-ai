import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Users, User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTeamContext } from '@/contexts/TeamContext';
import { CreateTeamDialog } from './CreateTeamDialog';
import { toast } from 'sonner';

const MAX_TEAMS_PER_USER = 2;

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ collapsed = false }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const {
    currentWorkspace,
    teams,
    teamsLoading,
    switchToPersonal,
    switchToTeam,
    isPersonalWorkspace,
  } = useTeamContext();

  const currentLabel = isPersonalWorkspace 
    ? 'Personal' 
    : currentWorkspace.teamName || 'Team';

  const handleSelect = (value: string) => {
    if (value === 'personal') {
      switchToPersonal();
    } else {
      switchToTeam(value);
    }
    setOpen(false);
  };

  const handleCreateTeam = () => {
    // Check team limit
    if (teams.length >= MAX_TEAMS_PER_USER) {
      toast.error(`You can only create up to ${MAX_TEAMS_PER_USER} teams`);
      return;
    }
    setOpen(false);
    setShowCreateDialog(true);
  };

  const canCreateMoreTeams = teams.length < MAX_TEAMS_PER_USER;

  // 3D button style - always use collapsed/icon style
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-secondary/50 hover:bg-secondary/70 border border-border/50 shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <Home className="h-4 w-4 text-foreground/80" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl" align="end">
          <WorkspaceList
            teams={teams}
            currentWorkspace={currentWorkspace}
            isPersonalWorkspace={isPersonalWorkspace}
            onSelect={handleSelect}
            onCreateTeam={handleCreateTeam}
            canCreateMoreTeams={canCreateMoreTeams}
            maxTeams={MAX_TEAMS_PER_USER}
          />
        </PopoverContent>
      </Popover>

      <CreateTeamDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}

interface WorkspaceListProps {
  teams: { team_id: string; team_name: string; user_role: string }[];
  currentWorkspace: { teamId: string | null };
  isPersonalWorkspace: boolean;
  onSelect: (value: string) => void;
  onCreateTeam: () => void;
  canCreateMoreTeams: boolean;
  maxTeams: number;
}

function WorkspaceList({
  teams,
  currentWorkspace,
  isPersonalWorkspace,
  onSelect,
  onCreateTeam,
  canCreateMoreTeams,
  maxTeams,
}: WorkspaceListProps) {
  return (
    <Command className="bg-transparent">
      <CommandInput placeholder="Search workspace..." className="border-b border-border/30" />
      <CommandList className="max-h-80">
        <CommandEmpty>No workspace found.</CommandEmpty>
        
        <CommandGroup heading="Personal">
          <CommandItem
            value="personal"
            onSelect={() => onSelect('personal')}
            className={cn(
              "cursor-pointer mx-2 my-1 rounded-lg transition-all",
              isPersonalWorkspace && "bg-primary/10 border border-primary/20"
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] border border-border/30">
                <User className="h-4 w-4 text-foreground/80" />
              </div>
              <span className="flex-1 font-medium">Personal</span>
              {isPersonalWorkspace && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </CommandItem>
        </CommandGroup>

        {teams.length > 0 && (
          <CommandGroup heading={`Teams (${teams.length}/${maxTeams})`}>
            {teams.map((team) => (
              <CommandItem
                key={team.team_id}
                value={team.team_id}
                onSelect={() => onSelect(team.team_id)}
                className={cn(
                  "cursor-pointer mx-2 my-1 rounded-lg transition-all",
                  currentWorkspace.teamId === team.team_id && "bg-primary/10 border border-primary/20"
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] border border-border/30">
                    <span className="text-sm font-semibold text-foreground/80">
                      {team.team_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{team.team_name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{team.user_role}</span>
                  </div>
                  {currentWorkspace.teamId === team.team_id && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator className="my-1" />
        
        <CommandGroup>
          <CommandItem
            onSelect={onCreateTeam}
            className={cn(
              "cursor-pointer mx-2 my-1 rounded-lg",
              !canCreateMoreTeams && "opacity-50"
            )}
            disabled={!canCreateMoreTeams}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-border/30 border-dashed">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <span className="font-medium">Create team</span>
                {!canCreateMoreTeams && (
                  <span className="text-[10px] text-muted-foreground block">Limit reached</span>
                )}
              </div>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
