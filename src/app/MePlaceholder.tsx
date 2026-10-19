import { Calendar } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

export function MePlaceholder() {
  const { profile, user } = useAuth();

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold text-brand-400">
          {(profile?.full_name || user?.email || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-100">
            {profile?.full_name || 'Habit Tracker Member'}
          </h2>
          <p className="text-xs text-slate-400">{user?.email}</p>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-400">
          <Calendar className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">Me Dashboard (Phase 3)</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your personal habit rings, active streaks, and 12-week calendar heatmap will appear here in Phase 3 once habits and daily check-ins are enabled in Phase 2.
        </p>
      </div>
    </div>
  );
}
