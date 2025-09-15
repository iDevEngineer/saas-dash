import { db } from './index';
import { emailSettings } from './schema/email-settings';
import { eq } from 'drizzle-orm';

async function updateEmailSettings() {
  try {
    console.log('Updating email settings to use Resend sandbox domain...');

    // Insert or update the email settings to use the sandbox domain
    await db
      .insert(emailSettings)
      .values({
        id: 'default',
        fromEmail: 'onboarding@resend.dev',
        provider: 'resend',
        isActive: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: emailSettings.id,
        set: {
          fromEmail: 'onboarding@resend.dev',
          provider: 'resend',
          isActive: true,
          updatedAt: new Date(),
        },
      });

    console.log('✅ Email settings updated successfully');

    // Verify the update
    const settings = await db.select().from(emailSettings).where(eq(emailSettings.id, 'default'));
    console.log('Current settings:', settings[0]);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to update email settings:', error);
    process.exit(1);
  }
}

updateEmailSettings();
