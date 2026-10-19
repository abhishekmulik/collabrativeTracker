import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile } from '@/features/spaces/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Load mock session if stored
      const stored = localStorage.getItem('habitspace_mock_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed.user);
          setProfile(parsed.profile);
        } catch {
          localStorage.removeItem('habitspace_mock_session');
        }
      }
      setIsLoading(false);
      return;
    }

    // 1. Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // 2. Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      // Instant local simulated sign-in
      const mockUser = {
        id: 'demo-user-1',
        email: 'alex.rivera@example.com',
        user_metadata: { full_name: 'Alex Rivera', name: 'Alex Rivera' },
      } as unknown as User;

      const mockProfile: UserProfile = {
        id: 'demo-user-1',
        email: 'alex.rivera@example.com',
        full_name: 'Alex Rivera',
        avatar_url: null,
        created_at: new Date().toISOString(),
      };

      localStorage.setItem('habitspace_mock_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
      setUser(mockUser);
      setProfile(mockProfile);

      const pendingToken = localStorage.getItem('pending_invite_token');
      if (pendingToken) {
        localStorage.removeItem('pending_invite_token');
        window.location.href = `/join/${pendingToken}`;
      } else {
        window.location.href = '/';
      }
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signInWithMagicLink = async (email: string) => {
    if (!isSupabaseConfigured) {
      const id = `user-${Math.abs(email.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0))}`;
      const name = email.split('@')[0];
      const mockUser = {
        id,
        email,
        user_metadata: { full_name: name, name },
      } as unknown as User;

      const mockProfile: UserProfile = {
        id,
        email,
        full_name: name,
        avatar_url: null,
        created_at: new Date().toISOString(),
      };

      localStorage.setItem('habitspace_mock_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
      setUser(mockUser);
      setProfile(mockProfile);

      const pendingToken = localStorage.getItem('pending_invite_token');
      if (pendingToken) {
        localStorage.removeItem('pending_invite_token');
        window.location.href = `/join/${pendingToken}`;
      } else {
        window.location.href = '/';
      }
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    localStorage.removeItem('habitspace_mock_session');
    setUser(null);
    setProfile(null);
    setSession(null);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isSupabaseConfigured,
        signInWithGoogle,
        signInWithMagicLink,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
