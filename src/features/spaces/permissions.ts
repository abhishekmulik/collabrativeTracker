import { MemberRole } from './types';

export const permissions = {
  canDeleteSpace(role: MemberRole): boolean {
    return role === 'owner';
  },

  canManageSettings(role: MemberRole): boolean {
    return role === 'owner' || role === 'admin';
  },

  canManageInvites(role: MemberRole): boolean {
    return role === 'owner' || role === 'admin';
  },

  canApproveJoinRequests(role: MemberRole): boolean {
    return role === 'owner' || role === 'admin';
  },

  canPromoteToAdmin(actorRole: MemberRole, targetRole: MemberRole): boolean {
    return actorRole === 'owner' && targetRole === 'member';
  },

  canDemoteAdmin(actorRole: MemberRole, targetRole: MemberRole): boolean {
    return actorRole === 'owner' && targetRole === 'admin';
  },

  canRemoveMember(actorRole: MemberRole, targetRole: MemberRole, isSelf: boolean): boolean {
    // Nobody can remove the owner
    if (targetRole === 'owner') return false;

    // Self leaving
    if (isSelf) {
      return true;
    }

    // Owner can remove anyone except self
    if (actorRole === 'owner') return true;

    // Admin can remove ordinary members
    if (actorRole === 'admin' && targetRole === 'member') return true;

    return false;
  },

  canLeaveSpace(role: MemberRole): boolean {
    // Owner cannot leave without transferring ownership
    return role !== 'owner';
  },
};
