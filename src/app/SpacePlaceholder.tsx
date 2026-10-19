import { Trophy } from 'lucide-react';
import { useSpace } from '@/features/spaces/SpaceContext';

export function SpacePlaceholder() {
  const { currentSpace } = useSpace();

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
        <span className="text-4xl">{currentSpace?.icon || '🎯'}</span>
        <div>
          <h2 className="text-base font-bold text-slate-100">{currentSpace?.name || 'Space'}</h2>
          <p className="text-xs text-brand-400 capitalize">{currentSpace?.mode} Mode</p>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-400">
          <Trophy className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">Space Race Leaderboard (Phase 4)</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The live group leaderboard by completion percentage, animated line-chart race, and live activity feed will appear here in Phase 4 once challenges are launched.
        </p>
      </div>
    </div>
  );
}
