import { db } from '@/lib/db';
import {
  apiKeys,
  apiUsage,
  rateLimits,
  type ApiKey,
  type NewApiKey,
  type ApiKeyScope,
  type ApiKeyEnvironment,
} from '@/lib/db/schema';
import { eq, and, desc, gte, lte, sql, count } from 'drizzle-orm';
import { ApiKeyManager, type GeneratedApiKey } from './security';
import { AuditService } from '@/lib/audit/audit-service';

export interface CreateApiKeyData {
  name: string;
  description?: string;
  scopes: string[];
  environment?: ApiKeyEnvironment;
  rateLimitRpm?: number;
  rateLimitRpd?: number;
  expiresAt?: Date;
  ipWhitelist?: string[];
  metadata?: Record<string, any>;
}

export interface ApiKeyFilters {
  environment?: ApiKeyEnvironment;
  isActive?: boolean;
  scopes?: ApiKeyScope[];
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface ApiKeyWithStats extends ApiKey {
  stats: {
    totalRequests: number;
    last30DaysRequests: number;
    errorRate: number;
  };
}

export class ApiKeyService {
  /**
   * Create a new API key
   */
  static async createApiKey(
    organizationId: string,
    userId: string,
    data: CreateApiKeyData,
    auditContext?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ apiKey: ApiKey; rawKey: string }> {
    // Generate secure API key
    const generated: GeneratedApiKey = ApiKeyManager.generateApiKey();

    // Prepare API key data
    const apiKeyData: NewApiKey = {
      organizationId,
      userId,
      keyId: generated.keyId,
      keyHash: generated.keyHash,
      name: data.name,
      description: data.description || null,
      scopes: data.scopes,
      environment: data.environment || 'production',
      rateLimitRpm: data.rateLimitRpm || 1000,
      rateLimitRpd: data.rateLimitRpd || 10000,
      expiresAt: data.expiresAt || null,
      ipWhitelist: data.ipWhitelist || null,
      metadata: data.metadata || {},
      isActive: true,
    };

    // Insert API key
    const [apiKey] = await db.insert(apiKeys).values(apiKeyData).returning();

    // Log audit event
    await AuditService.recordEvent(
      {
        organizationId,
        actorId: userId,
        actorType: 'user',
        ipAddress: auditContext?.ipAddress,
        userAgent: auditContext?.userAgent,
      },
      {
        eventType: 'api_key.created',
        aggregateId: apiKey.id,
        aggregateType: 'api_key',
        eventData: {
          name: data.name,
          keyId: generated.keyId,
          scopes: data.scopes,
          environment: data.environment,
        },
        metadata: {
          description: `API key "${data.name}" created`,
          severity: 'medium',
        },
      }
    );

    return {
      apiKey,
      rawKey: generated.rawKey,
    };
  }

  /**
   * Get API keys for an organization with optional filtering
   */
  static async getApiKeys(
    organizationId: string,
    filters: ApiKeyFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<{
    apiKeys: ApiKey[];
    total: number;
    pagination: { page: number; limit: number; hasMore: boolean };
  }> {
    const conditions = [eq(apiKeys.organizationId, organizationId)];

    // Apply filters
    if (filters.environment) {
      conditions.push(eq(apiKeys.environment, filters.environment));
    }

    if (filters.isActive !== undefined) {
      conditions.push(eq(apiKeys.isActive, filters.isActive));
    }

    if (filters.search) {
      conditions.push(
        sql`(${apiKeys.name} ILIKE ${`%${filters.search}%`} OR ${apiKeys.description} ILIKE ${`%${filters.search}%`})`
      );
    }

    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(apiKeys)
      .where(and(...conditions));

    // Get paginated results
    const offset = (pagination.page - 1) * pagination.limit;
    const results = await db
      .select()
      .from(apiKeys)
      .where(and(...conditions))
      .orderBy(desc(apiKeys.createdAt))
      .limit(pagination.limit)
      .offset(offset);

    return {
      apiKeys: results,
      total: totalCount,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        hasMore: offset + results.length < totalCount,
      },
    };
  }

