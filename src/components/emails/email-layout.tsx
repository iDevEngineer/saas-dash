import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
  Font,
} from '@react-email/components';

interface EmailLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function EmailLayout({ children, title = 'SaaS Dash' }: EmailLayoutProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <Html lang="en">
      <Head>
        <title>{title}</title>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>SaaS Dash</Text>
          </Section>

          {/* Main content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              You're receiving this email because you have an account with SaaS Dash.
            </Text>
            <Text style={footerText}>
              Visit us at{' '}
              <Link href={baseUrl} style={link}>
                {baseUrl}
              </Link>
            </Text>
            <Text style={footerText}>
              If you have any questions, please don't hesitate to{' '}
              <Link href={`${baseUrl}/contact`} style={link}>
                contact our support team
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const body = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
  padding: '0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e6ebf1',
  borderRadius: '8px',
  margin: '40px auto',
  maxWidth: '600px',
  padding: '0',
};

const header = {
  backgroundColor: '#1a1a1a',
  borderRadius: '8px 8px 0 0',
  padding: '32px',
  textAlign: 'center' as const,
};

const logoText = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  textAlign: 'center' as const,
};

const content = {
  padding: '32px',
};

const footer = {
  padding: '32px',
  paddingTop: '0',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #e6ebf1',
  margin: '24px 0',
};

const footerText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '8px 0',
  textAlign: 'center' as const,
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};
