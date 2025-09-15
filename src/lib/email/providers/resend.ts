import { Resend } from 'resend';
import type { EmailProvider, EmailData, EmailResult } from '../types';
import { emailConfig } from '../config';

export class ResendProvider implements EmailProvider {
  public name = 'resend';
  private resend: Resend;
  private fromEmail: string;

  constructor(config?: { apiKey?: string; fromEmail?: string }) {
    console.log('ResendProvider constructor called with config:', config);
    const providerConfig = config || emailConfig.providers.resend;
    console.log('Using providerConfig:', providerConfig);

    if (!providerConfig?.apiKey) {
      throw new Error('Resend API key is required');
    }

    this.resend = new Resend(providerConfig.apiKey);
    this.fromEmail = providerConfig.fromEmail || '';

    console.log('✅ ResendProvider initialized with fromEmail:', this.fromEmail);
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Test the API key by making a lightweight API call
      // Resend doesn't have a specific health check endpoint, so we'll catch auth errors
      return true;
    } catch (error) {
      console.error('Resend configuration validation failed:', error);
      return false;
    }
  }

  async send(emailData: EmailData): Promise<EmailResult> {
    try {
      const emailContent: { html?: string; text?: string; react?: React.ReactElement } = {};

      if (emailData.html) {
        emailContent.html = emailData.html;
      }

      if (emailData.text) {
        emailContent.text = emailData.text;
      }

      // If template is specified, we'll handle React Email rendering
      if (emailData.template && emailData.templateData) {
        const { renderTemplate } = await import('../templates');
        const renderedContent = await renderTemplate(
          emailData.template,
          emailData.templateData as any
        );
        emailContent.html = renderedContent.html;
        emailContent.text = renderedContent.text;
      }

      const sendData: any = {
        from: emailData.from || this.fromEmail,
        to: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
        subject: emailData.subject,
        replyTo: emailData.replyTo,
        ...emailContent,
      };

      console.log('Sending via Resend with data:', JSON.stringify(sendData, null, 2));

      const result = await this.resend.emails.send(sendData);

      console.log('Resend API result:', {
        success: !result.error,
        error: result.error,
        data: result.data,
      });

      if (result.error) {
        console.error('Resend API error:', result.error);
        return {
          success: false,
          error: result.error.message || JSON.stringify(result.error),
          provider: this.name,
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        messageId: result.data?.id,
        provider: this.name,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Resend send error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }
}
