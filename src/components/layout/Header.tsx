import { useState } from 'react';
import { SpaceSwitcher } from '@/features/spaces/SpaceSwitcher';
import { useAuth } from '@/features/auth/AuthContext';
import { useSpace } from '@/features/spaces/SpaceContext';
import { Button } from '@/components/ui/Button';
import { UserPlus, LogOut } from 'lucide-react';
import { InviteModal } from '@/features/invites/InviteModal';

export function Header() {
  const { user, signOut } = useAuth();
  const { currentSpace, isAdmin } = useSpace();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Space Switcher */}
        <div className="flex items-center gap-2">
          <SpaceSwitcher />
        </div>

        {/* Right: Invite & User Controls */}
        <div className="flex items-center gap-2">
          {currentSpace && isAdmin && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsInviteOpen(true)}
              className="text-xs font-semibold"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invite</span>
            </Button>
          )}

          {user && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={signOut}
              title={`Sign out (${user.email})`}
              className="text-slate-400 hover:text-slate-200"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {currentSpace && (
        <InviteModal
          spaceId={currentSpace.id}
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
        />
      )}
    </header>
  );
}
