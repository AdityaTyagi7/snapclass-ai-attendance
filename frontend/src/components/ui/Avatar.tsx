import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx('relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#27272a] border border-[#3f3f46]', className)
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const AvatarImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className, alt, ...props }) => {
  return (
    <img
      className={twMerge(clsx('aspect-square h-full w-full object-cover', className))}
      alt={alt || 'Avatar'}
      {...props}
    />
  );
};

export const AvatarFallback: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx('flex h-full w-full items-center justify-center rounded-full bg-[#27272a] text-xs font-semibold text-white uppercase', className)
      )}
      {...props}
    >
      {children}
    </div>
  );
};
