import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Space, Membership, CreateSpaceInput } from './types';

const SPACES_KEY = 'habitspace_mock_spaces';
const MEMBERSHIPS_KEY = 'habitspace_mock_memberships';

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

export const spaceService = {
  async getUserSpaces(): Promise<Array<{ space: Space; membership: Membership }>> {
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('habitspace_mock_session');
      if (!stored) return [];
      const user = JSON.parse(stored).user;

      const spaces = getLocalSpaces();
      const memberships = getLocalMemberships().filter((m) => m.user_id === user.id);

      return memberships
        .map((m) => {
          const space = spaces.find((s) => s.id === m.space_id);
          return space ? { space, membership: m } : null;
        })
        .filter((item): item is { space: Space; membership: Membership } => item !== null);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('memberships')
      .select('*, space:spaces(*)')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching memberships:', error);
      throw error;
    }
    if (!data) return [];

    return data
      .map((row: any) => {
        const rawSpace = row.space || row.spaces;
        const spaceObj = Array.isArray(rawSpace) ? rawSpace[0] : rawSpace;
        return {
          membership: {
            id: row.id,
            space_id: row.space_id,
            user_id: row.user_id,
            role: row.role,
            status: row.status,
            nickname: row.nickname,
            show_on_leaderboard: row.show_on_leaderboard,
            created_at: row.created_at,
          },
          space: spaceObj as Space,
        };
      })
      .filter((item): item is { space: Space; membership: Membership } => Boolean(item.space));
  },

  async createSpace(input: CreateSpaceInput): Promise<Space> {
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('habitspace_mock_session');
      const user = stored ? JSON.parse(stored).user : { id: 'demo-user-1' };

      const newSpace: Space = {
        id: `space-${Date.now()}`,
        name: input.name,
        icon: input.icon || '🎯',
        description: input.description || null,
        mode: input.mode,
        join_policy: input.join_policy,
        settings: { timezone: input.timezone || 'UTC' },
        created_by: user.id,
        created_at: new Date().toISOString(),
      };

      const newMembership: Membership = {
        id: `mem-${Date.now()}`,
        space_id: newSpace.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
        nickname: null,
        show_on_leaderboard: true,
        created_at: new Date().toISOString(),
      };

      const spaces = getLocalSpaces();
      spaces.push(newSpace);
      localStorage.setItem(SPACES_KEY, JSON.stringify(spaces));

      const memberships = getLocalMemberships();
      memberships.push(newMembership);
      localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(memberships));

      return newSpace;
    }

    const { data, error } = await supabase.rpc('create_space_with_owner', {
      p_name: input.name,
      p_icon: input.icon || '🎯',
      p_description: input.description || null,
      p_mode: input.mode,
      p_join_policy: input.join_policy,
      p_timezone: input.timezone || 'UTC',
    });

    if (error) throw error;
    return data as Space;
  },

  async getSpaceMembers(spaceId: string): Promise<Membership[]> {
    if (!isSupabaseConfigured) {
      const memberships = getLocalMemberships().filter((m) => m.space_id === spaceId);
      const stored = localStorage.getItem('habitspace_mock_session');
      const currentUser = stored ? JSON.parse(stored).user : null;

      return memberships.map((m) => ({
        ...m,
        user: {
          id: m.user_id,
          email: m.user_id === currentUser?.id ? currentUser.email : 'member@example.com',
          full_name: m.user_id === currentUser?.id ? currentUser.user_metadata?.full_name : 'Member',
          avatar_url: null,
          created_at: m.created_at,
        },
      }));
    }

    const { data, error } = await supabase
      .from('memberships')
      .select('*, user:users(*)')
      .eq('space_id', spaceId);

    if (error) {
      console.error('Error fetching space members:', error);
      throw error;
    }
    return (data || []).map((row: any) => {
      const rawUser = row.user || row.users;
      const userObj = Array.isArray(rawUser) ? rawUser[0] : rawUser;
      return {
        ...row,
        user: userObj || null,
      };
    }) as Membership[];
  },

  async updateSpace(spaceId: string, updates: Partial<Space>): Promise<Space> {
    if (!isSupabaseConfigured) {
      const spaces = getLocalSpaces();
      const index = spaces.findIndex((s) => s.id === spaceId);
      if (index === -1) throw new Error('Space not found');
      spaces[index] = { ...spaces[index], ...updates };
      localStorage.setItem(SPACES_KEY, JSON.stringify(spaces));
      return spaces[index];
    }

    const { data, error } = await supabase
      .from('spaces')
      .update(updates)
      .eq('id', spaceId)
      .select()
      .single();

    if (error) throw error;
    return data as Space;
  },

  async deleteSpace(spaceId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const spaces = getLocalSpaces().filter((s) => s.id !== spaceId);
      localStorage.setItem(SPACES_KEY, JSON.stringify(spaces));
      const memberships = getLocalMemberships().filter((m) => m.space_id !== spaceId);
      localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(memberships));
      return;
    }

    const { error } = await supabase
      .from('spaces')
      .delete()
      .eq('id', spaceId);

    if (error) throw error;
  },
};
