import { Text, Button, Section } from '@react-email/components';
import { EmailLayout } from './email-layout';
import type { EmailTemplateData } from '@/lib/email/types';

interface MagicLinkEmailProps {
  data: EmailTemplateData['magic-link'];
}

export function MagicLinkEmail({ data }: MagicLinkEmailProps) {
  const expiresIn = data.expiresIn || '15 minutes';

  return (
    <EmailLayout title="Your Magic Login Link">
      <Section>
        <Text style={heading}>Your Magic Login Link ✨</Text>

        <Text style={paragraph}>Hi {data.firstName},</Text>

        <Text style={paragraph}>
          You requested a magic link to sign in to your SaaS Dash account. Click the button below to
          log in instantly without entering your password.
        </Text>

        <Section style={buttonContainer}>
          <Button href={data.loginUrl} style={button}>
            Sign In to SaaS Dash
          </Button>
        </Section>

        <Text style={paragraph}>
          If the button above doesn't work, you can also sign in by copying and pasting the
          following link into your browser:
        </Text>

        <Text style={urlText}>{data.loginUrl}</Text>

        <Text style={warningText}>
          ⏱️ This magic link will expire in {expiresIn}. If you don't use it within this time,
          you'll need to request a new magic link.
        </Text>

        <Text style={securityText}>
          🔒 <strong>Security Notice:</strong> This link will log you in immediately. Only click it
          if you requested this magic link. If you didn't request this, please ignore this email.
        </Text>

        <Text style={paragraph}>
          Magic links are a secure and convenient way to access your account without remembering
          passwords. Each link can only be used once and expires automatically.
        </Text>

        <Text style={signature}>
          Happy building!
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
  backgroundColor: '#8b5cf6',
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
  color: '#7c3aed',
  backgroundColor: '#f3e8ff',
  border: '1px solid #8b5cf6',
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
