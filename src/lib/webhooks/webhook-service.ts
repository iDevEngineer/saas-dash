import { db } from '@/lib/db';
import {
  webhookEndpoints,
  webhookEvents,
  webhookDeliveries,
  type NewWebhookEvent,
  type NewWebhookDelivery,
  type WebhookStatus
} from '@/lib/db/schema';
import { eq, and, gte, lte, or, count } from 'drizzle-orm';
import crypto from 'crypto';

export interface WebhookPayload {
  event: {
    id: string;
    type: string;
    version: string;
    occurred_at: string;
    aggregate_id: string;
    aggregate_type: string;
  };
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export class WebhookService {
  /**
   * Create a new webhook event and trigger delivery to all matching endpoints
   */
  static async createEvent(
    organizationId: string,
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    payload: Record<string, any>,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    // Create the webhook event
    const eventData: NewWebhookEvent = {
      organizationId,
      eventType,
      aggregateId,
      aggregateType,
      payload,
      metadata,
    };

    const [event] = await db.insert(webhookEvents).values(eventData).returning();

    // Find all active endpoints that listen for this event type
    const matchingEndpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.organizationId, organizationId),
          eq(webhookEndpoints.isActive, true)
        )
      );

    // Filter endpoints that have this event type in their eventTypes array
    const subscribedEndpoints = matchingEndpoints.filter(endpoint =>
      endpoint.eventTypes.includes(eventType) || endpoint.eventTypes.includes('*')
    );

    // Create delivery records for each matching endpoint
    const deliveryPromises = subscribedEndpoints.map(endpoint =>
      this.scheduleDelivery(endpoint.id, event.id, organizationId)
    );

    await Promise.all(deliveryPromises);

    return event.id;
  }

  /**
   * Schedule a webhook delivery
   */
  private static async scheduleDelivery(
    webhookEndpointId: string,
    webhookEventId: string,
    organizationId: string
  ): Promise<void> {
    const deliveryData: NewWebhookDelivery = {
      webhookEndpointId,
      webhookEventId,
      organizationId,
      status: 'pending',
      attemptNumber: 1,
    };

    await db.insert(webhookDeliveries).values(deliveryData);

    // Trigger async delivery (in a real app, this would go to a queue)
    this.processDelivery(webhookEndpointId, webhookEventId).catch(console.error);
  }

  /**
   * Process a webhook delivery
   */
  static async processDelivery(
    webhookEndpointId: string,
    webhookEventId: string
  ): Promise<void> {
    try {
      // Get endpoint and event data
      const [endpoint] = await db
        .select()
        .from(webhookEndpoints)
        .where(eq(webhookEndpoints.id, webhookEndpointId));

      const [event] = await db
        .select()
        .from(webhookEvents)
        .where(eq(webhookEvents.id, webhookEventId));

      if (!endpoint || !event) {
        throw new Error('Endpoint or event not found');
      }

      // Get the delivery record
      const [delivery] = await db
        .select()
        .from(webhookDeliveries)
        .where(
          and(
            eq(webhookDeliveries.webhookEndpointId, webhookEndpointId),
            eq(webhookDeliveries.webhookEventId, webhookEventId)
          )
        );

      if (!delivery) {
        throw new Error('Delivery record not found');
      }

      // Mark delivery as started
      await db
        .update(webhookDeliveries)
        .set({
          startedAt: new Date(),
        })
        .where(eq(webhookDeliveries.id, delivery.id));

      // Create webhook payload
      const payload: WebhookPayload = {
        event: {
          id: event.id,
          type: event.eventType,
          version: event.eventVersion,
          occurred_at: event.createdAt.toISOString(),
          aggregate_id: event.aggregateId,
          aggregate_type: event.aggregateType,
        },
        data: event.payload,
        metadata: event.metadata || {},
      };

      // Generate signature
      const signature = this.generateSignature(
        JSON.stringify(payload),
        endpoint.secretToken
      );

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'SaaS-Dashboard-Webhooks/1.0',
        'X-Webhook-Signature': signature,
        'X-Webhook-Delivery': delivery.id,
        'X-Webhook-Event-Type': event.eventType,
        'X-Webhook-Event-ID': event.id,
        ...endpoint.headers,
      };

      // Make the HTTP request
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseBody = await response.text();

      // Update delivery record with success
      await db
        .update(webhookDeliveries)
        .set({
          status: 'success' as WebhookStatus,
          httpStatusCode: response.status,
          responseBody: responseBody.slice(0, 10000), // Limit response body size
          responseHeaders: Object.fromEntries(response.headers.entries()),
          completedAt: new Date(),
        })
        .where(eq(webhookDeliveries.id, delivery.id));

    } catch (error) {
      console.error('Webhook delivery failed:', error);
      await this.handleDeliveryFailure(webhookEndpointId, webhookEventId, error);
    }
  }

  /**
   * Handle delivery failure and implement retry logic
   */
  private static async handleDeliveryFailure(
    webhookEndpointId: string,
    webhookEventId: string,
    error: any
  ): Promise<void> {
    const [delivery] = await db
      .select()
      .from(webhookDeliveries)
      .where(
        and(
          eq(webhookDeliveries.webhookEndpointId, webhookEndpointId),
          eq(webhookDeliveries.webhookEventId, webhookEventId)
        )
      );

    if (!delivery) return;

    const [endpoint] = await db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.id, webhookEndpointId));

    if (!endpoint) return;

    const retryPolicy = endpoint.retryPolicy as { maxAttempts: number; backoffFactor: number };
    const maxAttempts = retryPolicy.maxAttempts || 3;
    const backoffFactor = retryPolicy.backoffFactor || 2;

    let status: WebhookStatus = 'failed';
    let nextRetryAt: Date | null = null;

    // Check if we should retry
    if (delivery.attemptNumber < maxAttempts) {
      status = 'retrying';
      // Exponential backoff: wait backoffFactor^attemptNumber minutes
      const delayMinutes = Math.pow(backoffFactor, delivery.attemptNumber);
      nextRetryAt = new Date(Date.now() + delayMinutes * 60000);
    }

    // Update delivery record with failure info
    await db
      .update(webhookDeliveries)
      .set({
        status,
        errorMessage: error.message || 'Unknown error',
        completedAt: status === 'failed' ? new Date() : null,
        nextRetryAt,
      })
      .where(eq(webhookDeliveries.id, delivery.id));

    // If retrying, schedule the retry
    if (status === 'retrying' && nextRetryAt) {
      setTimeout(() => {
        this.retryDelivery(delivery.id).catch(console.error);
      }, nextRetryAt.getTime() - Date.now());
    }
  }

  /**
   * Retry a failed delivery
   */
  static async retryDelivery(deliveryId: string): Promise<void> {
    const [delivery] = await db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.id, deliveryId));

    if (!delivery || delivery.status !== 'retrying') {
      return;
    }

    // Increment attempt number
    await db
      .update(webhookDeliveries)
      .set({
        attemptNumber: delivery.attemptNumber + 1,
        status: 'pending',
        nextRetryAt: null,
      })
      .where(eq(webhookDeliveries.id, deliveryId));

    // Process the delivery again
    await this.processDelivery(delivery.webhookEndpointId, delivery.webhookEventId);
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  private static generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Process pending retries (to be called by a cron job)
   */
  static async processPendingRetries(): Promise<void> {
    const now = new Date();

    const pendingRetries = await db
      .select()
      .from(webhookDeliveries)
      .where(
        and(
          eq(webhookDeliveries.status, 'retrying'),
          lte(webhookDeliveries.nextRetryAt, now)
        )
      );

    const retryPromises = pendingRetries.map(delivery =>
      this.retryDelivery(delivery.id)
    );

    await Promise.allSettled(retryPromises);
  }

  /**
   * Get delivery statistics for an organization
   */
  static async getDeliveryStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const conditions = [eq(webhookDeliveries.organizationId, organizationId)];

    if (startDate) {
      conditions.push(gte(webhookDeliveries.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(webhookDeliveries.createdAt, endDate));
    }

    const deliveries = await db
      .select({
        status: webhookDeliveries.status,
        count: count(),
      })
      .from(webhookDeliveries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(webhookDeliveries.status);

    return deliveries.reduce((acc, row) => {
      acc[row.status as WebhookStatus] = Number(row.count);
      return acc;
    }, {} as Record<WebhookStatus, number>);
  }
}