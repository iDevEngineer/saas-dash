import { Text, Button, Section } from '@react-email/components';
import { EmailLayout } from './email-layout';
import type { EmailTemplateData } from '@/lib/email/types';

interface WelcomeEmailProps {
  data: EmailTemplateData['welcome'];
}

export function WelcomeEmail({ data }: WelcomeEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <EmailLayout title="Welcome to SaaS Dash">
      <Section>
        <Text style={heading}>Welcome to SaaS Dash, {data.firstName}! 🎉</Text>

        <Text style={paragraph}>
          Thanks for joining SaaS Dash! We&apos;re excited to have you on board and can&apos;t wait
          to see what you&apos;ll build with our platform.
        </Text>

        <Text style={paragraph}>
          Your account has been successfully created with the email address:{' '}
          <strong>{data.email}</strong>
        </Text>

        <Section style={buttonContainer}>
          <Button href={`${baseUrl}/dashboard`} style={button}>
            Get Started
          </Button>
        </Section>

        <Text style={paragraph}>Here are some things you can do to get started:</Text>

        <Text style={list}>
          • Complete your profile setup in the dashboard
          <br />
          • Explore our features and integrations
          <br />
          • Check out our documentation and guides
          <br />• Connect with our community
        </Text>

        <Text style={paragraph}>
          If you have any questions or need help getting started, feel free to reach out to our
          support team. We&apos;re here to help!
        </Text>

        <Text style={signature}>
          Welcome aboard!
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
  fontStyle: 'italic',
};
