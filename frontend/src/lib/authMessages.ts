export const authErrorMessage = (error: any, fallback: string) => {
  const status = error?.response?.status as number | undefined;
  const rawMessage = (error?.response?.data?.message || '').toString().toLowerCase();

  if (status === 401 || rawMessage.includes('invalid email or password') || rawMessage.includes('invalid credentials')) {
    return 'Incorrect email or password. Please try again.';
  }

  if (status === 403 && rawMessage.includes('verify')) {
    return 'Your email is not verified. Please verify before logging in.';
  }

  if (status === 423 || rawMessage.includes('locked')) {
    return 'Your account is temporarily locked after multiple failed attempts. Please try again later.';
  }

  if (status && status >= 500) {
    return 'We are unable to complete this request right now. Please try again shortly.';
  }

  return error?.response?.data?.message || fallback;
};
