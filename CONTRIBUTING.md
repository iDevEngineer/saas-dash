# Contributing to SaaS Dash

First off, thank you for considering contributing to SaaS Dash! It's people like you that make this
project such a great tool for the community.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating,
you are expected to uphold this code. Please report unacceptable behavior to support@saas-dash.com.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need
to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and expected**
- **Include screenshots if possible**
- **Include your environment details** (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion,
please include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed enhancement**
- **Provide specific use cases**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Setup

1. Fork and clone the repository

```bash
git clone https://github.com/iDevEngineer/saas-dash.git
cd saas-dash
```

2. Install dependencies

```bash
pnpm install
```

3. Set up your environment

```bash
cp .env.example .env.local
```

4. Start the development environment

```bash
make docker-up
make dev
```

## Development Guidelines

### Code Style

- We use TypeScript for type safety
- Follow the existing code style (enforced by ESLint and Prettier)
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Maintenance tasks

Examples:

```
feat: add stripe payment integration
fix: resolve authentication redirect issue
docs: update installation instructions
```

### Testing

- Write unit tests for utility functions
- Add integration tests for API endpoints
- Include E2E tests for critical user flows
- Run tests before submitting PR: `pnpm test`

### Documentation

- Update README.md if you change setup steps
- Document new environment variables
- Add JSDoc comments for complex functions
- Update API documentation for new endpoints

## Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # React components
├── lib/          # Utilities and configurations
├── styles/       # Global styles
└── types/        # TypeScript type definitions
```

## Review Process

1. A maintainer will review your PR
2. They may request changes or ask questions
3. Once approved, your PR will be merged
4. Your contribution will be included in the next release

## Recognition

Contributors will be recognized in:

- The project README
- Release notes
- Our website (coming soon)

## Questions?

Feel free to:

- Open an issue for questions
- Join our Discord community
- Email us at support@saas-dash.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉
