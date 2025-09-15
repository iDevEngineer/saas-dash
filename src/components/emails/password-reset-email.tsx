import { Text, Button, Section } from '@react-email/components';
import { EmailLayout } from './email-layout';
import type { EmailTemplateData } from '@/lib/email/types';

interface PasswordResetEmailProps {
  data: EmailTemplateData['password-reset'];
}

export function PasswordResetEmail({ data }: PasswordResetEmailProps) {
  const expiresIn = data.expiresIn || '1 hour';

  return (
    <EmailLayout title="Reset Your Password">
      <Section>
        <Text style={heading}>Reset Your Password</Text>

        <Text style={paragraph}>Hi {data.firstName},</Text>

        <Text style={paragraph}>
          We received a request to reset the password for your SaaS Dash account. If you made this
          request, click the button below to reset your password.
        </Text>

        <Section style={buttonContainer}>
          <Button href={data.resetUrl} style={button}>
            Reset Password
          </Button>
        </Section>

        <Text style={paragraph}>
          If the button above doesn't work, you can also reset your password by copying and pasting
          the following link into your browser:
        </Text>

        <Text style={urlText}>{data.resetUrl}</Text>

        <Text style={warningText}>
          ⚠️ This password reset link will expire in {expiresIn}. If you don't reset your password
          within this time, you'll need to request a new password reset.
        </Text>

        <Text style={securityText}>
          🔒 <strong>Security Notice:</strong> If you didn't request a password reset, please ignore
          this email. Your password will remain unchanged, and your account is secure.
        </Text>

        <Text style={paragraph}>
          For your security, this link can only be used once. After you reset your password, this
          link will no longer be valid.
        </Text>

        <Text style={signature}>
          If you need help, contact our support team.
          <br />
          The SaaS Dash Team
        </Text>
      </Section>
    </EmailLayout>
  );
}

// Styles
const heading = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#ef4444',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1',
  padding: '16px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

const urlText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#6b7280',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '4px',
  padding: '12px',
  margin: '16px 0',
  wordBreak: 'break-all' as const,
  fontFamily: 'monospace',
};

const warningText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#d97706',
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '4px',
  padding: '12px',
  margin: '24px 0',
};

const securityText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#059669',
  backgroundColor: '#d1fae5',
  border: '1px solid #10b981',
  borderRadius: '4px',
  padding: '12px',
  margin: '24px 0',
};

const signature = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '32px 0 0 0',
};
