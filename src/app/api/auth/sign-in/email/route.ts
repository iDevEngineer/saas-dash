import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest, NextResponse } from 'next/server';

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth);

function addCorsHeaders(response: Response, request: NextRequest) {
  const origin = request.headers.get('origin');

  // Always set CORS headers for localhost development
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL
  ].filter(Boolean);

  // Set CORS headers - be permissive for localhost
  if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost')) {
    response.headers.set('Access-Control-Allow-Origin', origin || 'http://localhost:3000');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cookie, Set-Cookie');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }

  return response;
}

export async function GET(request: NextRequest) {
  try {
    const response = await authGET(request);
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Auth GET error:', error);
    return addCorsHeaders(new Response('Internal Server Error', { status: 500 }), request);
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = await authPOST(request);
    return addCorsHeaders(response, request);
  } catch (error) {
    console.error('Auth POST error:', error);
    return addCorsHeaders(new Response('Internal Server Error', { status: 500 }), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  // Always return 200 for OPTIONS with proper CORS headers
  return addCorsHeaders(new NextResponse(null, { status: 200 }), request);
}