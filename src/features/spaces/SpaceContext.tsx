import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Space, Membership, CreateSpaceInput } from './types';
import { spaceService } from './spaceService';
import { useAuth } from '@/features/auth/AuthContext';

interface SpaceContextType {
  currentSpace: Space | null;
  currentMembership: Membership | null;
  userSpaces: Array<{ space: Space; membership: Membership }>;
  isLoading: boolean;
  setCurrentSpaceId: (spaceId: string) => void;
  createSpace: (input: CreateSpaceInput) => Promise<Space>;
  refreshSpaces: () => Promise<void>;
  isOwner: boolean;
  isAdmin: boolean;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userSpaces, setUserSpaces] = useState<Array<{ space: Space; membership: Membership }>>([]);
  const [currentSpaceId, setCurrentSpaceIdState] = useState<string | null>(() => {
    return localStorage.getItem('current_space_id');
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshSpaces = useCallback(async () => {
    if (!user) {
      setUserSpaces([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const spaces = await spaceService.getUserSpaces();
      setUserSpaces(spaces);

      if (spaces.length > 0) {
        // If stored space exists in the list, keep it; otherwise default to first
        const matched = spaces.find((s) => s.space.id === currentSpaceId);
        if (!matched) {
          const firstActive = spaces.find((s) => s.membership.status === 'active') || spaces[0];
          setCurrentSpaceIdState(firstActive.space.id);
          localStorage.setItem('current_space_id', firstActive.space.id);
        }
      } else {
        setCurrentSpaceIdState(null);
        localStorage.removeItem('current_space_id');
      }
    } catch (err) {
      console.error('Failed to load user spaces:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentSpaceId]);

  useEffect(() => {
    refreshSpaces();
  }, [refreshSpaces]);

  const setCurrentSpaceId = (spaceId: string) => {
    setCurrentSpaceIdState(spaceId);
    localStorage.setItem('current_space_id', spaceId);
  };

  const createSpace = async (input: CreateSpaceInput): Promise<Space> => {
    const newSpace = await spaceService.createSpace(input);
    await refreshSpaces();
    setCurrentSpaceId(newSpace.id);
    return newSpace;
  };

  const activeSpaceData = userSpaces.find((s) => s.space.id === currentSpaceId);
  const currentSpace = activeSpaceData ? activeSpaceData.space : null;
  const currentMembership = activeSpaceData ? activeSpaceData.membership : null;

  const isOwner = currentMembership?.role === 'owner';
  const isAdmin = isOwner || currentMembership?.role === 'admin';

  return (
    <SpaceContext.Provider
      value={{
        currentSpace,
        currentMembership,
        userSpaces,
        isLoading,
        setCurrentSpaceId,
        createSpace,
        refreshSpaces,
        isOwner,
        isAdmin,
      }}
    >
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpace() {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpace must be used within a SpaceProvider');
  }
  return context;
}
