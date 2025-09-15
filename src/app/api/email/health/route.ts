import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function GET() {
  try {
    const healthCheck = await emailService.healthCheck();
    const availableProviders = emailService.getAvailableProviders();

    return NextResponse.json({
      ...healthCheck,
      availableProviders,
      timestamp: new Date().toISOString(),
      status: healthCheck.isHealthy ? 'healthy' : 'unhealthy',
    });
  } catch (error) {
    console.error('Email health check error:', error);

    return NextResponse.json(
      {
        isHealthy: false,
        providers: {},
        availableProviders: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
      },
      { status: 500 }
    );
  }
}
