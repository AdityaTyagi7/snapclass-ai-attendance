import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'secondary', className }) => {
  const variants = {
    default: 'bg-white text-black border-transparent font-bold',
    secondary: 'bg-[#27272a] text-[#fafafa] border-transparent font-medium',
    outline: 'border border-[#27272a] bg-transparent text-[#fafafa]',
    success: 'bg-emerald-950/70 text-emerald-300 border-emerald-800 font-semibold',
    warning: 'bg-amber-950/70 text-amber-300 border-amber-800 font-semibold',
    error: 'bg-rose-950/70 text-rose-300 border-rose-800 font-semibold',
    info: 'bg-[#18181b] text-white border-[#27272a]',
    neutral: 'bg-[#18181b] text-[#a1a1aa] border-[#27272a]',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs tracking-tight border shrink-0',
          variants[variant],
          className
        )
      )}
    >
      {children}
    </span>
  );
};
