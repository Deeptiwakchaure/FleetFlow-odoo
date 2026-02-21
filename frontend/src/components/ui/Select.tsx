import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, Props>(({ className, children, invalid, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none ring-brand-400 transition focus:ring-2',
          invalid ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300',
          className
        )}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {children}
      </select>
    );
  });

Select.displayName = 'Select';
