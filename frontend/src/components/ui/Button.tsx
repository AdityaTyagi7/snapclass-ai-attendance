import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed select-none rounded-xl text-sm cursor-pointer';

  const variants = {
    primary: 'bg-white text-black hover:bg-[#e4e4e7] active:bg-[#d4d4d8] font-semibold shadow-xs',
    default: 'bg-white text-black hover:bg-[#e4e4e7] active:bg-[#d4d4d8] font-semibold shadow-xs',
    secondary: 'bg-[#18181b] text-white hover:bg-[#27272a] active:bg-[#3f3f46] border border-[#27272a]',
    outline: 'border border-[#27272a] bg-transparent text-white hover:bg-[#18181b] active:bg-[#27272a]',
    ghost: 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white',
    danger: 'bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800',
  };

  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-sm gap-2',
    lg: 'px-4.5 py-2.5 text-base gap-2.5',
    icon: 'h-8 w-8 p-0',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
};
