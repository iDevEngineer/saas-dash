export interface EmailData {
  to: string | string[];
  subject: string;
  template?: EmailTemplate;
  templateData?: Record<string, unknown>;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  priority?: 'low' | 'normal' | 'high';
  sendAt?: Date;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  timestamp: Date;
}

export interface EmailProvider {
  name: string;
  send(emailData: EmailData): Promise<EmailResult>;
  validateConfig(): Promise<boolean>;
}

export interface EmailConfig {
  providers: {
    resend?: {
      apiKey: string;
      fromEmail: string;
    };
    sendgrid?: {
      apiKey: string;
      fromEmail: string;
    };
  };
  defaultProvider: string;
  fallbackProviders: string[];
  retryAttempts: number;
  timeout: number;
}

export type EmailTemplate =
  | 'welcome'
  | 'email-verification'
  | 'password-reset'
  | 'password-reset-success'
  | 'magic-link';

export interface EmailTemplateData {
  welcome: {
    firstName: string;
    email: string;
  };
  'email-verification': {
    firstName: string;
    verificationUrl: string;
    expiresIn?: string;
  };
  'password-reset': {
    firstName: string;
    resetUrl: string;
    expiresIn?: string;
  };
  'password-reset-success': {
    firstName: string;
    email: string;
  };
  'magic-link': {
    firstName: string;
    loginUrl: string;
    expiresIn?: string;
  };
}

export interface EmailStats {
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
  lastSent?: Date;
}
