import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-3.5 text-[#71717a] pointer-events-none">{icon}</div>}
          <input
            ref={ref}
            className={twMerge(
              clsx(
                'w-full rounded-xl border bg-[#18181b] px-3.5 py-2.5 text-sm text-white placeholder:text-[#71717a] transition duration-150',
                'focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white',
                error ? 'border-rose-500 focus:border-rose-400 focus:ring-rose-500/20' : 'border-[#27272a] hover:border-[#3f3f46]',
                icon && 'pl-10',
                className
              )
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#a1a1aa]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
