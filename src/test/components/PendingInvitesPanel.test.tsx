import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PendingInvitesPanel } from '@/features/invites/PendingInvitesPanel';
import { inviteService } from '@/features/invites/inviteService';
import { Invite } from '@/features/invites/types';

const mockInvites: Invite[] = [
  {
    id: 'inv-active',
    space_id: 'space-1',
    token: 'active1234567890abcdef',
    email: 'friend@test.com',
    role: 'member',
    max_uses: 5,
    use_count: 1,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    revoked_at: null,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
  },
  {
    id: 'inv-expired',
    space_id: 'space-1',
    token: 'expired1234567890abcdef',
    email: null,
    role: 'admin',
    max_uses: null,
    use_count: 0,
    expires_at: new Date(Date.now() - 3600000).toISOString(),
    revoked_at: null,
    created_by: 'user-1',
    created_at: new Date().toISOString(),
  },
];

describe('PendingInvitesPanel Component Tests', () => {
  beforeEach(() => {
    vi.spyOn(inviteService, 'getSpaceInvites').mockResolvedValue(mockInvites);
  });

  it('renders active and expired invite items with status badges', async () => {
    render(<PendingInvitesPanel spaceId="space-1" />);

    expect(screen.getByText(/loading invites/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    expect(screen.getByText(/To: friend@test\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Used: 1 \/ 5/i)).toBeInTheDocument();
  });
});