  /**
   * Get a single API key by ID
   */
  static async getApiKeyById(organizationId: string, apiKeyId: string): Promise<ApiKey | null> {
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.organizationId, organizationId)))
      .limit(1);

    return apiKey || null;
  }

  /**
   * Get API key by key hash (for authentication)
   */
  static async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash)).limit(1);

    return apiKey || null;
  }

  /**
   * Update an API key
   */
  static async updateApiKey(
    organizationId: string,
    apiKeyId: string,
    userId: string,
    updates: Partial<
      Pick<
        ApiKey,
        | 'name'
        | 'description'
        | 'scopes'
        | 'rateLimitRpm'
        | 'rateLimitRpd'
        | 'expiresAt'
        | 'ipWhitelist'
        | 'isActive'
        | 'metadata'
      >
    >,
    auditContext?: { ipAddress?: string; userAgent?: string }
  ): Promise<ApiKey | null> {
    // Get existing API key
    const existingApiKey = await this.getApiKeyById(organizationId, apiKeyId);
    if (!existingApiKey) return null;

    // Update API key
    const [updatedApiKey] = await db
      .update(apiKeys)
      .set({
        ...updates,
        // Always update the timestamp when making changes
        ...(Object.keys(updates).length > 0 && { lastUsedAt: new Date() }),
      })
      .where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.organizationId, organizationId)))
      .returning();

    if (!updatedApiKey) return null;

    // Log audit event
    const changedFields = Object.keys(updates).filter(
      (key) => updates[key as keyof typeof updates] !== existingApiKey[key as keyof ApiKey]
    );

    if (changedFields.length > 0) {
      await AuditService.recordEvent(
        {
          organizationId,
          actorId: userId,
          actorType: 'user',
          ipAddress: auditContext?.ipAddress,
          userAgent: auditContext?.userAgent,
        },
        {
          eventType: 'api_key.updated',
          aggregateId: apiKeyId,
          aggregateType: 'api_key',
          eventData: {
            changedFields,
            oldValues: Object.fromEntries(
              changedFields.map((field) => [field, existingApiKey[field as keyof ApiKey]])
            ),
            newValues: Object.fromEntries(
              changedFields.map((field) => [field, updates[field as keyof typeof updates]])
            ),
          },
          metadata: {
            description: `API key "${existingApiKey.name}" updated`,
            severity: 'medium',
          },
        }
      );
    }

    return updatedApiKey;
  }

  /**
   * Delete an API key
   */
  static async deleteApiKey(
    organizationId: string,
    apiKeyId: string,
    userId: string,
    auditContext?: { ipAddress?: string; userAgent?: string }
  ): Promise<boolean> {
    // Get existing API key for audit log
    const existingApiKey = await this.getApiKeyById(organizationId, apiKeyId);
    if (!existingApiKey) return false;

    // Delete API key
    const result = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.organizationId, organizationId)));

    if (result.rowCount === 0) return false;

    // Log audit event
    await AuditService.recordEvent(
      {
        organizationId,
        actorId: userId,
        actorType: 'user',
        ipAddress: auditContext?.ipAddress,
        userAgent: auditContext?.userAgent,
      },
      {
        eventType: 'api_key.deleted',
        aggregateId: apiKeyId,
        aggregateType: 'api_key',
        eventData: {
          deletedApiKey: {
            name: existingApiKey.name,
            keyId: existingApiKey.keyId,
            scopes: existingApiKey.scopes,
            environment: existingApiKey.environment,
          },
        },
        metadata: {
          description: `API key "${existingApiKey.name}" deleted`,
          severity: 'high',
        },
      }
    );

    return true;
  }

  /**
   * Regenerate an API key (create new key with same settings)
   */
  static async regenerateApiKey(
    organizationId: string,
    apiKeyId: string,
    userId: string,
    auditContext?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ apiKey: ApiKey; rawKey: string } | null> {
    // Get existing API key
    const existingApiKey = await this.getApiKeyById(organizationId, apiKeyId);
    if (!existingApiKey) return null;

    // Generate new key
    const generated: GeneratedApiKey = ApiKeyManager.generateApiKey();

    // Update with new key data
    const [updatedApiKey] = await db
      .update(apiKeys)
      .set({
        keyId: generated.keyId,
        keyHash: generated.keyHash,
        lastUsedAt: null, // Reset usage timestamp
      })
      .where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.organizationId, organizationId)))
      .returning();

    if (!updatedApiKey) return null;

    // Log audit event
    await AuditService.recordEvent(
      {
        organizationId,
        actorId: userId,
        actorType: 'user',
        ipAddress: auditContext?.ipAddress,
        userAgent: auditContext?.userAgent,
      },
      {
        eventType: 'api_key.regenerated',
        aggregateId: apiKeyId,
        aggregateType: 'api_key',
        eventData: {
          oldKeyId: existingApiKey.keyId,
          newKeyId: generated.keyId,
        },
        metadata: {
          description: `API key "${existingApiKey.name}" regenerated`,
          severity: 'high',
        },
      }
    );

    return {
      apiKey: updatedApiKey,
      rawKey: generated.rawKey,
    };
  }

  /**
   * Get API key usage statistics
   */
  static async getApiKeyStats(
    organizationId: string,
    apiKeyId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    errorRequests: number;
    avgResponseTime: number;
    totalBytesTransferred: number;
    uniqueEndpoints: number;
    requestsByDay: Array<{ date: string; requests: number; errors: number }>;
  }> {
    // Get overall stats
    const [stats] = await db
      .select({
        totalRequests: sql<number>`count(*)::int`,
        successfulRequests: sql<number>`count(*) filter (where status_code < 400)::int`,
        errorRequests: sql<number>`count(*) filter (where status_code >= 400)::int`,
        avgResponseTime: sql<number>`coalesce(avg(response_time), 0)::int`,
        totalBytesTransferred: sql<number>`coalesce(sum(bytes_transferred), 0)::int`,
        uniqueEndpoints: sql<number>`count(distinct endpoint)::int`,
      })
      .from(apiUsage)
      .where(
        and(
          eq(apiUsage.apiKeyId, apiKeyId),
          eq(apiUsage.organizationId, organizationId),
          gte(apiUsage.timestamp, timeRange.start),
          lte(apiUsage.timestamp, timeRange.end)
        )
      );

    // Get daily breakdown
    const dailyStats = await db
      .select({
        date: sql<string>`date_trunc('day', timestamp)::date::text`,
        requests: sql<number>`count(*)::int`,
        errors: sql<number>`count(*) filter (where status_code >= 400)::int`,
      })
      .from(apiUsage)
      .where(
        and(
          eq(apiUsage.apiKeyId, apiKeyId),
          eq(apiUsage.organizationId, organizationId),
          gte(apiUsage.timestamp, timeRange.start),
          lte(apiUsage.timestamp, timeRange.end)
        )
      )
      .groupBy(sql`date_trunc('day', timestamp)`)
      .orderBy(sql`date_trunc('day', timestamp)`);

    return {
      totalRequests: stats?.totalRequests || 0,
      successfulRequests: stats?.successfulRequests || 0,
      errorRequests: stats?.errorRequests || 0,
      avgResponseTime: stats?.avgResponseTime || 0,
      totalBytesTransferred: stats?.totalBytesTransferred || 0,
      uniqueEndpoints: stats?.uniqueEndpoints || 0,
      requestsByDay: dailyStats || [],
    };
  }

  /**
   * Verify API key and return key data if valid
   */
  static async verifyApiKey(rawKey: string, clientIp?: string): Promise<ApiKey | null> {
    // Validate key format
    if (!ApiKeyManager.validateKeyFormat(rawKey)) {
      return null;
    }

    // Hash the key for lookup
    const keyHash = ApiKeyManager.hashApiKey(rawKey);

    // Get API key
    const apiKey = await this.getApiKeyByHash(keyHash);
    if (!apiKey) return null;

    // Check if key is active
    if (!apiKey.isActive) return null;

    // Check if key is expired
    if (ApiKeyManager.isExpired(apiKey.expiresAt)) return null;

    // Check IP whitelist
    if (clientIp && !ApiKeyManager.validateIpAccess(clientIp, apiKey.ipWhitelist)) {
      return null;
    }

    return apiKey;
  }
}
