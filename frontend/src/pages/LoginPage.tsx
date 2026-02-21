import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { FormAlert } from '../components/ui/FormAlert';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { authErrorMessage } from '../lib/authMessages';
import { defaultRouteByRole } from '../lib/navigation';
import { authService } from '../services/auth';
import { useAuthStore } from '../store/auth.store';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type FormValues = z.infer<typeof schema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [error, setError] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' }
  });

  useEffect(() => {
    if (token && user) {
      navigate(defaultRouteByRole[user.role], { replace: true });
    }
  }, [navigate, token, user]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setError('');
      const result = await authService.login(values.email, values.password);
      setAuth(result.token, result.user);
      navigate(defaultRouteByRole[result.user.role], { replace: true });
    } catch (err: any) {
      setError(authErrorMessage(err, 'We could not sign you in. Please try again.'));
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">FleetFlow</h1>
        <p className="mb-6 text-sm text-slate-500">Sign in to your fleet operations console</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField id="login-email" label="Email" required error={form.formState.errors.email?.message}>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="Enter your registered email"
              invalid={!!form.formState.errors.email}
              {...form.register('email')}
            />
          </FormField>
          <FormField id="login-password" label="Password" required error={form.formState.errors.password?.message}>
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              placeholder="Enter your password"
              invalid={!!form.formState.errors.password}
              {...form.register('password')}
            />
          </FormField>
          {error ? <FormAlert message={error} tone="error" /> : null}
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="font-medium text-brand-700">
            Forgot password?
          </Link>
          <Link to="/resend-verification" className="font-medium text-brand-700">
            Verify email
          </Link>
          <Link to="/register" className="font-medium text-brand-700">
            Register
          </Link>
        </div>
        <p className="mt-5 text-xs text-slate-500">
          Seed users: manager@fleetflow.com, dispatcher@fleetflow.com, safety@fleetflow.com,
          analyst@fleetflow.com
        </p>
      </div>
    </div>
  );
};
