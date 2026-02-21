import { cn } from '../../lib/cn';

type Tone = 'success' | 'error' | 'info';

type Props = {
  message: string;
  tone?: Tone;
};

export const FormAlert = ({ message, tone = 'info' }: Props) => {
  const toneStyles: Record<Tone, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700'
  };

  return <p className={cn('rounded-lg border px-3 py-2 text-sm', toneStyles[tone])}>{message}</p>;
};
