'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Github, Chrome, Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialsSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: callbackUrl,
      });

      console.log('SignIn result:', result);

      if (result.error) {
        console.error('SignIn error:', result.error);
        setError('Invalid email or password');
      } else if (result.data) {
        console.log('SignIn successful, data:', result.data);

        // Wait a brief moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 100));

        // Force a full page navigation instead of client-side routing
        window.location.href = callbackUrl;
      } else {
        setError('An unexpected error occurred.');
      }
    } catch (error) {
      console.error('SignIn exception:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider,
        callbackURL: callbackUrl,
      });
    } catch {
      setError('OAuth sign in failed');
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (email: string) => {
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    if (emailInput && passwordInput) {
      emailInput.value = email;
      passwordInput.value = 'password123';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-4">
        {/* Demo Credentials Card */}
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <div className="mb-2 font-medium">Demo Credentials</div>
            <div className="space-y-1 text-sm">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin@example.com')}
                className="block w-full rounded px-2 py-1 text-left transition-colors hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <span className="font-medium">Admin:</span> admin@example.com / password123
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('john@example.com')}
                className="block w-full rounded px-2 py-1 text-left transition-colors hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <span className="font-medium">User 1:</span> john@example.com / password123
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('jane@example.com')}
                className="block w-full rounded px-2 py-1 text-left transition-colors hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <span className="font-medium">User 2:</span> jane@example.com / password123
              </button>
            </div>
            <div className="mt-2 text-xs opacity-75">
              Click any credential to auto-fill the form
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl font-bold">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && <div className="text-center text-sm text-red-600">{error}</div>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 dark:bg-gray-950">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleOAuthSignIn('github')}
                disabled={isLoading}
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOAuthSignIn('google')}
                disabled={isLoading}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <p className="w-full text-center text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
