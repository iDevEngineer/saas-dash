# Email System Setup Guide

This guide will help you configure the email system for SaaS Dash using Resend.

## Required Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_PROVIDER=resend

# Optional: Alternative email providers
# SENDGRID_API_KEY=your_sendgrid_api_key

# Application URLs (if not already set)
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
```

## Getting Started

### 1. Create a Resend Account

1. Visit [resend.com](https://resend.com) and create an account
2. Verify your email address
3. Navigate to the API Keys section in your dashboard

### 2. Generate API Key

1. Click "Create API Key"
2. Give it a name (e.g., "SaaS Dash Development")
3. Copy the API key (it starts with `re_`)
4. Add it to your `.env.local` file as `RESEND_API_KEY`

### 3. Configure Sender Domain

**For Development:**

- You can use the default `onboarding@resend.dev` domain for testing
- Set `EMAIL_FROM=onboarding@resend.dev`

**For Production:**

1. Add your custom domain in Resend dashboard
2. Configure DNS records as instructed
3. Verify domain ownership
4. Update `EMAIL_FROM` to use your domain (e.g., `noreply@yourdomain.com`)

### 4. Test the Setup

1. Start your development server: `pnpm dev`
2. Check email service health: `GET http://localhost:3000/api/email/health`
3. Preview email templates: `GET http://localhost:3000/api/email/preview/welcome`

## Email Templates

The system includes the following pre-built templates:

- **Welcome Email** (`welcome`) - Sent after user registration
- **Email Verification** (`email-verification`) - Sent for email verification
- **Password Reset** (`password-reset`) - Sent when user requests password reset
- **Password Reset Success** (`password-reset-success`) - Sent after successful password reset
- **Magic Link** (`magic-link`) - Sent for passwordless login

## API Endpoints

### Send Email

```bash
POST /api/email/send
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Welcome!",
  "template": "welcome",
  "templateData": {
    "firstName": "John",
    "email": "user@example.com"
  }
}
```

### Check Health

```bash
GET /api/email/health
```

### Preview Templates

```bash
GET /api/email/preview/welcome
GET /api/email/preview/welcome?format=json
```

## Integration with Better Auth

The email system is automatically integrated with Better Auth:

- **Email Verification**: Enabled by default, sends verification emails on signup
- **Password Reset**: Sends reset emails when users request password reset
- **Welcome Emails**: Automatically sent after successful registration
- **Reset Success**: Sent after successful password reset

## Customization

### Custom Templates

1. Create new template components in `src/components/emails/`
2. Add template to `src/lib/email/templates.tsx`
3. Update types in `src/lib/email/types.ts`

### Custom Providers

1. Implement the `EmailProvider` interface
2. Add provider to `src/lib/email/service.ts`
3. Configure provider credentials in environment variables

## Troubleshooting

### Common Issues

1. **"Resend API key is required"**
   - Ensure `RESEND_API_KEY` is set in `.env.local`
   - Restart your development server

2. **"Domain not verified"**
   - Complete domain verification in Resend dashboard
   - Use `onboarding@resend.dev` for development

3. **"Failed to send email"**
   - Check API key permissions
   - Verify sender domain is configured
   - Check Resend dashboard for delivery logs

### Debug Mode

Enable detailed logging by setting:

```bash
NODE_ENV=development
```

## Production Checklist

- [ ] Domain verified in Resend
- [ ] API key generated for production
- [ ] `EMAIL_FROM` set to your domain
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] Rate limiting configured (if needed)
- [ ] Monitoring and alerting set up

## Support

- Resend Documentation: [resend.com/docs](https://resend.com/docs)
- Email Templates: Check `/api/email` for API documentation
- Issues: Report in GitHub issues
