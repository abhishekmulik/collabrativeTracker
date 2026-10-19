import { useState, useRef, useEffect } from 'react';
import { useSpace } from './SpaceContext';
import { ChevronDown, Plus, Check, ShieldCheck, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { CreateSpaceModal } from './CreateSpaceModal';

export function SpaceSwitcher() {
  const { currentSpace, userSpaces, setCurrentSpaceId } = useSpace();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 transition-all text-slate-100"
        aria-label="Switch Space"
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none">{currentSpace?.icon || '🎯'}</span>
        <span className="text-sm font-semibold max-w-[140px] truncate text-slate-100">
          {currentSpace?.name || 'Select Space'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/60 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Your Spaces
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {userSpaces.map(({ space, membership }) => {
              const isSelected = space.id === currentSpace?.id;
              const isPending = membership.status === 'pending';

              return (
                <button
                  key={space.id}
                  type="button"
                  onClick={() => {
                    if (!isPending) {
                      setCurrentSpaceId(space.id);
                      setIsOpen(false);
                    }
                  }}
                  disabled={isPending}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'bg-brand-500/10 text-brand-300'
                      : isPending
                      ? 'opacity-60 cursor-not-allowed text-slate-400'
                      : 'hover:bg-slate-800/70 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base">{space.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate text-slate-100">{space.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        {membership.role === 'owner' ? (
                          <span className="text-amber-400 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" /> Owner
                          </span>
                        ) : membership.role === 'admin' ? (
                          <span className="text-sky-400 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" /> Admin
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5">
                            <User className="w-3 h-3" /> Member
                          </span>
                        )}
                        {isPending && <Badge variant="amber" size="sm">Pending</Badge>}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1 mt-1 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsCreateOpen(true);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-brand-400 hover:bg-brand-500/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Space</span>
            </button>
          </div>
        </div>
      )}

      <CreateSpaceModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
