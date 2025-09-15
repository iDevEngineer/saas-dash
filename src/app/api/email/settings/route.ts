import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
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

      return NextResponse.json({
        success: true,
        settings: defaultSettings[0],
      });
    }

    return NextResponse.json({
      success: true,
      settings: settings[0],
    });
  } catch (error) {
    console.error('Failed to fetch email settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromEmail, provider, isActive } = body;

    // Validate required fields
    if (!fromEmail || !provider) {
      return NextResponse.json(
        { success: false, error: 'fromEmail and provider are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    // Validate provider
    const validProviders = ['resend', 'sendgrid'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { success: false, error: `Provider must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    // Update or create settings
    const updatedSettings = await db
      .insert(emailSettings)
      .values({
        id: 'default',
        fromEmail,
        provider,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: emailSettings.id,
        set: {
          fromEmail,
          provider,
          isActive: isActive !== undefined ? isActive : true,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({
      success: true,
      settings: updatedSettings[0],
    });
  } catch (error) {
    console.error('Failed to update email settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update email settings' },
      { status: 500 }
    );
  }
}
