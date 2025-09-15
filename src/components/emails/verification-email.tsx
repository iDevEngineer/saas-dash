import { Text, Button, Section } from '@react-email/components';
import { EmailLayout } from './email-layout';
import type { EmailTemplateData } from '@/lib/email/types';

interface VerificationEmailProps {
  data: EmailTemplateData['email-verification'];
}

export function VerificationEmail({ data }: VerificationEmailProps) {
  const expiresIn = data.expiresIn || '24 hours';

  return (
    <EmailLayout title="Verify Your Email Address">
      <Section>
        <Text style={heading}>Verify Your Email Address</Text>

        <Text style={paragraph}>Hi {data.firstName},</Text>

        <Text style={paragraph}>
          Thanks for signing up for SaaS Dash! To complete your account setup, please verify your
          email address by clicking the button below.
        </Text>

        <Section style={buttonContainer}>
          <Button href={data.verificationUrl} style={button}>
            Verify Email Address
          </Button>
        </Section>

        <Text style={paragraph}>
          If the button above doesn't work, you can also verify your email by copying and pasting
          the following link into your browser:
        </Text>

        <Text style={urlText}>{data.verificationUrl}</Text>

        <Text style={warningText}>
          ⚠️ This verification link will expire in {expiresIn}. If you don't verify your email
          within this time, you'll need to request a new verification link.
        </Text>

        <Text style={paragraph}>
          If you didn't create an account with SaaS Dash, you can safely ignore this email.
        </Text>

        <Text style={signature}>
          Best regards,
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
  backgroundColor: '#10b981',
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

const signature = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '32px 0 0 0',
};
