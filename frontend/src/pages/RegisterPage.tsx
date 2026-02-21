import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { FormAlert } from '../components/ui/FormAlert';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { authErrorMessage } from '../lib/authMessages';
import { authService } from '../services/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setSubmitError('');
      setSuccessMessage('');
      await authService.register(values);
      setSuccessMessage(
        'Registration successful. Please verify your email before logging in. You can request a new verification email below if needed.'
      );
      form.reset({ name: '', email: '', password: '' });
    } catch (err: any) {
      setSubmitError(authErrorMessage(err, 'We could not create your account. Please try again.'));
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">Create FleetFlow Account</h1>
        <p className="mb-6 text-sm text-slate-500">Register and start with role-based access.</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField id="register-name" label="Full Name" required error={form.formState.errors.name?.message}>
            <Input
              id="register-name"
              autoFocus
              placeholder="Enter your full name"
              invalid={!!form.formState.errors.name}
              {...form.register('name')}
            />
          </FormField>

          <FormField id="register-email" label="Email" required error={form.formState.errors.email?.message}>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="Enter a valid email address"
              invalid={!!form.formState.errors.email}
              {...form.register('email')}
            />
          </FormField>

          <FormField id="register-password" label="Password" required error={form.formState.errors.password?.message}>
            <PasswordInput
              id="register-password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              invalid={!!form.formState.errors.password}
              {...form.register('password')}
            />
          </FormField>

          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Public registration creates a <span className="font-semibold">DRIVER</span> account. Manager
            approval is required for privileged role provisioning.
          </p>

          {successMessage ? <FormAlert message={successMessage} tone="success" /> : null}
          {submitError ? <FormAlert message={submitError} tone="error" /> : null}

          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Registering...' : 'Register'}
          </Button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700">
            Login
          </Link>
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Need a new verification link?{' '}
          <Link to="/resend-verification" className="font-semibold text-brand-700">
            Resend verification email
          </Link>
        </p>
      </div>
    </div>
  );
};
