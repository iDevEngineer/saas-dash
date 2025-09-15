// Main exports
export { emailService, EmailService } from './service';
export { emailConfig, validateEmailConfig } from './config';
export {
  renderTemplate,
  getAvailableTemplates,
  validateTemplateData,
  previewTemplate,
} from './templates';

// Type exports
export type {
  EmailData,
  EmailResult,
  EmailProvider,
  EmailConfig,
  EmailTemplate,
  EmailTemplateData,
  EmailStats,
} from './types';

// Provider exports
export { ResendProvider } from './providers/resend';
