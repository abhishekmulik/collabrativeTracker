import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SignInPage } from '@/features/auth/SignInPage';
import { AuthCallback } from '@/features/auth/AuthCallback';
import { JoinPage } from '@/features/invites/JoinPage';
import { DashboardPage } from './DashboardPage';
import { AdminPage } from './AdminPage';
import { MePlaceholder } from './MePlaceholder';
import { SpacePlaceholder } from './SpacePlaceholder';
import { useAuth } from '@/features/auth/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-xs">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <SignInPage />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  {
    path: '/join/:token',
    element: <JoinPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'me',
        element: <MePlaceholder />,
      },
      {
        path: 'space',
        element: <SpacePlaceholder />,
      },
      {
        path: 'admin',
        element: <AdminPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
