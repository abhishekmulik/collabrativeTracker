import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Invite, CreateInviteInput } from './types';
import { Space, Membership } from '../spaces/types';

const INVITES_KEY = 'habitspace_mock_invites';
const SPACES_KEY = 'habitspace_mock_spaces';
const MEMBERSHIPS_KEY = 'habitspace_mock_memberships';

function getLocalInvites(): Invite[] {
  try {
    return JSON.parse(localStorage.getItem(INVITES_KEY) || '[]');
  } catch {
    return [];
  }
}

function getLocalSpaces(): Space[] {
  try {
    return JSON.parse(localStorage.getItem(SPACES_KEY) || '[]');
  } catch {
    return [];
  }
}

function getLocalMemberships(): Membership[] {
  try {
    return JSON.parse(localStorage.getItem(MEMBERSHIPS_KEY) || '[]');
  } catch {
    return [];
  }
}

export const inviteService = {
  // Generate a URL-safe random token
  generateToken(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  },

  async createInvite(spaceId: string, input: CreateInviteInput): Promise<Invite> {
    const token = this.generateToken();
    let expiresAt: string | null = null;

    if (input.expires_in_days) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + input.expires_in_days);
      expiresAt = expDate.toISOString();
    }

    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('habitspace_mock_session');
      const user = stored ? JSON.parse(stored).user : { id: 'demo-user-1' };

      const newInvite: Invite = {
        id: `inv-${Date.now()}`,
        space_id: spaceId,
        token,
        email: input.email || null,
        role: input.role || 'member',
        max_uses: input.max_uses || null,
        use_count: 0,
        expires_at: expiresAt,
        revoked_at: null,
        created_by: user.id,
        created_at: new Date().toISOString(),
      };

      const invites = getLocalInvites();
      invites.push(newInvite);
      localStorage.setItem(INVITES_KEY, JSON.stringify(invites));

      return newInvite;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('invites')
      .insert({
        space_id: spaceId,
        token,
        email: input.email || null,
        role: input.role || 'member',
        max_uses: input.max_uses || null,
        expires_at: expiresAt,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Invite;
  },

  async getSpaceInvites(spaceId: string): Promise<Invite[]> {
    if (!isSupabaseConfigured) {
      return getLocalInvites()
        .filter((i) => i.space_id === spaceId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Invite[];
  },

  async revokeInvite(inviteId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const invites = getLocalInvites();
      const index = invites.findIndex((i) => i.id === inviteId);
      if (index !== -1) {
        invites[index].revoked_at = new Date().toISOString();
        localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
      }
      return;
    }

    const { error } = await supabase
      .from('invites')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', inviteId);

    if (error) throw error;
  },

  async regenerateInvite(oldInvite: Invite): Promise<Invite> {
    await this.revokeInvite(oldInvite.id);

    let newExpiresAt: string | null = null;
    if (oldInvite.expires_at) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 7);
      newExpiresAt = expDate.toISOString();
    }

    if (!isSupabaseConfigured) {
      return this.createInvite(oldInvite.space_id, {
        role: oldInvite.role,
        max_uses: oldInvite.max_uses,
        expires_in_days: 7,
        email: oldInvite.email || undefined,
      });
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('invites')
      .insert({
        space_id: oldInvite.space_id,
        token: this.generateToken(),
        email: oldInvite.email,
        role: oldInvite.role,
        max_uses: oldInvite.max_uses,
        expires_at: newExpiresAt,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Invite;
  },

  async getInviteDetails(token: string): Promise<{ invite: Invite; space: Space }> {
    if (!isSupabaseConfigured) {
      const invites = getLocalInvites();
      const invite = invites.find((i) => i.token === token);
      if (!invite) throw new Error('Invite not found or invalid token');

      const spaces = getLocalSpaces();
      const space = spaces.find((s) => s.id === invite.space_id);
      if (!space) throw new Error('Space not found');

      return { invite, space };
    }

    const { data: inviteData, error: inviteError } = await supabase
      .from('invites')
      .select('*, space:spaces(*)')
      .eq('token', token)
      .single();

    if (inviteError || !inviteData) {
      throw new Error('Invite not found or invalid token');
    }

    return {
      invite: inviteData as Invite,
      space: (inviteData as any).space as Space,
    };
  },

  async joinSpaceByToken(token: string): Promise<{ space: Space; membership: Membership }> {
    if (!isSupabaseConfigured) {
      const { invite, space } = await this.getInviteDetails(token);

      if (invite.revoked_at) {
        throw new Error('This invite has been revoked');
      }
      if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
        throw new Error('This invite has expired');
      }
      if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
        throw new Error('This invite has already reached its maximum uses');
      }

      // Increment use count
      const invites = getLocalInvites();
      const invIndex = invites.findIndex((i) => i.id === invite.id);
      if (invIndex !== -1) {
        invites[invIndex].use_count += 1;
        localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
      }

      const stored = localStorage.getItem('habitspace_mock_session');
      const user = stored ? JSON.parse(stored).user : { id: 'demo-user-1' };

      const status = space.join_policy === 'request' ? 'pending' : 'active';

      const memberships = getLocalMemberships();
      const existing = memberships.find((m) => m.space_id === space.id && m.user_id === user.id);

      let membership: Membership;
      if (existing) {
        membership = existing;
      } else {
        membership = {
          id: `mem-${Date.now()}`,
          space_id: space.id,
          user_id: user.id,
          role: invite.role,
          status,
          nickname: null,
          show_on_leaderboard: true,
          created_at: new Date().toISOString(),
        };
        memberships.push(membership);
        localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(memberships));
      }

      return { space, membership };
    }

    const { data, error } = await supabase.rpc('join_space_by_token', {
      p_token: token,
    });

    if (error) throw error;
    return data as { space: Space; membership: Membership };
  },
};
