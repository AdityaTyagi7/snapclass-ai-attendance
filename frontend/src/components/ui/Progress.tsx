import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

export const Progress: React.FC<ProgressProps> = ({ value = 0, max = 100, className, ...props }) => {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

  return (
    <div
      className={twMerge(
        clsx('relative h-2 w-full overflow-hidden rounded-full bg-[#27272a]', className)
      )}
      {...props}
    >
      <div
        className="h-full bg-white transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
