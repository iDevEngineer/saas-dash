import { createAuthClient } from 'better-auth/react';

const getBaseURL = () => {
  // Client-side: use actual window location (works with any port)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Server-side: use environment or detected port
  const port = process.env.PORT || '3000';
  return process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
