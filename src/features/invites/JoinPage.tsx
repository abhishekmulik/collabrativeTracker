import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inviteService } from './inviteService';
import { Invite, getInviteStatus } from './types';
import { Space } from '../spaces/types';
import { useAuth } from '../auth/AuthContext';
import { useSpace } from '../spaces/SpaceContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Target, ShieldAlert, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, signInWithGoogle, signInWithMagicLink } = useAuth();
  const { refreshSpaces, setCurrentSpaceId } = useSpace();

  const [inviteData, setInviteData] = useState<{ invite: Invite; space: Space } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState<'active' | 'pending' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email magic link state for signed-out users
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMessage('Invalid invite link (missing token)');
      setIsLoading(false);
      return;
    }

    inviteService
      .getInviteDetails(token)
      .then((data) => {
        setInviteData(data);
        const status = getInviteStatus(data.invite);
        if (status === 'revoked') {
          setErrorMessage('This invite has been revoked by a Space admin.');
        } else if (status === 'expired') {
          setErrorMessage('This invite has expired.');
        } else if (status === 'max_used') {
          setErrorMessage('This invite has already reached its maximum usage limit.');
        }
      })
      .catch((err: unknown) => {
        setErrorMessage(err instanceof Error ? err.message : 'Invalid or expired invite token.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const handleJoin = async () => {
    if (!token) return;

    if (!user) {
      // Save pending invite token to auto-join upon auth return
      localStorage.setItem('pending_invite_token', token);
      navigate('/login');
      return;
    }

    try {
      setIsJoining(true);
      setErrorMessage(null);
      const result = await inviteService.joinSpaceByToken(token);
      await refreshSpaces();
      setCurrentSpaceId(result.space.id);

      if (result.membership.status === 'pending') {
        setJoinedSuccess('pending');
      } else {
        setJoinedSuccess('active');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to join Space');
    } finally {
      setIsJoining(false);
    }
  };

  const handleQuickGoogleSignIn = async () => {
    if (token) {
      localStorage.setItem('pending_invite_token', token);
    }
    await signInWithGoogle();
  };

  const handleQuickMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (token) {
      localStorage.setItem('pending_invite_token', token);
    }
    const { error } = await signInWithMagicLink(email);
    if (error) {
      setErrorMessage(error.message);
    } else {
      setMagicLinkSent(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
        <p className="text-sm text-slate-400">Verifying invite token...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* App Banner */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-400 mb-1 border border-brand-500/20">
            <Target className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">HabitSpace</h1>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 space-y-6">
          {joinedSuccess === 'active' ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-100">You're in!</h2>
                <p className="text-xs text-slate-300">
                  You have joined <strong className="text-brand-400">{inviteData?.space.name}</strong> as{' '}
                  {inviteData?.invite.role === 'admin' ? 'an Admin' : 'a Member'}.
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/')}
                className="w-full font-semibold"
              >
                Go to Space Dashboard
              </Button>
            </div>
          ) : joinedSuccess === 'pending' ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-100">Join Request Submitted</h2>
                <p className="text-xs text-slate-300">
                  <strong className="text-amber-400">{inviteData?.space.name}</strong> is a private space that requires admin approval. You will have full access as soon as an Admin approves your request.
                </p>
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Return to My Spaces
              </Button>
            </div>
          ) : (
            <>
              {errorMessage ? (
                <div className="space-y-4 text-center py-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-slate-100">Cannot Join Space</h2>
                    <p className="text-xs text-rose-300">{errorMessage}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="mx-auto"
                  >
                    Go to Homepage
                  </Button>
                </div>
              ) : (
                inviteData && (
                  <div className="space-y-5">
                    {/* Space Presentation */}
                    <div className="text-center space-y-2 pb-2 border-b border-slate-800/80">
                      <div className="text-4xl">{inviteData.space.icon}</div>
                      <h2 className="text-lg font-bold text-slate-100">{inviteData.space.name}</h2>
                      {inviteData.space.description && (
                        <p className="text-xs text-slate-400">{inviteData.space.description}</p>
                      )}
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <Badge variant="brand">Mode: {inviteData.space.mode}</Badge>
                        <Badge variant="slate">
                          Role: {inviteData.invite.role === 'admin' ? 'Admin' : 'Member'}
                        </Badge>
                      </div>
                    </div>

                    {/* Signed In vs Signed Out Actions */}
                    {user ? (
                      <div className="space-y-3">
                        <div className="text-xs text-slate-300 text-center">
                          Signed in as <strong className="text-slate-100">{user.email}</strong>
                        </div>
                        <Button
                          variant="primary"
                          size="lg"
                          isLoading={isJoining}
                          onClick={handleJoin}
                          className="w-full font-semibold"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {inviteData.space.join_policy === 'request'
                            ? 'Request to Join Space'
                            : 'Join Space Now'}
                        </Button>
                      </div>
                    ) : magicLinkSent ? (
                      <div className="text-center py-2 space-y-2">
                        <p className="text-xs text-brand-300 font-medium">Magic link sent to {email}!</p>
                        <p className="text-[11px] text-slate-400">
                          Click the link in your email; you'll be automatically added to {inviteData.space.name}.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400 text-center">
                          Sign in or create an account to accept your invite:
                        </p>

                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          onClick={handleQuickGoogleSignIn}
                          className="w-full font-medium"
                        >
                          Continue with Google
                        </Button>

                        <div className="relative flex items-center justify-center my-1">
                          <div className="border-t border-slate-800 w-full" />
                          <span className="bg-slate-900 px-2 text-[10px] text-slate-500 uppercase">or</span>
                          <div className="border-t border-slate-800 w-full" />
                        </div>

                        <form onSubmit={handleQuickMagicLink} className="space-y-2">
                          <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                          />
                          <Button type="submit" variant="primary" size="md" className="w-full text-xs font-semibold">
                            Continue with Email
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
