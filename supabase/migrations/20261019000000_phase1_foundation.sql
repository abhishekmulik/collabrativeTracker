-- Phase 1: Foundation Schema & RLS Policies
-- Collaborative Habit Tracker

-- 1. Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Users table (synced from auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to sync newly registered auth.users into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Spaces table
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎯',
  description TEXT,
  mode TEXT NOT NULL DEFAULT 'competitive' CHECK (mode IN ('competitive', 'supportive', 'mixed')),
  join_policy TEXT NOT NULL DEFAULT 'open' CHECK (join_policy IN ('open', 'request')),
  settings JSONB NOT NULL DEFAULT '{"timezone": "UTC"}'::jsonb,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Memberships table
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending')),
  nickname TEXT,
  show_on_leaderboard BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_space_user UNIQUE (space_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_space ON public.memberships(space_id);

-- 5. Invites table
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  use_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_space ON public.invites(space_id);

-- 6. Helper RPC: Create Space with Owner
CREATE OR REPLACE FUNCTION public.create_space_with_owner(
  p_name TEXT,
  p_icon TEXT DEFAULT '🎯',
  p_description TEXT DEFAULT NULL,
  p_mode TEXT DEFAULT 'competitive',
  p_join_policy TEXT DEFAULT 'open',
  p_timezone TEXT DEFAULT 'UTC'
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_space_id UUID;
  v_space_record RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.spaces (name, icon, description, mode, join_policy, settings, created_by)
  VALUES (p_name, p_icon, p_description, p_mode, p_join_policy, jsonb_build_object('timezone', p_timezone), v_user_id)
  RETURNING * INTO v_space_record;

  v_space_id := v_space_record.id;

  INSERT INTO public.memberships (space_id, user_id, role, status)
  VALUES (v_space_id, v_user_id, 'owner', 'active');

  RETURN to_jsonb(v_space_record);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Helper RPC: Join Space by Token
CREATE OR REPLACE FUNCTION public.join_space_by_token(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_invite RECORD;
  v_space RECORD;
  v_membership RECORD;
  v_status TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invite FROM public.invites WHERE token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF v_invite.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'This invite has been revoked';
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < NOW() THEN
    RAISE EXCEPTION 'This invite has expired';
  END IF;

  IF v_invite.max_uses IS NOT NULL AND v_invite.use_count >= v_invite.max_uses THEN
    RAISE EXCEPTION 'This invite has already reached its maximum uses';
  END IF;

  SELECT * INTO v_space FROM public.spaces WHERE id = v_invite.space_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Space not found';
  END IF;

  -- Determine initial status based on Space join policy
  IF v_space.join_policy = 'request' THEN
    v_status := 'pending';
  ELSE
    v_status := 'active';
  END IF;

  -- Atomic increment of invite use count
  UPDATE public.invites
  SET use_count = use_count + 1
  WHERE id = v_invite.id;

  -- Upsert membership
  INSERT INTO public.memberships (space_id, user_id, role, status)
  VALUES (v_invite.space_id, v_user_id, v_invite.role, v_status)
  ON CONFLICT (space_id, user_id) DO UPDATE
  SET status = CASE
    WHEN public.memberships.status = 'pending' AND v_status = 'active' THEN 'active'
    ELSE public.memberships.status
  END
  RETURNING * INTO v_membership;

  RETURN jsonb_build_object(
    'space', to_jsonb(v_space),
    'membership', to_jsonb(v_membership)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Enable Row-Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- 9. Helper Security Definer Functions (prevents RLS recursion 42P17)
CREATE OR REPLACE FUNCTION public.user_has_space_access(p_space_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships
    WHERE space_id = p_space_id
      AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_space_member(p_space_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships
    WHERE space_id = p_space_id
      AND user_id = p_user_id
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_space_admin(p_space_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships
    WHERE space_id = p_space_id
      AND user_id = p_user_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_space_owner(p_space_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships
    WHERE space_id = p_space_id
      AND user_id = p_user_id
      AND role = 'owner'
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.are_active_co_members(p_user_a UUID, p_user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships m1
    JOIN public.memberships m2 ON m1.space_id = m2.space_id
    WHERE m1.user_id = p_user_a
      AND m2.user_id = p_user_b
      AND m1.status = 'active'
      AND m2.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 10. RLS Policies

-- USERS
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can read profiles of co-members"
  ON public.users FOR SELECT
  USING (
    auth.uid() = id OR public.are_active_co_members(auth.uid(), id)
  );

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- SPACES
CREATE POLICY "Members can view their Spaces"
  ON public.spaces FOR SELECT
  USING (
    public.user_has_space_access(id, auth.uid())
  );

CREATE POLICY "Admins and Owners can update their Space"
  ON public.spaces FOR UPDATE
  USING (
    public.is_space_admin(id, auth.uid())
  );

CREATE POLICY "Owners can delete their Space"
  ON public.spaces FOR DELETE
  USING (
    public.is_space_owner(id, auth.uid())
  );

-- MEMBERSHIPS
CREATE POLICY "Members can view Space memberships"
  ON public.memberships FOR SELECT
  USING (
    user_id = auth.uid() OR public.is_space_member(space_id, auth.uid())
  );

CREATE POLICY "Users can update own nickname and leaderboard visibility"
  ON public.memberships FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins and Owners can manage member roles and approval"
  ON public.memberships FOR UPDATE
  USING (
    public.is_space_admin(space_id, auth.uid())
  );

CREATE POLICY "Members can leave or Admins can remove members"
  ON public.memberships FOR DELETE
  USING (
    (user_id = auth.uid() AND role != 'owner')
    OR
    (public.memberships.role != 'owner' AND public.is_space_admin(space_id, auth.uid()))
  );

-- INVITES
CREATE POLICY "Admins and Owners can view and manage invites"
  ON public.invites FOR ALL
  USING (
    public.is_space_admin(space_id, auth.uid())
  );
