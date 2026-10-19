import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { inviteService } from './inviteService';
import { Invite } from './types';
import { Copy, Check, Link2 } from 'lucide-react';

interface InviteModalProps {
  spaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onInviteCreated?: (invite: Invite) => void;
}

export function InviteModal({ spaceId, isOpen, onClose, onInviteCreated }: InviteModalProps) {
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(7);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState<Invite | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      const invite = await inviteService.createInvite(spaceId, {
        role,
        max_uses: maxUses,
        expires_in_days: expiresInDays,
        email: email.trim() || undefined,
      });

      setGeneratedInvite(invite);
      onInviteCreated?.(invite);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create invite link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInviteUrl = (token: string) => `${window.location.origin}/join/${token}`;

  const handleCopy = () => {
    if (!generatedInvite) return;
    navigator.clipboard.writeText(getInviteUrl(generatedInvite.token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGeneratedInvite(null);
    setEmail('');
    setCopied(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Invite Members to Space"
      description="Create secure invite links or send direct invites with custom role and usage limits."
    >
      {generatedInvite ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-400">
              <Link2 className="w-4 h-4" />
              <span>Invite Link Ready</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={getInviteUrl(generatedInvite.token)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 select-all font-mono"
              />
              <Button
                type="button"
                variant={copied ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-brand-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="text-[11px] text-brand-200/90 space-y-1">
              <div>
                <strong>Role:</strong> {generatedInvite.role === 'admin' ? 'Admin' : 'Member'}
              </div>
              <div>
                <strong>Usage:</strong>{' '}
                {generatedInvite.max_uses ? `Max ${generatedInvite.max_uses} uses` : 'Unlimited uses'}
              </div>
              <div>
                <strong>Expires:</strong>{' '}
                {generatedInvite.expires_at
                  ? new Date(generatedInvite.expires_at).toLocaleDateString()
                  : 'Never'}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleReset}>
              Create Another
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                handleReset();
                onClose();
              }}
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Email (Optional) */}
          <Input
            label="Specific Email (Optional)"
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint="The link token is the credential; inviting by email documents intended recipient."
          />

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Role for Joiners</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-colors ${
                  role === 'member'
                    ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>Member</div>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">Tracks habits and joins races</div>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-colors ${
                  role === 'admin'
                    ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>Admin</div>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">Can invite & start challenges</div>
              </button>
            </div>
          </div>

          {/* Max Uses */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Usage Limit</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Single use', val: 1 },
                { label: '5 uses', val: 5 },
                { label: '10 uses', val: 10 },
                { label: 'Unlimited', val: null },
              ].map(({ label, val }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setMaxUses(val)}
                  className={`py-2 px-1 rounded-xl border text-center text-xs font-medium transition-colors ${
                    maxUses === val
                      ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Expiration */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Link Expiration</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '1 Day', val: 1 },
                { label: '7 Days', val: 7 },
                { label: '30 Days', val: 30 },
                { label: 'Never', val: null },
              ].map(({ label, val }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setExpiresInDays(val)}
                  className={`py-2 px-1 rounded-xl border text-center text-xs font-medium transition-colors ${
                    expiresInDays === val
                      ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Generate Invite Link
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
