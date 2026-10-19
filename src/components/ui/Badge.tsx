import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'slate' | 'amber' | 'rose' | 'blue';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'slate', size = 'sm', children, ...props }: BadgeProps) {
  const variants = {
    brand: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    slate: 'bg-slate-800 text-slate-300 border-slate-700/60',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    blue: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
  };

  const sizes = {
    sm: 'text-[11px] font-medium px-2 py-0.5 rounded-full border',
    md: 'text-xs font-medium px-2.5 py-1 rounded-full border'
  };

  return (
    <span className={cn('inline-flex items-center gap-1 leading-none select-none', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}
