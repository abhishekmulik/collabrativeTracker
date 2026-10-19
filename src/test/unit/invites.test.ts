import { describe, it, expect } from 'vitest';
import { getInviteStatus, createInviteSchema, Invite } from '@/features/invites/types';
import { inviteService } from '@/features/invites/inviteService';
import { createSpaceSchema } from '@/features/spaces/types';

describe('Invites Unit Tests', () => {
  it('generates a 32-character hexadecimal token', () => {
    const token = inviteService.generateToken();
    expect(token).toBeDefined();
    expect(token.length).toBe(32);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it('correctly marks an active invite', () => {
    const activeInvite: Invite = {
      id: 'inv-1',
      space_id: 'space-1',
      token: 'validtoken123',
      email: null,
      role: 'member',
      max_uses: 5,
      use_count: 2,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      revoked_at: null,
      created_by: 'user-1',
      created_at: new Date().toISOString(),
    };

    expect(getInviteStatus(activeInvite)).toBe('active');
  });

  it('correctly detects an expired invite', () => {
    const expiredInvite: Invite = {
      id: 'inv-2',
      space_id: 'space-1',
      token: 'expiredtoken123',
      email: null,
      role: 'member',
      max_uses: null,
      use_count: 0,
      expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      revoked_at: null,
      created_by: 'user-1',
      created_at: new Date().toISOString(),
    };

    expect(getInviteStatus(expiredInvite)).toBe('expired');
  });

  it('correctly detects a max-used invite', () => {
    const maxUsedInvite: Invite = {
      id: 'inv-3',
      space_id: 'space-1',
      token: 'maxusedtoken123',
      email: null,
      role: 'member',
      max_uses: 1,
      use_count: 1,
      expires_at: null,
      revoked_at: null,
      created_by: 'user-1',
      created_at: new Date().toISOString(),
    };

    expect(getInviteStatus(maxUsedInvite)).toBe('max_used');
  });

  it('correctly detects a revoked invite regardless of date or uses', () => {
    const revokedInvite: Invite = {
      id: 'inv-4',
      space_id: 'space-1',
      token: 'revokedtoken123',
      email: null,
      role: 'admin',
      max_uses: 10,
      use_count: 0,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      revoked_at: new Date().toISOString(),
      created_by: 'user-1',
      created_at: new Date().toISOString(),
    };

    expect(getInviteStatus(revokedInvite)).toBe('revoked');
  });

  describe('Zod Validation Schemas', () => {
    it('validates valid CreateSpace input', () => {
      const result = createSpaceSchema.safeParse({
        name: 'Iron Habit Crew',
        icon: '💪',
        description: 'Morning gym check-ins',
        mode: 'competitive',
        join_policy: 'open',
        timezone: 'America/New_York',
      });

      expect(result.success).toBe(true);
    });

    it('rejects too short space name', () => {
      const result = createSpaceSchema.safeParse({
        name: 'A',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 2 characters');
      }
    });

    it('validates CreateInvite schema', () => {
      const result = createInviteSchema.safeParse({
        role: 'member',
        max_uses: 5,
        expires_in_days: 7,
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid email format', () => {
      const result = createInviteSchema.safeParse({
        email: 'invalid-email-string',
        role: 'member',
      });

      expect(result.success).toBe(false);
    });
  });
});
