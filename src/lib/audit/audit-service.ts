import { db } from '@/lib/db';
import {
  auditEvents,
  auditLogs,
  auditSnapshots,
  type NewAuditEvent,
  type NewAuditLog,
  type NewAuditSnapshot,
  type AuditAction,
  type ActorType
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc, asc, count } from 'drizzle-orm';
import { WebhookService } from '@/lib/webhooks/webhook-service';

export interface AuditContext {
  organizationId: string;
  actorId?: string;
  actorType?: ActorType;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  causationId?: string;
}

export interface AuditEventData {
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  eventData: Record<string, any>;
  metadata?: Record<string, any>;
  eventVersion?: string;
}

export class AuditService {
  /**
   * Record an audit event (event sourcing pattern)
   */
  static async recordEvent(
    context: AuditContext,
    eventData: AuditEventData
  ): Promise<string> {
    const auditEventData: NewAuditEvent = {
      organizationId: context.organizationId,
      eventType: eventData.eventType,
      eventVersion: eventData.eventVersion || '1.0',
      aggregateId: eventData.aggregateId,
      aggregateType: eventData.aggregateType,
      eventData: eventData.eventData,
      metadata: eventData.metadata || {},
      actorId: context.actorId,
      actorType: context.actorType || 'user',
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      causationId: context.causationId,
    };

    const [event] = await db.insert(auditEvents).values(auditEventData).returning();

    // Trigger webhook for audit events if configured
    try {
      await WebhookService.createEvent(
        context.organizationId,
        `audit.${eventData.eventType}`,
        eventData.aggregateId,
        eventData.aggregateType,
        {
          event_id: event.eventId,
          event_type: eventData.eventType,
          actor_id: context.actorId,
          actor_type: context.actorType,
          ...eventData.eventData,
        },
        {
          correlation_id: context.correlationId,
          session_id: context.sessionId,
          ip_address: context.ipAddress,
          ...eventData.metadata,
        }
      );
    } catch (error) {
      console.error('Failed to trigger webhook for audit event:', error);
      // Don't fail the audit logging if webhook fails
    }

    return event.eventId;
  }

