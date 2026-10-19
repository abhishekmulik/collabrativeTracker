import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawAnonKey &&
  !rawUrl.includes('mock-habitspace') &&
  !rawUrl.includes('your-project') &&
  rawAnonKey !== 'your-anon-key' &&
  rawAnonKey !== 'mock-anon-key'
);

const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://mock-habitspace.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawAnonKey : 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
