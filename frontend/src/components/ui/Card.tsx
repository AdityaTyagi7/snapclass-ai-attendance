import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={twMerge(clsx('rounded-xl border border-[#27272a] bg-[#121215] text-[#fafafa] shadow-xs overflow-hidden', className))}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={twMerge(clsx('flex flex-col space-y-1.5 p-5 sm:p-6', className))}>{children}</div>;
};

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <h3 className={twMerge(clsx('font-semibold leading-none tracking-tight text-white text-base', className))}>{children}</h3>;
};

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <p className={twMerge(clsx('text-xs text-[#a1a1aa]', className))}>{children}</p>;
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={twMerge(clsx('p-5 sm:p-6 pt-0', className))}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={twMerge(clsx('flex items-center p-5 sm:p-6 pt-0 border-t border-[#27272a]/50', className))}>{children}</div>;
};
