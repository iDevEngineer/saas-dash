# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Migrated from NextAuth.js to Better Auth for improved TypeScript support and simpler API

### Added

- Initial project setup with Next.js 15 and TypeScript
- Authentication system with Better Auth
- Database integration with PostgreSQL and Drizzle ORM
- Docker support for development and production
- ShadCN/UI component library integration
- Dashboard layout with sidebar navigation
- Dark/light theme support
- Role-based access control (RBAC)
- Organization/multi-tenancy support
- Projects and tasks management example
- Comprehensive documentation
- GitHub Actions CI/CD pipeline
- Husky pre-commit hooks
- ESLint and Prettier configuration

### Security

- Secure session management
- Environment variable validation
- SQL injection protection with Drizzle ORM
- XSS protection with React

## [1.0.0] - 2024-01-11

### Added

- Initial release of SaaS Dash
- Core authentication features
- Basic dashboard functionality
- Docker containerization
- PostgreSQL database setup
- Essential UI components

[Unreleased]: https://github.com/iDevEngineer/saas-dash/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/iDevEngineer/saas-dash/releases/tag/v1.0.0
