import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className={cn(
        'backdrop:bg-slate-950/80 backdrop:backdrop-blur-sm bg-slate-900 border border-slate-800 text-slate-100',
        'rounded-2xl p-0 w-full max-w-lg shadow-2xl shadow-black/50 m-auto focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-150',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
        <div>
          {title && <h2 className="text-base font-semibold text-slate-100">{title}</h2>}
          {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
