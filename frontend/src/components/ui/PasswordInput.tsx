import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Input } from './Input';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  invalid?: boolean;
};

export const PasswordInput = forwardRef<HTMLInputElement, Props>(({ className, invalid, ...props }, ref) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={isVisible ? 'text' : 'password'}
        className={`pr-10 ${className || ''}`}
        invalid={invalid}
        {...props}
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
        aria-label={isVisible ? 'Hide password' : 'Show password'}
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';