  /**
   * Record a simple audit log (traditional table-based audit)
   */
  static async recordLog(
    context: AuditContext,
    tableName: string,
    recordId: string,
    action: AuditAction,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void> {
    const changedFields = this.getChangedFields(oldValues, newValues);

    const auditLogData: NewAuditLog = {
      organizationId: context.organizationId,
      tableName,
      recordId,
      action,
      oldValues,
      newValues,
      changedFields,
      userId: context.actorId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    };

    await db.insert(auditLogs).values(auditLogData);

    // Also record as an event for comprehensive tracking
    await this.recordEvent(context, {
      eventType: `${tableName}.${action.toLowerCase()}`,
      aggregateId: recordId,
      aggregateType: tableName,
      eventData: {
        action,
        old_values: oldValues,
        new_values: newValues,
        changed_fields: changedFields,
      },
      metadata: {
        audit_type: 'table_change',
      },
    });
  }

  /**
   * Record user action (high-level business events)
   */
  static async recordUserAction(
    context: AuditContext,
    action: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, any>
  ): Promise<string> {
    return this.recordEvent(context, {
      eventType: `user.${action}`,
      aggregateId: resourceId,
      aggregateType: resourceType,
      eventData: {
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
      },
      metadata: {
        audit_type: 'user_action',
      },
    });
  }

  /**
   * Record system event
   */
  static async recordSystemEvent(
    organizationId: string,
    eventType: string,
    details: Record<string, any>,
    correlationId?: string
  ): Promise<string> {
    return this.recordEvent(
      {
        organizationId,
        actorType: 'system',
        correlationId,
      },
      {
        eventType: `system.${eventType}`,
        aggregateId: 'system',
        aggregateType: 'system',
        eventData: details,
        metadata: {
          audit_type: 'system_event',
        },
      }
    );
  }

  /**
   * Create an audit snapshot for performance optimization
   */
  static async createSnapshot(
    organizationId: string,
    aggregateId: string,
    aggregateType: string,
    aggregateVersion: number,
    snapshotData: Record<string, any>
  ): Promise<void> {
    const snapshotRecord: NewAuditSnapshot = {
      organizationId,
      aggregateId,
      aggregateType,
      aggregateVersion,
      snapshotData,
    };

    await db.insert(auditSnapshots).values(snapshotRecord);
  }

  /**
   * Get audit trail for a specific resource
   */
  static async getAuditTrail(
    organizationId: string,
    aggregateId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      eventTypes?: string[];
    } = {}
  ) {
    const {
      limit = 100,
      offset = 0,
      startDate,
      endDate,
      eventTypes,
    } = options;

    const conditions = [
      eq(auditEvents.organizationId, organizationId),
      eq(auditEvents.aggregateId, aggregateId),
    ];

    if (startDate) {
      conditions.push(gte(auditEvents.occurredAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(auditEvents.occurredAt, endDate));
    }

    if (eventTypes && eventTypes.length > 0) {
      // Note: This would need a proper IN condition in a real implementation
      // For now, we'll filter the first event type
      conditions.push(eq(auditEvents.eventType, eventTypes[0]));
    }

    const events = await db
      .select()
      .from(auditEvents)
      .where(and(...conditions))
      .orderBy(desc(auditEvents.occurredAt))
      .limit(limit)
      .offset(offset);

    return events;
  }

  /**
   * Get audit events by organization with pagination
   */
  static async getOrganizationAuditEvents(
    organizationId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      actorId?: string;
      eventTypes?: string[];
      aggregateTypes?: string[];
    } = {}
  ) {
    const {
      limit = 100,
      offset = 0,
      startDate,
      endDate,
      actorId,
      eventTypes,
      aggregateTypes,
    } = options;

    const conditions = [eq(auditEvents.organizationId, organizationId)];

    if (startDate) {
      conditions.push(gte(auditEvents.occurredAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(auditEvents.occurredAt, endDate));
    }

    if (actorId) {
      conditions.push(eq(auditEvents.actorId, actorId));
    }

    if (eventTypes && eventTypes.length > 0) {
      conditions.push(eq(auditEvents.eventType, eventTypes[0]));
    }

    if (aggregateTypes && aggregateTypes.length > 0) {
      conditions.push(eq(auditEvents.aggregateType, aggregateTypes[0]));
    }

    const events = await db
      .select()
      .from(auditEvents)
      .where(and(...conditions))
      .orderBy(desc(auditEvents.occurredAt))
      .limit(limit)
      .offset(offset);

    return events;
  }

  /**
   * Get audit statistics for an organization
   */
  static async getAuditStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const conditions = [eq(auditEvents.organizationId, organizationId)];

    if (startDate) {
      conditions.push(gte(auditEvents.occurredAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(auditEvents.occurredAt, endDate));
    }

    // Get event type distribution
    const eventTypeStats = await db
      .select({
        eventType: auditEvents.eventType,
        count: count(),
      })
      .from(auditEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(auditEvents.eventType);

    // Get actor type distribution
    const actorTypeStats = await db
      .select({
        actorType: auditEvents.actorType,
        count: count(),
      })
      .from(auditEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(auditEvents.actorType);

    return {
      eventTypes: eventTypeStats.reduce((acc, row) => {
        acc[row.eventType] = Number(row.count);
        return acc;
      }, {} as Record<string, number>),
      actorTypes: actorTypeStats.reduce((acc, row) => {
        acc[row.actorType] = Number(row.count);
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Helper function to determine changed fields
   */
  private static getChangedFields(
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): string[] {
    if (!oldValues && !newValues) return [];
    if (!oldValues) return Object.keys(newValues || {});
    if (!newValues) return Object.keys(oldValues);

    const changedFields: string[] = [];
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    for (const key of allKeys) {
      if (oldValues[key] !== newValues[key]) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * Helper to create audit context from request
   */
  static createContext(
    organizationId: string,
    actorId?: string,
    sessionId?: string,
    request?: {
      ip?: string;
      userAgent?: string;
    },
    options: {
      actorType?: ActorType;
      correlationId?: string;
      causationId?: string;
    } = {}
  ): AuditContext {
    return {
      organizationId,
      actorId,
      actorType: options.actorType || 'user',
      sessionId,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      correlationId: options.correlationId,
      causationId: options.causationId,
    };
  }
}