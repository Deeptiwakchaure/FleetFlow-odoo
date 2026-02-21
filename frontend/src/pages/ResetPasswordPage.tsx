import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { FormAlert } from '../components/ui/FormAlert';
import { FormField } from '../components/ui/FormField';
import { PasswordInput } from '../components/ui/PasswordInput';
import { authErrorMessage } from '../lib/authMessages';
import { authService } from '../services/auth';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must include an uppercase letter')
      .regex(/[0-9]/, 'Password must include a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match'
  });

type ResetForm = z.infer<typeof resetSchema>;

export const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const form = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!token) {
      setError('This reset link is invalid. Request a new password reset link.');
      return;
    }

    try {
      setError('');
      const response = await authService.resetPassword(token, values.password);
      setSuccess(response.message || 'Your password has been reset successfully.');
      form.reset({ password: '', confirmPassword: '' });
    } catch (submitError: any) {
      setSuccess('');
      setError(authErrorMessage(submitError, 'Unable to reset password. Please request a new link.'));
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">Reset Password</h1>
        <p className="mb-6 text-sm text-slate-500">Set a new password for your FleetFlow account.</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField id="reset-password" label="New Password" required error={form.formState.errors.password?.message}>
            <PasswordInput
              id="reset-password"
              autoFocus
              autoComplete="new-password"
              placeholder="Create a strong password"
              invalid={!!form.formState.errors.password}
              {...form.register('password')}
            />
          </FormField>

          <FormField
            id="reset-confirm-password"
            label="Confirm New Password"
            required
            error={form.formState.errors.confirmPassword?.message}
          >
            <PasswordInput
              id="reset-confirm-password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              invalid={!!form.formState.errors.confirmPassword}
              {...form.register('confirmPassword')}
            />
          </FormField>

          {success ? <FormAlert message={success} tone="success" /> : null}
          {error ? <FormAlert message={error} tone="error" /> : null}

          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Updating password...' : 'Update Password'}
          </Button>
        </form>

        <div className="mt-5 space-y-2 text-sm text-slate-600">
          <p>
            Back to{' '}
            <Link to="/login" className="font-semibold text-brand-700">
              Login
            </Link>
          </p>
          <p>
            Link expired?{' '}
            <Link to="/forgot-password" className="font-semibold text-brand-700">
              Request a new reset link
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
