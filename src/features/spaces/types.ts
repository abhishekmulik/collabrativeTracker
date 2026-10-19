import { z } from 'zod';

export type SpaceMode = 'competitive' | 'supportive' | 'mixed';
export type JoinPolicy = 'open' | 'request';
export type MemberRole = 'owner' | 'admin' | 'member';
export type MemberStatus = 'active' | 'pending';

export interface Space {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  mode: SpaceMode;
  join_policy: JoinPolicy;
  settings: {
    timezone: string;
  };
  created_by: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Membership {
  id: string;
  space_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  nickname: string | null;
  show_on_leaderboard: boolean;
  created_at: string;
  user?: UserProfile;
}

export const createSpaceSchema = z.object({
  name: z.string().min(2, 'Space name must be at least 2 characters').max(50, 'Space name must be under 50 characters'),
  icon: z.string().default('🎯'),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional().nullable(),
  mode: z.enum(['competitive', 'supportive', 'mixed']).default('competitive'),
  join_policy: z.enum(['open', 'request']).default('open'),
  timezone: z.string().default(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'),
});

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
