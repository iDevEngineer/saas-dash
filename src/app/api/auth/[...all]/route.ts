import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest, NextResponse } from 'next/server';

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth);

function addCorsHeaders(response: Response, request: NextRequest) {
  const origin = request.headers.get('origin');

  if (origin) {
    let allowOrigin = false;

    if (process.env.NODE_ENV === 'development') {
      // In development, allow any localhost origin
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        allowOrigin = true;
      }
    } else {
      // Production: check against allowed origins
      const allowedOrigins = [process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_APP_URL].filter(
        Boolean
      );

      if (allowedOrigins.includes(origin)) {
        allowOrigin = true;
      }
    }

    if (allowOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, Cookie'
      );
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
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
  try {
    // Return manual CORS response for OPTIONS requests
    return addCorsHeaders(new NextResponse(null, { status: 200 }), request);
  } catch (error) {
    console.error('Auth OPTIONS error:', error);
    return addCorsHeaders(new NextResponse('Internal Server Error', { status: 500 }), request);
  }
}
