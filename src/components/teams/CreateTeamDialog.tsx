import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTeam } from '@/hooks/useTeamsData';
import { useTeamContext } from '@/contexts/TeamContext';

const createTeamSchema = z.object({
  name: z.string()
    .min(2, 'Team name must be at least 2 characters')
    .max(50, 'Team name must be less than 50 characters')
    .trim(),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(30, 'Slug must be less than 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .trim(),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTeamDialog({ open, onOpenChange }: CreateTeamDialogProps) {
  const createTeam = useCreateTeam();
  const { switchToTeam } = useTeamContext();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  });

  const name = watch('name');

  // Auto-generate slug from name
  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    register('name').onChange(e);
    setValue('slug', generateSlug(newName));
  };

  const onSubmit = async (data: CreateTeamFormData) => {
    try {
      const teamId = await createTeam.mutateAsync({ name: data.name, slug: data.slug });
      reset();
      onOpenChange(false);
      // Switch to the new team
      if (teamId) {
        setTimeout(() => switchToTeam(teamId), 500);
      }
    } catch {
      // Error handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create a Team</DialogTitle>
            <DialogDescription>
              Create a team to collaborate with others. Team limits are based on your subscription plan.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                placeholder="My Awesome Team"
                {...register('name')}
                onChange={handleNameChange}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Team URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/team/</span>
                <Input
                  id="slug"
                  placeholder="my-awesome-team"
                  {...register('slug')}
                  className="flex-1"
                />
              </div>
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTeam.isPending}>
              {createTeam.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
