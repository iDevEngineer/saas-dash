# 🚀 SaaS Dash

A modern, production-ready SaaS dashboard template built with Next.js, TypeScript, Better Auth, and
Docker. Perfect for launching your next SaaS application quickly with enterprise-grade features out
of the box.

<!-- Project Stats -->

![GitHub stars](https://img.shields.io/github/stars/iDevEngineer/saas-dash?style=social)
![GitHub forks](https://img.shields.io/github/forks/iDevEngineer/saas-dash?style=social)
![GitHub issues](https://img.shields.io/github/issues/iDevEngineer/saas-dash)
![GitHub license](https://img.shields.io/github/license/iDevEngineer/saas-dash)

<!-- Tech Stack -->

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

<!-- Features -->

![Better Auth](https://img.shields.io/badge/Auth-Better%20Auth-purple)
![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle-green)
![UI](https://img.shields.io/badge/UI-ShadCN-orange)
![pnpm](https://img.shields.io/badge/pnpm-8.0-F69220?logo=pnpm&logoColor=white)

## ✨ Features

### Core Features (MVP)

- 🔐 **Authentication & Authorization**
  - Email/password authentication
  - OAuth providers (GitHub, Google)
  - Role-based access control (RBAC)
  - Secure session management
  - Password reset flow

- 🎨 **Modern UI/UX**
  - Responsive dashboard layout
  - Dark/light theme support
  - Pre-built components with ShadCN/UI
  - Tailwind CSS for styling
  - Toast notifications

- 🗄️ **Database & ORM**
  - PostgreSQL with Docker
  - Drizzle ORM for type-safe queries
  - Migration system
  - Seed data scripts

- ✅ **Developer Experience**
  - TypeScript for type safety
  - Zod for runtime validation
  - ESLint & Prettier configured
  - Husky pre-commit hooks
  - Hot reload in development

### Coming Soon (Phase 2)

- 💳 Stripe billing integration
- 🏢 Multi-tenancy support
- 🔑 API key management
- 📊 Audit logs
- 👥 Admin panel

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Authentication**: [Better Auth](https://better-auth.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN/UI](https://ui.shadcn.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Containerization**: [Docker](https://www.docker.com/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## 📋 Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- Git

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/iDevEngineer/saas-dash.git
cd saas-dash
```

### 2. Automatic Setup (Recommended)

```bash
make setup
```

This command will:

- Copy `.env.example` to `.env.local`
- Install dependencies
- Start Docker containers
- Run database migrations
- Seed initial data

### 3. Start development server

```bash
make dev
# or
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 📝 Manual Setup

If you prefer manual setup or the automatic setup fails:

### 1. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

- Generate secrets: `openssl rand -base64 32`
- Add OAuth credentials (optional)

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Database Setup

Start PostgreSQL with Docker:

```bash
docker-compose up -d postgres
```

Run migrations:

```bash
pnpm drizzle-kit push:pg
```

Seed database (optional):

```bash
pnpm tsx src/lib/db/seed.ts
```

### 4. Start Development

```bash
pnpm dev
```

## 🐳 Docker Development

Run the entire stack with Docker:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 📁 Project Structure

```
saas-dash/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # Auth routes
│   │   ├── (dashboard)/     # Protected dashboard routes
│   │   ├── api/             # API route handlers
│   │   └── layout.tsx       # Root layout
│   ├── components/          # React components
│   │   ├── ui/             # ShadCN UI components
│   │   └── ...             # Custom components
│   ├── lib/                # Utilities and configurations
│   │   ├── auth/           # Authentication setup
│   │   ├── db/             # Database configuration
│   │   └── validations/    # Zod schemas
│   └── styles/             # Global styles
├── public/                 # Static assets
├── docker-compose.yml      # Docker configuration
├── drizzle.config.ts      # Drizzle ORM configuration
└── package.json           # Dependencies and scripts
```

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run E2E tests
pnpm test:e2e
```

## 📚 Available Commands

```bash
make help              # Show all available commands
make dev               # Start development server
make build             # Build for production
make docker-up         # Start Docker containers
make docker-down       # Stop Docker containers
make db-migrate        # Run database migrations
make db-seed           # Seed the database
make db-studio         # Open Drizzle Studio
make lint              # Run linting
make format            # Format code
```

## 🚢 Deployment

### Docker Deployment

Build and run the production image:

```bash
# Build production image
docker build -t saas-dashboard .

# Run container
docker run -p 3000:3000 --env-file .env.local saas-dashboard
```

### Vercel Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/iDevEngineer/saas-dash)

1. Click the button above
2. Configure environment variables
3. Deploy

### Other Platforms

- **Railway**: Use the provided `railway.json`
- **Render**: Use the provided `render.yaml`
- **Fly.io**: Use the provided `fly.toml`

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options.

### OAuth Providers

To enable OAuth:

1. Create OAuth apps on provider platforms
2. Add credentials to `.env.local`
3. Providers are automatically enabled when credentials are present

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) team for the amazing framework
- [Vercel](https://vercel.com/) for hosting and deployment
- [ShadCN](https://ui.shadcn.com/) for the beautiful UI components
- All our contributors and supporters

## 💬 Support

- 📧 Email: support@saas-starter.com
- 💬 Discord: [Join our community](https://discord.gg/saas-starter)
- 🐛 Issues: [GitHub Issues](https://github.com/iDevEngineer/saas-dash/issues)

## 🚀 Roadmap

- [x] Core authentication system
- [x] Dashboard layout
- [x] Docker support
- [ ] Stripe integration
- [ ] Multi-tenancy
- [ ] API documentation
- [ ] Admin panel
- [ ] Audit logs
- [ ] Email notifications
- [ ] Webhook support

---

Built with ❤️ by the open-source community
