import { db } from '@/lib/db';
import { emailSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface EmailSettingsData {
  fromEmail: string;
  provider: string;
  isActive: boolean;
}

let cachedSettings: EmailSettingsData | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getEmailSettings(): Promise<EmailSettingsData> {
  const now = Date.now();

  // Return cached settings if they're still fresh
  if (cachedSettings && now - lastCacheTime < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const settings = await db
      .select()
      .from(emailSettings)
      .where(eq(emailSettings.id, 'default'))
      .limit(1);

    if (settings.length === 0) {
      // Create default settings if none exist
      const defaultSettings = await db
        .insert(emailSettings)
        .values({
          id: 'default',
          fromEmail: process.env.EMAIL_FROM || 'noreply@example.com',
          provider: process.env.EMAIL_PROVIDER || 'resend',
          isActive: true,
        })
        .returning();

      cachedSettings = {
        fromEmail: defaultSettings[0].fromEmail,
        provider: defaultSettings[0].provider,
        isActive: defaultSettings[0].isActive,
      };
    } else {
      cachedSettings = {
        fromEmail: settings[0].fromEmail,
        provider: settings[0].provider,
        isActive: settings[0].isActive,
      };
    }

    lastCacheTime = now;
    return cachedSettings;
  } catch (error) {
    console.error('Failed to fetch email settings from database:', error);
    // Fallback to environment variables if database fails
    return {
      fromEmail: process.env.EMAIL_FROM || 'noreply@example.com',
      provider: process.env.EMAIL_PROVIDER || 'resend',
      isActive: true,
    };
  }
}

export function clearEmailSettingsCache(): void {
  cachedSettings = null;
  lastCacheTime = 0;
}
