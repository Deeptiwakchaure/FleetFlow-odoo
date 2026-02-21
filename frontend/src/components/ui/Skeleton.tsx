import { cn } from '../../lib/cn';

type Props = {
  className?: string;
};

export const Skeleton = ({ className }: Props) => {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200/80', className)} />;
};
