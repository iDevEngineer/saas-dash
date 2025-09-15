import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from '@/lib/audit/audit-service';
import { WebhookService } from '@/lib/webhooks/webhook-service';
import { z } from 'zod';

const statsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month']).default('week'),
});

// GET /api/audit/stats - Get audit and webhook statistics
export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedParams = statsQuerySchema.parse(queryParams);

    const startDate = validatedParams.startDate
      ? new Date(validatedParams.startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago

    const endDate = validatedParams.endDate
      ? new Date(validatedParams.endDate)
      : new Date(); // Default to now

    // Get audit statistics
    const auditStats = await AuditService.getAuditStats(
      organizationId,
      startDate,
      endDate
    );

    // Get webhook delivery statistics
    const webhookStats = await WebhookService.getDeliveryStats(
      organizationId,
      startDate,
      endDate
    );

    return NextResponse.json({
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        duration: validatedParams.period,
      },
      audit: {
        eventTypes: auditStats.eventTypes,
        actorTypes: auditStats.actorTypes,
        totalEvents: Object.values(auditStats.eventTypes).reduce((sum, count) => sum + count, 0),
      },
      webhooks: {
        deliveryStats: webhookStats,
        totalDeliveries: Object.values(webhookStats).reduce((sum, count) => sum + count, 0),
        successRate: webhookStats.success ?
          (webhookStats.success / Object.values(webhookStats).reduce((sum, count) => sum + count, 0)) * 100 : 0,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to fetch audit stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}