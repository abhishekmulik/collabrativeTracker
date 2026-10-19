-- Fix infinite recursion in memberships RLS policies (code 42P17)
-- and repair missing profile / membership records

-- 1. Ensure existing auth.users are synced into public.users
INSERT INTO public.users (id, email, full_name, avatar_url)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);

-- 2. Helper security definer functions that query memberships without invoking RLS recursion
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

-- 3. Update create_space_with_owner to be fully resilient
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

  -- Ensure profile exists in public.users
  INSERT INTO public.users (id, email, full_name, avatar_url)
  SELECT 
    u.id, 
    u.email, 
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
    u.raw_user_meta_data->>'avatar_url'
  FROM auth.users u
  WHERE u.id = v_user_id
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.spaces (name, icon, description, mode, join_policy, settings, created_by)
  VALUES (p_name, p_icon, p_description, p_mode, p_join_policy, jsonb_build_object('timezone', p_timezone), v_user_id)
  RETURNING * INTO v_space_record;

  v_space_id := v_space_record.id;

  INSERT INTO public.memberships (space_id, user_id, role, status)
  VALUES (v_space_id, v_user_id, 'owner', 'active')
  ON CONFLICT (space_id, user_id) DO NOTHING;

  RETURN to_jsonb(v_space_record);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Backfill missing memberships for existing spaces
INSERT INTO public.memberships (space_id, user_id, role, status)
SELECT s.id, s.created_by, 'owner', 'active'
FROM public.spaces s
WHERE s.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.space_id = s.id AND m.user_id = s.created_by
  )
ON CONFLICT (space_id, user_id) DO NOTHING;

-- 5. Drop existing recursive policies
DROP POLICY IF EXISTS "Members can view their Spaces" ON public.spaces;
DROP POLICY IF EXISTS "Admins and Owners can update their Space" ON public.spaces;
DROP POLICY IF EXISTS "Owners can delete their Space" ON public.spaces;

DROP POLICY IF EXISTS "Members can view Space memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can update own nickname and leaderboard visibility" ON public.memberships;
DROP POLICY IF EXISTS "Admins and Owners can manage member roles and approval" ON public.memberships;
DROP POLICY IF EXISTS "Members can leave or Admins can remove members" ON public.memberships;

DROP POLICY IF EXISTS "Admins and Owners can view and manage invites" ON public.invites;
DROP POLICY IF EXISTS "Users can read profiles of co-members" ON public.users;

-- 6. Re-create clean, non-recursive policies

-- USERS
CREATE POLICY "Users can read profiles of co-members"
  ON public.users FOR SELECT
  USING (
    auth.uid() = id OR public.are_active_co_members(auth.uid(), id)
  );

-- SPACES (allows creator directly or co-members)
CREATE POLICY "Members can view their Spaces"
  ON public.spaces FOR SELECT
  USING (
    created_by = auth.uid() OR public.user_has_space_access(id, auth.uid())
  );

CREATE POLICY "Admins and Owners can update their Space"
  ON public.spaces FOR UPDATE
  USING (
    created_by = auth.uid() OR public.is_space_admin(id, auth.uid())
  );

CREATE POLICY "Owners can delete their Space"
  ON public.spaces FOR DELETE
  USING (
    created_by = auth.uid() OR public.is_space_owner(id, auth.uid())
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
