import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from '@/lib/audit/audit-service';
import { z } from 'zod';

const auditQuerySchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  actorId: z.string().optional(),
  eventTypes: z.string().transform(str => str.split(',')).optional(),
  aggregateTypes: z.string().transform(str => str.split(',')).optional(),
  aggregateId: z.string().optional(),
});

// GET /api/audit/events - Get audit events for organization
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

    const validatedParams = auditQuerySchema.parse(queryParams);

    let events;

    if (validatedParams.aggregateId) {
      // Get audit trail for specific resource
      events = await AuditService.getAuditTrail(
        organizationId,
        validatedParams.aggregateId,
        {
          limit: validatedParams.limit,
          offset: validatedParams.offset,
          startDate: validatedParams.startDate ? new Date(validatedParams.startDate) : undefined,
          endDate: validatedParams.endDate ? new Date(validatedParams.endDate) : undefined,
          eventTypes: validatedParams.eventTypes,
        }
      );
    } else {
      // Get organization-wide audit events
      events = await AuditService.getOrganizationAuditEvents(
        organizationId,
        {
          limit: validatedParams.limit,
          offset: validatedParams.offset,
          startDate: validatedParams.startDate ? new Date(validatedParams.startDate) : undefined,
          endDate: validatedParams.endDate ? new Date(validatedParams.endDate) : undefined,
          actorId: validatedParams.actorId,
          eventTypes: validatedParams.eventTypes,
          aggregateTypes: validatedParams.aggregateTypes,
        }
      );
    }

    return NextResponse.json({
      events,
      pagination: {
        limit: validatedParams.limit || 100,
        offset: validatedParams.offset || 0,
        hasMore: events.length === (validatedParams.limit || 100),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to fetch audit events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}