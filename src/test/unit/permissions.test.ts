import { describe, it, expect } from 'vitest';
import { permissions } from '@/features/spaces/permissions';

describe('Permissions Matrix Unit Tests', () => {
  describe('Space Deletion', () => {
    it('allows only the owner to delete the Space', () => {
      expect(permissions.canDeleteSpace('owner')).toBe(true);
      expect(permissions.canDeleteSpace('admin')).toBe(false);
      expect(permissions.canDeleteSpace('member')).toBe(false);
    });
  });

  describe('Invite & Settings Management', () => {
    it('allows owner and admin to manage invites', () => {
      expect(permissions.canManageInvites('owner')).toBe(true);
      expect(permissions.canManageInvites('admin')).toBe(true);
      expect(permissions.canManageInvites('member')).toBe(false);
    });

    it('allows owner and admin to approve join requests', () => {
      expect(permissions.canApproveJoinRequests('owner')).toBe(true);
      expect(permissions.canApproveJoinRequests('admin')).toBe(true);
      expect(permissions.canApproveJoinRequests('member')).toBe(false);
    });
  });

  describe('Role Promotions and Demotions', () => {
    it('allows owner to promote a member to admin', () => {
      expect(permissions.canPromoteToAdmin('owner', 'member')).toBe(true);
      expect(permissions.canPromoteToAdmin('admin', 'member')).toBe(false);
    });

    it('allows owner to demote an admin to member', () => {
      expect(permissions.canDemoteAdmin('owner', 'admin')).toBe(true);
      expect(permissions.canDemoteAdmin('admin', 'admin')).toBe(false);
    });

    it('never allows demoting the owner', () => {
      expect(permissions.canDemoteAdmin('admin', 'owner')).toBe(false);
      expect(permissions.canDemoteAdmin('owner', 'owner')).toBe(false);
    });
  });

  describe('Member Removal & Leaving', () => {
    it('allows an admin to remove a member, but not another admin or the owner', () => {
      expect(permissions.canRemoveMember('admin', 'member', false)).toBe(true);
      expect(permissions.canRemoveMember('admin', 'admin', false)).toBe(false);
      expect(permissions.canRemoveMember('admin', 'owner', false)).toBe(false);
    });

    it('allows an owner to remove any non-owner member', () => {
      expect(permissions.canRemoveMember('owner', 'member', false)).toBe(true);
      expect(permissions.canRemoveMember('owner', 'admin', false)).toBe(true);
      expect(permissions.canRemoveMember('owner', 'owner', false)).toBe(false);
    });

    it('allows a member or admin to leave the Space, but never the owner', () => {
      expect(permissions.canLeaveSpace('member')).toBe(true);
      expect(permissions.canLeaveSpace('admin')).toBe(true);
      expect(permissions.canLeaveSpace('owner')).toBe(false);
    });
  });
});
