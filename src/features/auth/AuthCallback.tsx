import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error.message);
        return;
      }

      if (session) {
        // Check if there is a pending invite token from a previous join attempt
        const pendingToken = localStorage.getItem('pending_invite_token');
        if (pendingToken) {
          localStorage.removeItem('pending_invite_token');
          navigate(`/join/${pendingToken}`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center max-w-sm space-y-4">
          <p className="text-sm text-rose-400">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-brand-400 hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      <p className="text-sm text-slate-400">Completing sign in...</p>
    </div>
  );
}
