import type {
  EmailProvider,
  EmailData,
  EmailResult,
  EmailTemplate,
  EmailTemplateData,
} from './types';
import { getEmailConfig, emailConfig as legacyConfig } from './config';
import { ResendProvider } from './providers/resend';

export class EmailService {
  private providers = new Map<string, EmailProvider>();
  private isInitialized = false;
  private currentConfig: Awaited<ReturnType<typeof getEmailConfig>> | typeof legacyConfig | null =
    null;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Initialize with legacy config first for immediate availability
    this.initializeLegacy();
    // Database initialization will be deferred until first use
    this.initializationPromise = null;
  }

  private async initialize() {
    try {
      console.log('🔄 Email service: Starting database configuration initialization...');

      // Use database-driven configuration
      this.currentConfig = await getEmailConfig();
      console.log('✅ Email service loaded database configuration:', {
        defaultProvider: this.currentConfig.defaultProvider,
        fromEmail: this.currentConfig.providers.resend?.fromEmail,
      });

      // Initialize available providers
      if (this.currentConfig.providers.resend?.apiKey) {
        this.providers.set(
          'resend',
          new ResendProvider({
            apiKey: this.currentConfig.providers.resend.apiKey,
            fromEmail: this.currentConfig.providers.resend.fromEmail,
          })
        );
        console.log('✅ Resend provider initialized with database config');
      }

      this.isInitialized = true;
      console.log(
        '✅ Email service initialized with database provider:',
        this.currentConfig.defaultProvider
      );
    } catch (error) {
      console.error('❌ Failed to initialize email providers with database config:', error);
      console.error('❌ Error details:', error);
      // Fall back to legacy configuration
      console.log('⚠️ Falling back to legacy configuration');
      this.initializeLegacy();
    }
  }

  private initializeLegacy() {
    try {
      console.log('🔧 Email service: Initializing with legacy configuration...');
      console.log('Legacy config fromEmail:', legacyConfig.providers.resend?.fromEmail);

      if (legacyConfig.providers.resend?.apiKey) {
        this.providers.set('resend', new ResendProvider());
      }
      this.currentConfig = legacyConfig;
      this.isInitialized = true;
      console.log(
        '✅ Email service initialized with legacy provider:',
        legacyConfig.defaultProvider
      );
    } catch (error) {
      console.error('❌ Failed to initialize legacy email configuration:', error);
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized && this.currentConfig === legacyConfig) {
      // Start database initialization on first use
      if (!this.initializationPromise) {
        this.initializationPromise = this.initialize();
      }
      await this.initializationPromise;
    }
  }

  private async getProvider(providerName?: string): Promise<EmailProvider | null> {
    await this.ensureInitialized();

    if (!this.isInitialized) {
      console.error('Email service not properly initialized');
      return null;
    }

    // Refresh config if using database settings
    if (!providerName && this.currentConfig !== legacyConfig) {
      try {
        this.currentConfig = await getEmailConfig();
      } catch (error) {
        console.warn('Failed to refresh email config, using cached version:', error);
      }
    }

    const targetProvider = providerName || this.currentConfig?.defaultProvider || 'resend';
    const provider = this.providers.get(targetProvider);

    if (!provider) {
      console.error(`Email provider '${targetProvider}' not found or not configured`);
      return null;
    }

    return provider;
  }

  async send<T extends EmailTemplate>(
    emailData: EmailData & {
      template?: T;
      templateData?: EmailTemplateData[T];
    }
  ): Promise<EmailResult> {
    const provider = await this.getProvider();
    if (!provider) {
      return {
        success: false,
        error: 'No email provider available',
        provider: 'none',
        timestamp: new Date(),
      };
    }

    return this.sendWithRetry(provider, emailData);
  }

  private async sendWithRetry(
    provider: EmailProvider,
    emailData: EmailData,
    attempt = 1
  ): Promise<EmailResult> {
    try {
      const result = await provider.send(emailData);

      if (!result.success && attempt < (this.currentConfig?.retryAttempts || 3)) {
        console.log(
          `Email send failed, retrying (${attempt}/${this.currentConfig?.retryAttempts || 3})...`
        );

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        return this.sendWithRetry(provider, emailData, attempt + 1);
      }

      return result;
    } catch (error) {
      if (attempt < (this.currentConfig?.retryAttempts || 3)) {
        console.log(
          `Email send error, retrying (${attempt}/${this.currentConfig?.retryAttempts || 3})...`
        );

        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        return this.sendWithRetry(provider, emailData, attempt + 1);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        provider: provider.name,
        timestamp: new Date(),
      };
    }
  }

  async sendWelcomeEmail(to: string, data: EmailTemplateData['welcome']): Promise<EmailResult> {
    return this.send({
      to,
      subject: 'Welcome to SaaS Dash!',
      template: 'welcome',
      templateData: data,
    });
  }

  async sendVerificationEmail(
    to: string,
    data: EmailTemplateData['email-verification']
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject: 'Verify your email address',
      template: 'email-verification',
      templateData: data,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    data: EmailTemplateData['password-reset']
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject: 'Reset your password',
      template: 'password-reset',
      templateData: data,
    });
  }

  async sendPasswordResetSuccessEmail(
    to: string,
    data: EmailTemplateData['password-reset-success']
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject: 'Password reset successful',
      template: 'password-reset-success',
      templateData: data,
    });
  }

  async sendMagicLinkEmail(
    to: string,
    data: EmailTemplateData['magic-link']
  ): Promise<EmailResult> {
    return this.send({
      to,
      subject: 'Your magic login link',
      template: 'magic-link',
      templateData: data,
    });
  }

  // Health check method
  async healthCheck(): Promise<{ isHealthy: boolean; providers: Record<string, boolean> }> {
    try {
      await this.ensureInitialized();
    } catch (error) {
      console.warn('Health check: Database initialization failed, using legacy config:', error);
    }

    const providerHealth: Record<string, boolean> = {};

    for (const [name, provider] of this.providers.entries()) {
      try {
        providerHealth[name] = await provider.validateConfig();
      } catch {
        providerHealth[name] = false;
      }
    }

    const isHealthy = Object.values(providerHealth).some(Boolean);

    return {
      isHealthy,
      providers: providerHealth,
    };
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Export a singleton instance
export const emailService = new EmailService();
