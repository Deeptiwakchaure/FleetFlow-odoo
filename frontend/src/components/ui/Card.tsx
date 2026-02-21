import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Props = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export const Card = ({ title, children, className }: Props) => {
  return (
    <section className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      {title ? <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3> : null}
      {children}
    </section>
  );
};
