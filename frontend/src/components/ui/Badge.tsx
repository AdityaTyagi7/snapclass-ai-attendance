import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className }) => {
  const variants = {
    success: 'bg-[#0D7377]/60 text-[#14FFEC] border-[#14FFEC]/50 shadow-xs shadow-[#14FFEC]/20',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-700/60',
    error: 'bg-rose-950/60 text-rose-300 border-rose-700/60 font-semibold',
    info: 'bg-[#323232] text-[#14FFEC] border-[#0D7377]',
    neutral: 'bg-[#212121] text-zinc-300 border-[#323232]',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold tracking-tight border shrink-0',
          variants[variant],
          className
        )
      )}
    >
      {children}
    </span>
  );
};
