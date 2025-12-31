import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Users, User } from 'lucide-react';
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

  if (collapsed) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-secondary/30"
          >
            {isPersonalWorkspace ? (
              <User className="h-4 w-4" />
            ) : (
              <Users className="h-4 w-4" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" side="right" align="start">
          <WorkspaceList
            teams={teams}
            currentWorkspace={currentWorkspace}
            isPersonalWorkspace={isPersonalWorkspace}
            onSelect={handleSelect}
            onCreateTeam={() => {
              setOpen(false);
              setShowCreateDialog(true);
            }}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between rounded-xl bg-secondary/30 hover:bg-secondary/50 px-3 py-2.5 h-auto"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-foreground/10 text-foreground text-xs">
                  {isPersonalWorkspace ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    currentWorkspace.teamName?.charAt(0).toUpperCase() || 'T'
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {currentLabel}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {isPersonalWorkspace ? 'Personal workspace' : currentWorkspace.teamRole}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <WorkspaceList
            teams={teams}
            currentWorkspace={currentWorkspace}
            isPersonalWorkspace={isPersonalWorkspace}
            onSelect={handleSelect}
            onCreateTeam={() => {
              setOpen(false);
              setShowCreateDialog(true);
            }}
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
}

function WorkspaceList({
  teams,
  currentWorkspace,
  isPersonalWorkspace,
  onSelect,
  onCreateTeam,
}: WorkspaceListProps) {
  return (
    <Command>
      <CommandInput placeholder="Search workspace..." />
      <CommandList>
        <CommandEmpty>No workspace found.</CommandEmpty>
        
        <CommandGroup heading="Personal">
          <CommandItem
            value="personal"
            onSelect={() => onSelect('personal')}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Personal</span>
            {isPersonalWorkspace && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </CommandItem>
        </CommandGroup>

        {teams.length > 0 && (
          <CommandGroup heading="Teams">
            {teams.map((team) => (
              <CommandItem
                key={team.team_id}
                value={team.team_id}
                onSelect={() => onSelect(team.team_id)}
                className="cursor-pointer"
              >
                <Avatar className="mr-2 h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-foreground/10">
                    {team.team_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{team.team_name}</span>
                <span className="text-[10px] text-muted-foreground capitalize mr-2">
                  {team.user_role}
                </span>
                {currentWorkspace.teamId === team.team_id && (
                  <Check className="h-4 w-4" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />
        
        <CommandGroup>
          <CommandItem
            onSelect={onCreateTeam}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Create team</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
