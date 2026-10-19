import { useState, useEffect, useCallback } from 'react';
import { Membership } from '../spaces/types';
import { spaceService } from '../spaces/spaceService';
import { memberService } from './memberService';
import { useAuth } from '../auth/AuthContext';
import { useSpace } from '../spaces/SpaceContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, UserMinus, Check, X, LogOut } from 'lucide-react';

interface MemberListProps {
  spaceId: string;
}

export function MemberList({ spaceId }: MemberListProps) {
  const { user } = useAuth();
  const { isOwner, isAdmin, currentMembership, refreshSpaces } = useSpace();
  const [members, setMembers] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await spaceService.getSpaceMembers(spaceId);
      setMembers(data);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleApprove = async (membershipId: string) => {
    try {
      await memberService.updateMemberStatus(membershipId, 'active');
      await loadMembers();
    } catch {
      alert('Failed to approve member');
    }
  };

  const handleDeclineOrRemove = async (membershipId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await memberService.removeMember(membershipId);
      await loadMembers();
    } catch {
      alert('Failed to remove member');
    }
  };

  const handleToggleAdmin = async (membership: Membership) => {
    const newRole = membership.role === 'admin' ? 'member' : 'admin';
    try {
      await memberService.updateMemberRole(membership.id, newRole);
      await loadMembers();
    } catch {
      alert('Failed to update role');
    }
  };

  const handleLeaveSpace = async () => {
    if (!currentMembership) return;
    if (currentMembership.role === 'owner') {
      alert('Owners cannot leave a Space without transferring ownership first.');
      return;
    }

    if (!confirm('Are you sure you want to leave this Space?')) return;

    try {
      await memberService.removeMember(currentMembership.id);
      await refreshSpaces();
    } catch {
      alert('Failed to leave Space');
    }
  };

  if (isLoading) {
    return <div className="p-4 text-xs text-slate-400">Loading members...</div>;
  }

  const activeMembers = members.filter((m) => m.status === 'active');
  const pendingMembers = members.filter((m) => m.status === 'pending');

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          {actionError}
        </div>
      )}

      {/* Pending Join Requests (Admins only) */}
      {isAdmin && pendingMembers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <span>Pending Requests to Join</span>
              <Badge variant="amber" size="sm">{pendingMembers.length}</Badge>
            </h3>
          </div>

          <div className="space-y-2">
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-semibold text-amber-100">
                    {member.nickname || member.user?.full_name || member.user?.email || 'New User'}
                  </div>
                  <div className="text-[11px] text-amber-200/80">{member.user?.email}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(member.id)}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeclineOrRemove(member.id)}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Members Roster */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300">
            Active Members ({activeMembers.length})
          </h3>
          {currentMembership?.role !== 'owner' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLeaveSpace}
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" /> Leave Space
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {activeMembers.map((member) => {
            const isSelf = member.user_id === user?.id;
            const canManage = isAdmin && member.role !== 'owner' && !isSelf;

            return (
              <div
                key={member.id}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
                    {(member.nickname || member.user?.full_name || member.user?.email || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <span>{member.nickname || member.user?.full_name || member.user?.email}</span>
                      {isSelf && <span className="text-[10px] text-brand-400 font-normal">(You)</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      {member.role === 'owner' ? (
                        <Badge variant="amber" size="sm">Owner</Badge>
                      ) : member.role === 'admin' ? (
                        <Badge variant="blue" size="sm">Admin</Badge>
                      ) : (
                        <Badge variant="slate" size="sm">Member</Badge>
                      )}
                      <span>{member.user?.email}</span>
                    </div>
                  </div>
                </div>

                {/* Admin Management Actions */}
                {canManage && (
                  <div className="flex items-center gap-1.5">
                    {isOwner && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAdmin(member)}
                        className="text-[11px] text-slate-400 hover:text-slate-200"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        {member.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeclineOrRemove(member.id)}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      title="Remove member"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
