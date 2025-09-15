import { Text, Button, Section } from '@react-email/components';
import { EmailLayout } from './email-layout';
import type { EmailTemplateData } from '@/lib/email/types';

interface PasswordResetSuccessEmailProps {
  data: EmailTemplateData['password-reset-success'];
}

export function PasswordResetSuccessEmail({ data }: PasswordResetSuccessEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <EmailLayout title="Password Reset Successful">
      <Section>
        <Text style={heading}>Password Reset Successful ✅</Text>

        <Text style={paragraph}>Hi {data.firstName},</Text>

        <Text style={paragraph}>
          This email confirms that your password for your SaaS Dash account ({data.email}) has been
          successfully reset.
        </Text>

        <Text style={successText}>
          🎉 Your password has been updated and your account is secure.
        </Text>

        <Section style={buttonContainer}>
          <Button href={`${baseUrl}/dashboard`} style={button}>
            Go to Dashboard
          </Button>
        </Section>

        <Text style={securityText}>
          🔒 <strong>Security Reminder:</strong> If you didn't make this change, please contact our
          support team immediately. Your account security is important to us.
        </Text>

        <Text style={paragraph}>
          For your security, here are some best practices for password management:
        </Text>

        <Text style={list}>
          • Use a unique password that you don't use for other accounts
          <br />
          • Consider using a password manager to generate and store strong passwords
          <br />
          • Enable two-factor authentication when available
          <br />• Regularly update your passwords, especially for important accounts
        </Text>

        <Text style={paragraph}>
          If you have any questions or concerns about your account security, please don't hesitate
          to contact our support team.
        </Text>

        <Text style={signature}>
          Stay secure!
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
  backgroundColor: '#3b82f6',
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

const successText = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#059669',
  backgroundColor: '#d1fae5',
  border: '1px solid #10b981',
  borderRadius: '4px',
  padding: '16px',
  margin: '24px 0',
  textAlign: 'center' as const,
  fontWeight: '600',
};

const securityText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#dc2626',
  backgroundColor: '#fee2e2',
  border: '1px solid #ef4444',
  borderRadius: '4px',
  padding: '12px',
  margin: '24px 0',
};

const list = {
  fontSize: '16px',
  lineHeight: '1.8',
  color: '#374151',
  margin: '16px 0',
  paddingLeft: '16px',
};

const signature = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '32px 0 0 0',
};
