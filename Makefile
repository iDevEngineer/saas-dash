.PHONY: help install dev build start test clean docker-up docker-down db-migrate db-seed db-reset lint format

# Default target
help:
	@echo "Available commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build for production"
	@echo "  make start        - Start production server"
	@echo "  make test         - Run tests"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-seed      - Seed the database"
	@echo "  make db-reset     - Reset database (drop, create, migrate, seed)"
	@echo "  make lint         - Run linting"
	@echo "  make format       - Format code"
	@echo "  make clean        - Clean build artifacts"

# Install dependencies
install:
	pnpm install

# Development
dev:
	pnpm dev

# Build for production
build:
	pnpm build

# Start production server
start:
	pnpm start

# Docker commands
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-rebuild:
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

# Database commands
db-migrate:
	pnpm drizzle-kit push:pg

db-generate:
	pnpm drizzle-kit generate:pg

db-seed:
	pnpm tsx src/lib/db/seed.ts

db-reset:
	pnpm tsx src/lib/db/reset.ts

db-studio:
	pnpm drizzle-kit studio

# Testing
test:
	pnpm test

test-ui:
	pnpm test:ui

test-e2e:
	pnpm test:e2e

# Code quality
lint:
	pnpm lint

format:
	pnpm prettier --write .

type-check:
	pnpm tsc --noEmit

# Clean
clean:
	rm -rf .next node_modules pnpm-lock.yaml
	pnpm install

# Setup project (first time)
setup:
	cp .env.example .env.local
	make install
	make docker-up
	sleep 5
	make db-migrate
	make db-seed
	@echo "✅ Setup complete! Run 'make dev' to start the development server"
