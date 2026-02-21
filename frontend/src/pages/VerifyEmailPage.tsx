import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FormAlert } from '../components/ui/FormAlert';
import { authService } from '../services/auth';

type VerifyState = 'verifying' | 'success' | 'error';

export const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [state, setState] = useState<VerifyState>('verifying');
  const [message, setMessage] = useState('Verifying your email. Please wait...');

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setState('error');
        setMessage('This verification link is incomplete. Request a fresh email verification link below.');
        return;
      }
      try {
        const response = await authService.verifyEmail(token);
        setState('success');
        setMessage(response.message || 'Your email has been verified. You can now sign in.');
      } catch (err: any) {
        setState('error');
        setMessage(
          err?.response?.data?.message ||
            'This verification link has expired. Request a new one below.'
        );
      }
    };

    run();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-slate-800">Email Verification</h1>
        <div className="mb-6">
          {state === 'verifying' ? <FormAlert message={message} tone="info" /> : null}
          {state === 'success' ? <FormAlert message={message} tone="success" /> : null}
          {state === 'error' ? <FormAlert message={message} tone="error" /> : null}
        </div>

        {state === 'success' ? (
          <Link to="/login" className="font-semibold text-brand-700">
            Continue to Login
          </Link>
        ) : null}

        {state === 'error' ? (
          <Link to="/resend-verification" className="font-semibold text-brand-700">
            Resend verification email
          </Link>
        ) : null}
      </div>
    </div>
  );
};
