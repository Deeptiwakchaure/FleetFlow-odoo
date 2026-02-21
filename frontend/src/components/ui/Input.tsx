import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, Props>(({ className, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none ring-brand-400 transition focus:ring-2',
          invalid ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-300',
          className
        )}
        aria-invalid={invalid || undefined}
        {...props}
      />
    );
  });

Input.displayName = 'Input';
