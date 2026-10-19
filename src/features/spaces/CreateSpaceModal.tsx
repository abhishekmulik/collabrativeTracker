import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSpace } from './SpaceContext';
import { SpaceMode, JoinPolicy } from './types';
import { Trophy, HeartHandshake, Flame, Lock, Globe } from 'lucide-react';

const EMOJI_OPTIONS = ['🎯', '🔥', '💪', '🏃', '📚', '🧘', '⚡', '🏆', '🚀', '🌱'];

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSpaceModal({ isOpen, onClose }: CreateSpaceModalProps) {
  const { createSpace } = useSpace();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<SpaceMode>('competitive');
  const [joinPolicy, setJoinPolicy] = useState<JoinPolicy>('open');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Space name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createSpace({
        name: name.trim(),
        icon,
        description: description.trim() || undefined,
        mode,
        join_policy: joinPolicy,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
      // Reset & close
      setName('');
      setDescription('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create Space');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create a New Space"
      description="Spaces are private hubs for your crew to track habits and compete together."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Icon & Name Row */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">Space Icon & Name</label>
          <div className="flex gap-2">
            <div className="relative">
              <button
                type="button"
                className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg hover:bg-slate-700/80 transition-colors"
                aria-label="Selected emoji icon"
              >
                {icon}
              </button>
            </div>
            <div className="flex-1">
              <Input
                placeholder="e.g. 6AM Club, Iron Crew, Family Habits"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
              />
            </div>
          </div>

          {/* Quick Emoji Pickers */}
          <div className="flex gap-1.5 pt-1 overflow-x-auto pb-1 scrollbar-none">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                  icon === emoji
                    ? 'bg-brand-500/20 border border-brand-500/40 text-brand-400 scale-105'
                    : 'bg-slate-800/60 border border-slate-700/40 hover:bg-slate-800 text-slate-300'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Description (Optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short note on what this group is tracking..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
            maxLength={200}
          />
        </div>

        {/* Space Mode Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">Space Mode</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode('competitive')}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === 'competitive'
                  ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Trophy className="w-4 h-4 mb-1 text-current" />
              <div className="text-xs font-semibold text-slate-200">Competitive</div>
              <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Live ranks & race</div>
            </button>

            <button
              type="button"
              onClick={() => setMode('supportive')}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === 'supportive'
                  ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <HeartHandshake className="w-4 h-4 mb-1 text-current" />
              <div className="text-xs font-semibold text-slate-200">Supportive</div>
              <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Shared goals & cheers</div>
            </button>

            <button
              type="button"
              onClick={() => setMode('mixed')}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === 'mixed'
                  ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Flame className="w-4 h-4 mb-1 text-current" />
              <div className="text-xs font-semibold text-slate-200">Mixed</div>
              <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Balanced race & cheer</div>
            </button>
          </div>
        </div>

        {/* Join Policy Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">Join Approval Policy</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setJoinPolicy('open')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                joinPolicy === 'open'
                  ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Globe className="w-4 h-4 mt-0.5 text-current shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-200">Open with link</div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Anyone with link joins instantly</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setJoinPolicy('request')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                joinPolicy === 'request'
                  ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Lock className="w-4 h-4 mt-0.5 text-current shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-200">Request to join</div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Admins approve join requests</div>
              </div>
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Create Space
          </Button>
        </div>
      </form>
    </Modal>
  );
}
