import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

type Variant = 'default' | 'secondary' | 'danger' | 'outline';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

export const Button = ({ className, variant = 'default', loading = false, children, disabled, ...props }: Props) => {
  const variants: Record<Variant, string> = {
    default: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
    secondary: 'bg-slate-800 text-white shadow-sm hover:bg-slate-700',
    danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
};
