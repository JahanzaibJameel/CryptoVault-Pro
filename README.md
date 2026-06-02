# CryptoVault Pro

> A production-grade Angular 21 application demonstrating resilient, offline-first cryptocurrency portfolio management with clean architecture and enterprise engineering practices.

---

## Project Overview

CryptoVault Pro is a frontend reference implementation for building a secure, maintainable, and high-performance Angular application.

It is built around:

- modern Angular architecture with standalone components and signals
- a layered clean architecture separating presentation, application, domain, and infrastructure
- PWA capabilities, offline persistence, and secure runtime controls
- automated validation across linting, type checking, unit tests, end-to-end tests, and Lighthouse audits

## Repository Structure

- `src/` — Angular application source code, features, and shell
- `public/` — static assets and PWA manifest
- `ngsw-config.json` — service worker configuration for offline caching
- `angular.json` — build & serve configuration, including production budgets
- `package.json` — build scripts, dependencies, and validation tooling
- `netlify.toml` — security headers, cache control, and deployment settings
- `docs/` — architecture decision records, runbooks, and operational guidance
- `tests/e2e/` — Playwright end-to-end test suites

## Key Capabilities

- Angular 21 with TypeScript 5.9 and strict mode
- Signal-driven UI state and reactive application design
- Offline-first persistence using service worker and IndexedDB
- Production performance budgets and optimized bundles
- Security-focused deployment headers and CSP enforcement
- Error and performance monitoring via Sentry integration
- Quality workflows with Jest, Playwright, ESLint, Prettier, and Lighthouse CI

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Setup

```bash
git clone https://github.com/JahanzaibJameel/CryptoVault-Pro.git
cd crypto-vault-pro
npm install
npm run prepare
```

### Run Locally

```bash
npm run start
```

Open `http://localhost:4200` in your browser.

### Run with HTTPS

```bash
npm run start:ssl
```

## Build and Validation

### Production Build

```bash
npm run build
```

### Build Analysis

```bash
npm run build:analyze
```

### Validation Suite

```bash
npm run type-check
npm run lint
npm run test:ci
npm run lighthouse
```

### Recommended Scripts

- `npm run start` — development server
- `npm run build` — production bundle
- `npm run lint` — static analysis
- `npm run type-check` — TypeScript validation
- `npm test` — unit tests
- `npm run test:e2e` — end-to-end tests
- `npm run format` — format source files
- `npm run validate` — run type-check, lint, and CI tests

## Architecture

The app follows a layered architecture pattern:

- `src/app/` — UI composition and routing
- `src/application/` — feature orchestration and use case logic
- `src/domain/` — business rules, validation, and value objects
- `src/infrastructure/` — external APIs, persistence adapters, and browser integrations

This structure maintains clear separation of concerns and keeps business logic framework-agnostic.

## Deployment Notes

The project is configured for Netlify deployment in `netlify.toml`:

- production build served from `dist/crypto-vault-pro/browser`
- CSP and security headers for JS, CSS, manifest, and service worker
- SPA fallback routing via redirect to `index.html`
- long-term caching for immutable assets

## Documentation

- `docs/adr/` — architecture decision records
- `docs/runbook.md` — operational procedures and incident management
- `docs/lighthouse-instructions.md` — performance and Lighthouse guidance
- `docs/api/` — API integration references

## Testing and Quality

- Jest for unit tests
- Playwright for end-to-end tests
- Lighthouse CI for performance audits
- ESLint and Prettier with lint-staged precommit automation

## Contribution Guidelines

- Follow the layered architecture model
- Keep business rules separate from UI concerns
- Add tests for new behavior and edge cases
- Run `npm run validate` before pushing changes
- Update documentation and ADRs for architecture decisions

## Maintainer Notes

- `package.json` is configured as `private: true`
- Service worker settings are managed in `ngsw-config.json`
- The repository is intended as a production-quality example rather than a minimal demo
- Security, performance, and resilience are first-class concerns across the stack

## License

MIT License
