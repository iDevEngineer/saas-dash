import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import { users, sessions, accounts, verification } from './db/schema/auth';
import bcrypt from 'bcryptjs';
import { emailService } from './email';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: false, // prevents users from setting role during signup
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    password: {
      // Use bcrypt for password hashing/verification
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
    sendEmailVerificationOnSignUp: async ({
      user,
      url,
    }: {
      user: { email: string; name?: string };
      url: string;
    }) => {
      try {
        await emailService.sendVerificationEmail(user.email, {
          firstName: user.name || 'User',
          verificationUrl: url,
          expiresIn: '24 hours',
        });
      } catch (error) {
        console.error('Failed to send verification email:', error);
        // Don't throw error to prevent breaking signup flow
      }
    },
    forgetPassword: {
      sendResetPassword: async ({
        user,
        url,
      }: {
        user: { email: string; name?: string };
        url: string;
      }) => {
        try {
          await emailService.sendPasswordResetEmail(user.email, {
            firstName: user.name || 'User',
            resetUrl: url,
            expiresIn: '1 hour',
          });
        } catch (error) {
          console.error('Failed to send password reset email:', error);
          // Don't throw error to prevent breaking reset flow
        }
      },
    },
  },
  callbacks: {
    after: [
      {
        matcher(context: { type: string; method: string }) {
          return context.type === 'credential' && context.method === 'signUp';
        },
        handler: async (ctx: { user: { email: string; name?: string } }) => {
          // Send welcome email after successful signup
          try {
            await emailService.sendWelcomeEmail(ctx.user.email, {
              firstName: ctx.user.name || 'User',
              email: ctx.user.email,
            });
          } catch (error) {
            console.error('Failed to send welcome email:', error);
            // Don't throw error to prevent breaking signup flow
          }
        },
      },
      {
        matcher(context: { type: string; method?: string }) {
          return context.type === 'forgetPassword';
        },
        handler: async (ctx: { method?: string; user: { email: string; name?: string } }) => {
          // Send password reset success email after successful reset
          if (ctx.method === 'resetPassword') {
            try {
              await emailService.sendPasswordResetSuccessEmail(ctx.user.email, {
                firstName: ctx.user.name || 'User',
                email: ctx.user.email,
              });
            } catch (error) {
              console.error('Failed to send password reset success email:', error);
              // Don't throw error
            }
          }
        },
      },
    ],
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day - session updated if older than this
    cookieName: 'better-auth.session',
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
});

// Export types for TypeScript
export type Auth = typeof auth;
