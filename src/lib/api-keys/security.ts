import crypto from 'crypto';

export interface GeneratedApiKey {
  keyId: string;
  rawKey: string;
  keyHash: string;
}

export class ApiKeyManager {
  private static readonly SALT_ROUNDS = 12;
  private static readonly KEY_PREFIX = 'sk'; // Secret key prefix
  private static readonly KEY_LENGTH = 32;

  /**
   * Generate a new API key with secure random values
   */
  static generateApiKey(): GeneratedApiKey {
    // Generate random key ID and secret
    const keyId = crypto.randomBytes(8).toString('hex');
    const secret = crypto.randomBytes(this.KEY_LENGTH).toString('hex');

    // Full key format: sk_keyId_secret
    const rawKey = `${this.KEY_PREFIX}_${keyId}_${secret}`;

    // Hash the full key for storage
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    return { keyId, rawKey, keyHash };
  }

  /**
   * Hash an API key for storage or verification
   */
  static hashApiKey(rawKey: string): string {
    // For verification, we use SHA-256 hash (faster than bcrypt for API key validation)
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  /**
   * Validate API key format
   */
  static validateKeyFormat(key: string): boolean {
    const keyPattern = new RegExp(`^${this.KEY_PREFIX}_[a-f0-9]{16}_[a-f0-9]{64}$`);
    return keyPattern.test(key);
  }

  /**
   * Extract key ID from raw API key
   */
  static extractKeyId(rawKey: string): string | null {
    if (!this.validateKeyFormat(rawKey)) return null;
    return rawKey.split('_')[1];
  }

  /**
   * Generate a secure random name for API keys
   */
  static generateKeyName(): string {
    const adjectives = ['swift', 'bright', 'clever', 'bold', 'quick', 'smart', 'keen'];
    const nouns = ['falcon', 'tiger', 'phoenix', 'dragon', 'eagle', 'wolf', 'lion'];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999);

    return `${adjective}-${noun}-${number}`;
  }

  /**
   * Validate IP address against whitelist
   */
  static validateIpAccess(clientIp: string, whitelist: string[] | null): boolean {
    if (!whitelist || whitelist.length === 0) {
      return true; // No restrictions
    }

    // Simple IP validation - in production, you might want to use a library like 'ip-range-check'
    return whitelist.some((allowedIp) => {
      // Exact match
      if (allowedIp === clientIp) return true;

      // CIDR notation basic check (simplified)
      if (allowedIp.includes('/')) {
        const [baseIp, maskBits] = allowedIp.split('/');
        // This is a simplified CIDR check - use a proper library in production
        return clientIp.startsWith(
          baseIp
            .split('.')
            .slice(0, parseInt(maskBits) / 8)
            .join('.')
        );
      }

      return false;
    });
  }

  /**
   * Check if API key is expired
   */
  static isExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;
    return new Date() > expiresAt;
  }

  /**
   * Generate secure key ID that doesn't conflict with existing ones
   */
  static generateUniqueKeyId(existingKeyIds: string[]): string {
    let keyId: string;
    do {
      keyId = crypto.randomBytes(8).toString('hex');
    } while (existingKeyIds.includes(keyId));

    return keyId;
  }
}
