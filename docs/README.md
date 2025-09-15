# SaaS Dash - Documentation

## Project Overview

A modern, secure, and extensible dashboard template for SaaS applications. Built with Next.js,
TypeScript, Docker, and PostgreSQL, featuring authentication, multi-tenancy support, and a beautiful
UI.

## Documentation Structure

- `SETUP.md` - Development setup guide
- `ARCHITECTURE.md` - Technical architecture and design decisions
- `DEPLOYMENT.md` - Deployment guides for various platforms
- `API.md` - API documentation and endpoints
- `DATABASE.md` - Database schema and migrations
- `AUTHENTICATION.md` - Authentication and authorization guide
- `CONTRIBUTING.md` - Contribution guidelines

## Quick Start

```bash
# Clone the repository
git clone https://github.com/iDevEngineer/saas-dash.git
cd saas-dash

# Setup environment
cp .env.example .env.local

# Start PostgreSQL with Docker
docker-compose up -d postgres

# Install dependencies
pnpm install

# Run migrations
pnpm drizzle-kit push:pg

# Seed database (optional)
pnpm tsx src/lib/db/seed.ts

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Key Features

- 🔐 **Authentication**: Better Auth with credentials and OAuth providers
- 🏢 **Multi-tenancy**: Organization support with role-based access
- 🎨 **Modern UI**: ShadCN/UI components with dark mode
- 📊 **Database**: PostgreSQL with Drizzle ORM
- 🐳 **Docker**: Containerized development environment
- 🚀 **Production Ready**: TypeScript, ESLint, testing setup

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, ShadCN/UI
- **Authentication**: Better Auth
- **Database**: PostgreSQL, Drizzle ORM
- **Deployment**: Docker, Vercel-ready
- **Testing**: Vitest, Playwright

## Support

For issues and questions, please check our
[GitHub Issues](https://github.com/iDevEngineer/saas-dash/issues) or join our community discussions.
