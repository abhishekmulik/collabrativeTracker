import { useState, useEffect, useCallback } from 'react';
import { Invite, getInviteStatus } from './types';
import { inviteService } from './inviteService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Copy, RefreshCw, Ban, Check } from 'lucide-react';

interface PendingInvitesPanelProps {
  spaceId: string;
}

export function PendingInvitesPanel({ spaceId }: PendingInvitesPanelProps) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await inviteService.getSpaceInvites(spaceId);
      setInvites(data);
    } catch {
      // Non-blocking
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const handleCopy = (invite: Invite) => {
    const url = `${window.location.origin}/join/${invite.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      await inviteService.revokeInvite(inviteId);
      await loadInvites();
    } catch {
      alert('Failed to revoke invite');
    }
  };

  const handleRegenerate = async (oldInvite: Invite) => {
    try {
      await inviteService.regenerateInvite(oldInvite);
      await loadInvites();
    } catch {
      alert('Failed to regenerate invite');
    }
  };

  if (isLoading) {
    return <div className="p-4 text-xs text-slate-400">Loading invites...</div>;
  }

  if (invites.length === 0) {
    return (
      <div className="p-6 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <p className="text-xs text-slate-400">No invite links created for this Space yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-slate-300">Invite Links & Passes</div>
      <div className="space-y-2">
        {invites.map((invite) => {
          const status = getInviteStatus(invite);
          const isCopied = copiedId === invite.id;

          return (
            <div
              key={invite.id}
              className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                status === 'active'
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-slate-900/40 border-slate-800/50 opacity-70'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-slate-200">
                    ...{invite.token.slice(-8)}
                  </span>
                  {status === 'active' && <Badge variant="brand">Active</Badge>}
                  {status === 'expired' && <Badge variant="amber">Expired</Badge>}
                  {status === 'max_used' && <Badge variant="blue">Max Uses Reached</Badge>}
                  {status === 'revoked' && <Badge variant="rose">Revoked</Badge>}
                  <Badge variant="slate">{invite.role === 'admin' ? 'Admin' : 'Member'}</Badge>
                </div>

                <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5">
                  {invite.email && <span>To: {invite.email}</span>}
                  <span>
                    Used: {invite.use_count} {invite.max_uses ? `/ ${invite.max_uses}` : ''}
                  </span>
                  <span>
                    Expires:{' '}
                    {invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {status === 'active' ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopy(invite)}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-brand-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-xs">{isCopied ? 'Copied' : 'Copy'}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(invite.id)}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      title="Revoke invite link"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerate(invite)}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">Regenerate</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
