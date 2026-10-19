import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Target, Mail, CheckCircle2, Shield, Users2, Sparkles } from 'lucide-react';

export function SignInPage() {
  const { signInWithGoogle, signInWithMagicLink, isSupabaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const { error } = await signInWithGoogle();
      if (error) setErrorMessage(error.message);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to connect to Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const { error } = await signInWithMagicLink(email);
      if (error) {
        setErrorMessage(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Headline */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 mb-2">
            <Target className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            HabitSpace
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Competitive, shared habit tracking for small private groups who keep each other accountable.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40 space-y-6">
          {magicLinkSent ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-slate-100">Check your inbox</h2>
              <p className="text-xs text-slate-300">
                We sent a secure magic link to <strong className="text-brand-400">{email}</strong>. Click the link in your email to sign in.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMagicLinkSent(false)}
                className="mt-2 text-xs"
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <>
              {!isSupabaseConfigured && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Interactive Local Sandbox Active</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    No <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">.env</code> found. Click <strong>Continue with Google</strong> or enter any email below to sign in instantly with simulated local storage.
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  {errorMessage}
                </div>
              )}

              {/* Google Sign In */}
              <Button
                type="button"
                variant="secondary"
                size="lg"
                isLoading={isSubmitting}
                onClick={handleGoogleSignIn}
                className="w-full font-semibold relative flex items-center justify-center border-slate-700 bg-slate-800/80 hover:bg-slate-750"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.9.7 5.5 1.9 7.9l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.3 7.5 23.5 12 23.5z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider">
                  or
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              {/* Email Magic Link Form */}
              <form onSubmit={handleMagicLink} className="space-y-4">
                <Input
                  label="Work or Personal Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full font-semibold"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Magic Link
                </Button>
              </form>
            </>
          )}

          {/* Value Props & Security Reassurance */}
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
            <div className="flex flex-col items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-brand-400" />
              <span>Strict RLS Privacy</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Users2 className="w-3.5 h-3.5 text-brand-400" />
              <span>Private Spaces</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Daily Race</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
