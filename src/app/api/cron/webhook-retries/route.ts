import { NextRequest, NextResponse } from 'next/server';
import { WebhookService } from '@/lib/webhooks/webhook-service';
import { AuditService } from '@/lib/audit/audit-service';

// POST /api/cron/webhook-retries - Process pending webhook retries
export async function POST(request: NextRequest) {
  try {
    // Verify this is a valid cron request (in production, you'd verify the cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const startTime = Date.now();

    // Process pending webhook retries
    await WebhookService.processPendingRetries();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log system event for monitoring
    await AuditService.recordSystemEvent(
      'system', // For system-wide events, we use 'system' as organization ID
      'webhook_retry_job_completed',
      {
        duration_ms: duration,
        completed_at: new Date().toISOString(),
      }
    );

    return NextResponse.json({
      success: true,
      duration,
      message: 'Webhook retries processed successfully',
    });

  } catch (error) {
    console.error('Webhook retry cron job failed:', error);

    // Log system error
    try {
      await AuditService.recordSystemEvent(
        'system',
        'webhook_retry_job_failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          failed_at: new Date().toISOString(),
        }
      );
    } catch (auditError) {
      console.error('Failed to log audit event for cron failure:', auditError);
    }

    return NextResponse.json(
      {
        error: 'Failed to process webhook retries',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/cron/webhook-retries - Get status of webhook retry system
export async function GET() {
  return NextResponse.json({
    status: 'active',
    description: 'Webhook retry processing endpoint',
    usage: 'POST to this endpoint to process pending retries',
  });
}