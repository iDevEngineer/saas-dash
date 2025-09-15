import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const publicPaths = ['/', '/auth/signin', '/auth/signup', '/auth/error', '/api/auth'];

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Protected routes that require authentication
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/admin');

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('better-auth.session');

  // If no session cookie, redirect to sign in
  if (!sessionCookie) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // For admin routes, we'll need to verify the session on the server side
  // The actual role check will happen in the page/API route
  // This is because we can't access the database in Edge Runtime

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
