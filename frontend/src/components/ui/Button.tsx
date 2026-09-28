import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
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
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed select-none rounded-lg text-sm cursor-pointer';

  const variants = {
    primary: 'bg-[#0D7377] text-[#14FFEC] hover:bg-[#0D7377]/80 active:bg-[#0D7377]/60 border border-[#14FFEC]/40 hover:border-[#14FFEC] shadow-md shadow-[#0D7377]/30 focus:ring-[#14FFEC]/40',
    secondary: 'bg-[#323232] text-white hover:bg-[#323232]/80 active:bg-[#212121] border border-[#0D7377]/60 focus:ring-[#0D7377]/50',
    outline: 'border border-[#0D7377] bg-transparent text-[#14FFEC] hover:bg-[#0D7377]/20 active:bg-[#0D7377]/30 focus:ring-[#14FFEC]/30',
    ghost: 'text-[#14FFEC] hover:bg-[#0D7377]/20 hover:text-white active:bg-[#0D7377]/30 focus:ring-[#14FFEC]/30',
    danger: 'bg-rose-950/80 text-rose-300 hover:bg-rose-900 border border-rose-700/60 focus:ring-rose-500/40',
  };

  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-sm gap-2',
    lg: 'px-4.5 py-2.5 text-base gap-2.5',
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
      <span>{children}</span>
    </button>
  );
};
