import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY
      ? 'SET (length: ' + process.env.RESEND_API_KEY.length + ')'
      : 'NOT SET',
    EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
  };

  return NextResponse.json(envVars);
}
