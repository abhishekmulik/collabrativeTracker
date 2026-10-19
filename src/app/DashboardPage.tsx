import { useState } from 'react';
import { useSpace } from '@/features/spaces/SpaceContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreateSpaceModal } from '@/features/spaces/CreateSpaceModal';
import { MemberList } from '@/features/members/MemberList';
import { PendingInvitesPanel } from '@/features/invites/PendingInvitesPanel';
import { InviteModal } from '@/features/invites/InviteModal';
import { Plus, UserPlus, Sparkles } from 'lucide-react';

export function DashboardPage() {
  const { currentSpace, userSpaces, isAdmin, isLoading } = useSpace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-xs text-slate-400">Loading your Spaces...</p>
      </div>
    );
  }

  // Empty State: User has no spaces yet
  if (userSpaces.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-4 space-y-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center text-3xl">
          🎯
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-100">Welcome to HabitSpace</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Habit tracking works better with your crew. Create a private Space for your gym buddies, team, or friends to run timed challenges together.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-semibold text-slate-100">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>How Spaces work:</span>
          </div>
          <ul className="space-y-1.5 text-slate-400 pl-4 list-disc">
            <li>You track daily check-ins on your Today checklist.</li>
            <li>Admins launch 7, 21, or 30-day timed sprint challenges.</li>
            <li>Live leaderboards and race charts keep everyone locked in.</li>
          </ul>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsCreateOpen(true)}
          className="w-full font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Your First Space
        </Button>

        <CreateSpaceModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      </div>
    );
  }

  if (!currentSpace) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Space Hero Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{currentSpace.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">{currentSpace.name}</h1>
                <Badge variant="brand">{currentSpace.mode}</Badge>
              </div>
              {currentSpace.description && (
                <p className="text-xs text-slate-400 mt-1">{currentSpace.description}</p>
              )}
            </div>
          </div>

          {isAdmin && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsInviteOpen(true)}
              className="self-start sm:self-center font-semibold"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Invite Members
            </Button>
          )}
        </div>
      </div>

      {/* Members & Invites Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800">
          <MemberList spaceId={currentSpace.id} />
        </div>

        {isAdmin && (
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800">
            <PendingInvitesPanel spaceId={currentSpace.id} />
          </div>
        )}
      </div>

      {currentSpace && (
        <InviteModal
          spaceId={currentSpace.id}
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
        />
      )}
    </div>
  );
}
