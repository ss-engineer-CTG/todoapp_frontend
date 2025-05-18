import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  (
    { 
      className, 
      orientation = 'horizontal', 
      decorative = true, 
      ...props 
    },
    ref
  ) => (
    <div
      ref={ref}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        'shrink-0',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        'bg-gray-200',
        className
      )}
      {...props}
    />
  )
);

Separator.displayName = 'Separator';

export { Separator };