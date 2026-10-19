import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MemberRole, MemberStatus, Membership } from '../spaces/types';

const MEMBERSHIPS_KEY = 'habitspace_mock_memberships';

function getLocalMemberships(): Membership[] {
  try {
    return JSON.parse(localStorage.getItem(MEMBERSHIPS_KEY) || '[]');
  } catch {
    return [];
  }
}

export const memberService = {
  async updateMemberRole(membershipId: string, role: MemberRole): Promise<void> {
    if (!isSupabaseConfigured) {
      const memberships = getLocalMemberships();
      const index = memberships.findIndex((m) => m.id === membershipId);
      if (index !== -1) {
        memberships[index].role = role;
        localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(memberships));
      }
      return;
    }

    const { error } = await supabase
      .from('memberships')
      .update({ role })
      .eq('id', membershipId);

    if (error) throw error;
  },

  async updateMemberStatus(membershipId: string, status: MemberStatus): Promise<void> {
    if (!isSupabaseConfigured) {
      const memberships = getLocalMemberships();
      const index = memberships.findIndex((m) => m.id === membershipId);
      if (index !== -1) {
        memberships[index].status = status;
        localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(memberships));
      }
      return;
    }

    const { error } = await supabase
      .from('memberships')
      .update({ status })
      .eq('id', membershipId);

    if (error) throw error;
  },

  async removeMember(membershipId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const memberships = getLocalMemberships().filter((m) => m.id !== membershipId);
      localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(memberships));
      return;
    }

    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('id', membershipId);

    if (error) throw error;
  },

  async updateProfileNickname(membershipId: string, nickname: string, showOnLeaderboard: boolean): Promise<void> {
    if (!isSupabaseConfigured) {
      const memberships = getLocalMemberships();
      const index = memberships.findIndex((m) => m.id === membershipId);
      if (index !== -1) {
        memberships[index].nickname = nickname || null;
        memberships[index].show_on_leaderboard = showOnLeaderboard;
        localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(memberships));
      }
      return;
    }

    const { error } = await supabase
      .from('memberships')
      .update({
        nickname: nickname || null,
        show_on_leaderboard: showOnLeaderboard,
      })
      .eq('id', membershipId);

    if (error) throw error;
  },
};
