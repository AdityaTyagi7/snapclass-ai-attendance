import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={twMerge(clsx('bg-[#323232] text-white rounded-2xl border border-[#0D7377]/40 shadow-lg shadow-black/40 hover:border-[#14FFEC]/50 transition-all duration-200 overflow-hidden', className))}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={twMerge(clsx('p-5 border-b border-[#212121]', className))}>{children}</div>;
};

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <h3 className={twMerge(clsx('text-base font-bold text-white tracking-tight', className))}>{children}</h3>;
};

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <p className={twMerge(clsx('text-xs text-zinc-400 mt-1', className))}>{children}</p>;
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={twMerge(clsx('p-5 text-zinc-200', className))}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={twMerge(clsx('p-4 bg-[#212121]/50 border-t border-[#212121] flex items-center justify-between', className))}>{children}</div>;
};
