import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpaceSwitcher } from '@/features/spaces/SpaceSwitcher';
import { Space, Membership } from '@/features/spaces/types';

const mockSpaces: Array<{ space: Space; membership: Membership }> = [
  {
    space: {
      id: 'space-1',
      name: 'Gym Buddies',
      icon: '🏋️',
      description: 'Morning workouts',
      mode: 'competitive',
      join_policy: 'open',
      settings: { timezone: 'UTC' },
      created_by: 'user-1',
      created_at: new Date().toISOString(),
    },
    membership: {
      id: 'mem-1',
      space_id: 'space-1',
      user_id: 'user-1',
      role: 'owner',
      status: 'active',
      nickname: 'Abhi',
      show_on_leaderboard: true,
      created_at: new Date().toISOString(),
    },
  },
  {
    space: {
      id: 'space-2',
      name: 'Family Wellness',
      icon: '🌱',
      description: 'Health habits',
      mode: 'supportive',
      join_policy: 'request',
      settings: { timezone: 'UTC' },
      created_by: 'user-2',
      created_at: new Date().toISOString(),
    },
    membership: {
      id: 'mem-2',
      space_id: 'space-2',
      user_id: 'user-1',
      role: 'member',
      status: 'active',
      nickname: null,
      show_on_leaderboard: true,
      created_at: new Date().toISOString(),
    },
  },
];

const mockSetCurrentSpaceId = vi.fn();

vi.mock('@/features/spaces/SpaceContext', () => ({
  useSpace: () => ({
    currentSpace: mockSpaces[0].space,
    currentMembership: mockSpaces[0].membership,
    userSpaces: mockSpaces,
    setCurrentSpaceId: mockSetCurrentSpaceId,
    createSpace: vi.fn(),
  }),
}));

describe('SpaceSwitcher Component Tests', () => {
  it('renders current space icon and name', () => {
    render(<SpaceSwitcher />);
    expect(screen.getByText('Gym Buddies')).toBeInTheDocument();
    expect(screen.getByText('🏋️')).toBeInTheDocument();
  });

  it('opens space dropdown when clicked and displays spaces', () => {
    render(<SpaceSwitcher />);
    const trigger = screen.getByRole('button', { name: /switch space/i });
    fireEvent.click(trigger);

    expect(screen.getByText('Your Spaces')).toBeInTheDocument();
    expect(screen.getByText('Family Wellness')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('Create New Space')).toBeInTheDocument();
  });

  it('switches space when another space is clicked', () => {
    render(<SpaceSwitcher />);
    const trigger = screen.getByRole('button', { name: /switch space/i });
    fireEvent.click(trigger);

    const secondSpace = screen.getByText('Family Wellness');
    fireEvent.click(secondSpace);

    expect(mockSetCurrentSpaceId).toHaveBeenCalledWith('space-2');
  });
});
