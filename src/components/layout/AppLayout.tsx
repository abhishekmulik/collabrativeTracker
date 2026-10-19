import { Outlet, NavLink } from 'react-router-dom';
import { Header } from './Header';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useSpace } from '@/features/spaces/SpaceContext';
import { CheckSquare, User, Users, Settings } from 'lucide-react';

export function AppLayout() {
  const { currentSpace, isAdmin } = useSpace();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <OfflineBanner />
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 pb-24 sm:pb-8">
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile / Tablet PWA */}
      {currentSpace && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2 sm:hidden">
          <div className="flex items-center justify-around max-w-md mx-auto">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <CheckSquare className="w-5 h-5" />
              <span>Today</span>
            </NavLink>

            <NavLink
              to="/me"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <User className="w-5 h-5" />
              <span>Me</span>
            </NavLink>

            <NavLink
              to="/space"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Users className="w-5 h-5" />
              <span>Space</span>
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                    isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <Settings className="w-5 h-5" />
                <span>Admin</span>
              </NavLink>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
