import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={twMerge(clsx('animate-pulse rounded-lg bg-[#323232] border border-[#0D7377]/30', className))} />;
};
