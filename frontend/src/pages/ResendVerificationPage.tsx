import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { FormAlert } from '../components/ui/FormAlert';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { authErrorMessage } from '../lib/authMessages';
import { authService } from '../services/auth';

const resendSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address')
});

type ResendForm = z.infer<typeof resendSchema>;

export const ResendVerificationPage = () => {
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const form = useForm<ResendForm>({
    resolver: zodResolver(resendSchema),
    mode: 'onChange',
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setSubmitError('');
      const response = await authService.resendVerification(values.email);
      setMessage(response.message || 'A new verification link has been sent to your email.');
      form.reset({ email: '' });
    } catch (err: any) {
      setMessage('');
      setSubmitError(authErrorMessage(err, 'Unable to resend verification email right now.'));
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">Resend Verification</h1>
        <p className="mb-6 text-sm text-slate-500">
          Enter your email to receive a new verification link.
        </p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField id="resend-email" label="Email" required error={form.formState.errors.email?.message}>
            <Input
              id="resend-email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="Enter your registered email"
              invalid={!!form.formState.errors.email}
              {...form.register('email')}
            />
          </FormField>

          {message ? <FormAlert message={message} tone="success" /> : null}
          {submitError ? <FormAlert message={submitError} tone="error" /> : null}

          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Sending verification link...' : 'Resend Verification Email'}
          </Button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Back to{' '}
          <Link to="/login" className="font-semibold text-brand-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};
