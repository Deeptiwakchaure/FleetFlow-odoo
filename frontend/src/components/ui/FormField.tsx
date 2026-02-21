import type { ReactNode } from 'react';

type Props = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export const FormField = ({ id, label, required, error, hint, children }: Props) => {
  const messageId = `${id}-message`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </label>
      {children}
      {error ? (
        <p id={messageId} className="text-xs text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
};
