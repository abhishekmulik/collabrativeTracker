import { z } from 'zod';

export interface Invite {
  id: string;
  space_id: string;
  token: string;
  email: string | null;
  role: 'admin' | 'member';
  max_uses: number | null;
  use_count: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_by: string | null;
  created_at: string;
}

export type InviteStatus = 'active' | 'expired' | 'revoked' | 'max_used';

export function getInviteStatus(invite: Invite): InviteStatus {
  if (invite.revoked_at) return 'revoked';
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) return 'expired';
  if (invite.max_uses !== null && invite.use_count >= invite.max_uses) return 'max_used';
  return 'active';
}

export const createInviteSchema = z.object({
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  role: z.enum(['member', 'admin']).default('member'),
  max_uses: z.number().int().positive().nullable().optional(),
  expires_in_days: z.number().int().positive().nullable().optional(),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
