# CryptoVault Pro

[![Release](https://img.shields.io/github/v/release/JahanzaibJameel/CryptoVault-Pro)](https://github.com/JahanzaibJameel/CryptoVault-Pro/releases) [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) [![Angular](https://img.shields.io/badge/Angular-21.2-red)](https://angular.dev) [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org)

> A production-grade Angular 21 application demonstrating resilient, offline-first cryptocurrency portfolio management with clean architecture and enterprise engineering practices.

---

## Project Overview

CryptoVault Pro is a comprehensive frontend reference implementation for building a secure, maintainable, and high-performance Angular application. It showcases modern Angular development patterns while implementing real-world cryptocurrency portfolio management features.

### Core Philosophy

The project demonstrates enterprise-grade frontend engineering through:

- **Modern Angular Architecture**: Standalone components, Angular Signals for reactive state management, and optimal change detection
- **Clean Architecture**: Layered separation of concerns with presentation, application, domain, and infrastructure layers
- **Offline-First Design**: PWA capabilities with IndexedDB persistence, service worker caching, and background synchronization
- **Production Resilience**: Circuit breakers, error boundaries, performance monitoring, and comprehensive testing
- **Security-First Approach**: CSP headers, input validation, secure runtime controls, and dependency management

### Key Features

- **Portfolio Management**: Track cryptocurrency holdings with real-time value calculations
- **Watchlist**: Monitor favorite cryptocurrencies with price alerts
- **Real-Time Data**: Live market data from CoinGecko API with intelligent caching
- **Interactive Charts**: Beautiful price charts using Lightweight Charts library
- **Offline Mode**: Full functionality without internet connectivity
- **Performance Monitoring**: Built-in performance tracking with Web Vitals
- **Error Tracking**: Sentry integration for production error monitoring
- **Responsive Design**: Mobile-first approach with adaptive layouts

## Repository Structure

```
crypto-vault-pro/
├── src/
│   ├── app/                    # UI layer with standalone components
│   │   ├── core/              # Core services, interceptors, directives
│   │   ├── features/          # Feature modules (dashboard, portfolio, watchlist, news, settings)
│   │   ├── layout/            # Layout components
│   │   ├── shared/            # Shared components and utilities
│   │   └── workers/           # Web Workers for heavy calculations
│   ├── application/           # Application layer (use cases, orchestration)
│   │   ├── market-data/       # Market data use cases
│   │   ├── portfolio/         # Portfolio management use cases
│   │   ├── settings/          # Settings use cases
│   │   └── watchlist/         # Watchlist use cases
│   ├── domain/                # Domain layer (business logic, models)
│   │   ├── models/            # Domain models (Coin, Holding, Transaction, PortfolioState)
│   │   ├── services/          # Domain services
│   │   └── value-objects/     # Value objects
│   ├── infrastructure/        # Infrastructure layer (external integrations)
│   │   ├── api/               # API clients and resilience patterns
│   │   ├── persistence/       # IndexedDB adapters
│   │   └── interfaces/        # External interface definitions
│   ├── design-system/         # Design system components
│   ├── performance/           # Performance monitoring utilities
│   ├── security/              # Security utilities
│   └── pwa/                   # PWA configuration
├── public/                    # Static assets and PWA manifest
├── docs/                      # Documentation
│   ├── adr/                   # Architecture Decision Records
│   ├── api/                   # API documentation
│   ├── architecture/          # Architecture diagrams
│   ├── runbook.md             # Operations runbook
│   └── lighthouse-instructions.md
├── tests/e2e/                 # Playwright end-to-end tests
├── angular.json               # Angular CLI configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── netlify.toml               # Netlify deployment configuration
├── vercel.json                # Vercel deployment configuration
├── ngsw-config.json           # Service worker configuration
├── jest.config.js             # Jest testing configuration
├── playwright.config.ts       # Playwright E2E configuration
└── .env.example               # Environment variables template
```

## Technology Stack

### Core Framework
- **Angular 21.2** - Latest Angular with standalone components and new control flow
- **TypeScript 5.9** - Strict mode with enhanced type safety
- **RxJS 7.8** - Reactive programming for async operations
- **Zone.js 0.16** - Angular's change detection mechanism

### State Management
- **Angular Signals** - Native reactive state management (replacing NgRx)
- **Computed Signals** - Derived state with automatic updates
- **Custom Store Pattern** - Framework-agnostic domain stores

### Data & Persistence
- **IndexedDB (idb 8.0)** - Client-side database for offline storage
- **Service Worker** - PWA caching and background sync
- **localStorage** - Settings and preferences storage

### UI & Visualization
- **Angular CDK 21.2** - Component development kit
- **Lightweight Charts 5.2** - High-performance financial charting
- **Custom Design System** - Reusable UI components

### API & Networking
- **CoinGecko API** - Cryptocurrency market data
- **HTTP Interceptors** - Request/response transformation
- **Circuit Breaker Pattern** - API resilience and fault tolerance

### Monitoring & Observability
- **Sentry 10.52** - Error tracking and performance monitoring
- **Custom Performance Service** - Web Vitals tracking
- **Health Check Service** - Application health monitoring

### Testing & Quality
- **Jest 30.4** - Unit testing with code coverage
- **Playwright 1.40** - End-to-end testing across browsers
- **Testing Library** - User-centric testing utilities
- **ESLint 8.57** - Code linting with Angular-specific rules
- **Prettier 3.8** - Code formatting
- **Lint-staged 15.2** - Pre-commit hook automation
- **Husky 8.0** - Git hooks management

### Build & Deployment
- **Angular CLI 21.2** - Build tooling and development server
- **Netlify** - Production hosting with CDN
- **Vercel** - Preview deployments
- **Lighthouse CI** - Performance auditing in CI/CD

## Key Capabilities

- **Modern Angular Architecture**: Angular 21 with standalone components, signals, and strict TypeScript mode
- **Signal-Driven State**: Reactive state management using Angular Signals instead of NgRx for better performance and smaller bundle size
- **Offline-First Persistence**: Full offline functionality using IndexedDB for data storage and service worker for asset caching
- **Production Performance**: Strict bundle budgets (initial < 600KB, component styles < 30KB) with build optimization
- **Security-First Deployment**: Content Security Policy, security headers, and CSP enforcement across all deployments
- **Comprehensive Monitoring**: Sentry integration for error tracking, custom performance monitoring with Web Vitals
- **Quality Automation**: Complete CI/CD pipeline with Jest unit tests, Playwright E2E tests, ESLint, Prettier, and Lighthouse CI
- **Resilient API Design**: Circuit breaker pattern, retry logic, and graceful degradation for API failures
- **Web Workers**: Heavy calculations (portfolio computations) offloaded to web workers for smooth UI
- **Progressive Web App**: Installable PWA with offline support, push notifications ready

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

### Clean Architecture Pattern

The application follows a strict layered architecture pattern to maintain separation of concerns and testability:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  (src/app/) - UI Components, Routing, Interceptors         │
├─────────────────────────────────────────────────────────────┤
│                   Application Layer                         │
│  (src/application/) - Use Cases, Orchestration, Workflows   │
├─────────────────────────────────────────────────────────────┤
│                     Domain Layer                             │
│  (src/domain/) - Business Logic, Models, Value Objects      │
├─────────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                        │
│  (src/infrastructure/) - APIs, Persistence, External Services│
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

- **Presentation Layer (`src/app/`)**: UI composition, routing, HTTP interceptors, and user interaction handling
- **Application Layer (`src/application/`)**: Feature orchestration, use case implementation, and workflow coordination
- **Domain Layer (`src/domain/`)**: Business rules, domain models, validation, and value objects (framework-agnostic)
- **Infrastructure Layer (`src/infrastructure/`)**: External API clients, persistence adapters, and browser integrations

### Architecture Decisions

Key architectural decisions are documented in the ADR (Architecture Decision Records):

- **[ADR 0001](docs/adr/0001-use-signals-not-ngrx.md)**: Use Angular Signals instead of NgRx for state management
- **[ADR 0002](docs/adr/0002-offline-first-persistence.md)**: Offline-first persistence strategy with IndexedDB
- **[ADR 0003](docs/adr/0003-resilience-and-circuit-breaker.md)**: API resilience with circuit breaker pattern
- **[ADR 0004](docs/adr/0004-web-workers-for-heavy-calculations.md)**: Web Workers for heavy portfolio calculations

### Design Patterns Used

- **Repository Pattern**: Data access abstraction in infrastructure layer
- **Factory Pattern**: Component and service creation
- **Strategy Pattern**: Different API resilience strategies
- **Observer Pattern**: Angular Signals for reactive state
- **Singleton Pattern**: Core services (GlobalErrorHandler, PerformanceService)
- **Circuit Breaker Pattern**: API resilience and fault tolerance

## Deployment

### Production Deployment

The project is configured for deployment on both Netlify and Vercel:

#### Netlify Deployment
- **Build Command**: `ng build --configuration production`
- **Publish Directory**: `dist/crypto-vault-pro/browser`
- **Node Version**: 18
- **Features**: Automatic HTTPS, CDN, form handling, edge functions

#### Vercel Deployment
- **Build Command**: `ng build --configuration production`
- **Output Directory**: `dist/crypto-vault-pro/browser`
- **Features**: Preview deployments, automatic HTTPS, edge network

### Security Configuration

Both deployments include comprehensive security headers:

- **Content Security Policy**: Strict CSP with allowed sources for scripts, styles, fonts, and connections
- **X-Frame-Options**: DENY to prevent clickjacking
- **X-Content-Type-Options**: nosniff to prevent MIME type sniffing
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Strict-Transport-Security**: HSTS with preload
- **Permissions-Policy**: Restricted access to sensitive APIs

### Caching Strategy

- **Static Assets**: 1-year cache with immutable flag
- **JavaScript/CSS**: 1-year cache
- **Service Worker Manifest**: No cache (must-revalidate)
- **PWA Manifest**: No cache (must-revalidate)

### Environment Variables

Required environment variables (see `.env.example`):

```bash
# API Configuration
API_PROXY_URL=https://crypto-vault-pro.netlify.app/api
COINGECKO_API_KEY=your_coingecko_api_key_here

# Monitoring
SENTRY_DSN=your_sentry_dsn_here

# Feature Flags
ENABLE_ENCRYPTION=true
ENABLE_ANALYTICS=true
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_ERROR_TRACKING=true
```

### Performance Budgets

Production build enforces strict bundle size limits:

- **Initial Bundle**: Warning at 600KB, Error at 1.2MB
- **Component Styles**: Warning at 30KB, Error at 60KB
- **Any Component**: Warning at 250KB, Error at 400KB
- **Total Bundle**: Warning at 1.2MB, Error at 2.5MB

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Architecture Decision Records](docs/adr/)**: Detailed records of key architectural decisions with rationale and consequences
- **[Operations Runbook](docs/runbook.md)**: Comprehensive operational procedures, incident response, and maintenance guidelines
- **[Lighthouse Instructions](docs/lighthouse-instructions.md)**: Performance optimization and Lighthouse CI guidance
- **[API Documentation](docs/api/)**: API integration references and usage examples
- **[Architecture Diagrams](docs/architecture/)**: Visual representations of system architecture

## Testing and Quality

### Testing Strategy

The project employs a comprehensive testing strategy across multiple levels:

- **Unit Tests (Jest)**: Isolated component and service testing with 80%+ coverage target
- **Integration Tests**: Testing of use cases and application layer logic
- **End-to-End Tests (Playwright)**: Full user flow testing across Chrome, Firefox, and Safari
- **Visual Regression Tests**: Screenshot testing for UI consistency
- **Performance Tests (Lighthouse CI)**: Automated performance auditing in CI/CD

### Quality Tools

- **ESLint**: Static code analysis with Angular-specific rules
- **Prettier**: Code formatting with consistent style
- **Lint-staged**: Pre-commit hook automation for staged files
- **Husky**: Git hooks management for quality gates
- **TypeScript Strict Mode**: Enhanced type safety and error detection

### Quality Gates

Before pushing changes, ensure all quality checks pass:

```bash
npm run validate  # Runs type-check, lint, and CI tests
```

### Test Coverage

Target coverage metrics:
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## Contribution Guidelines

We welcome contributions to CryptoVault Pro! Please follow these guidelines:

### Development Workflow

1. **Fork and Clone**: Fork the repository and clone your fork locally
2. **Create Branch**: Create a feature branch from `main`
3. **Make Changes**: Implement your changes following the architecture patterns
4. **Test Locally**: Run `npm run validate` to ensure quality
5. **Commit**: Use clear, descriptive commit messages
6. **Push**: Push to your fork and create a pull request

### Code Standards

- **Architecture**: Follow the layered architecture model (presentation → application → domain → infrastructure)
- **Separation of Concerns**: Keep business rules separate from UI concerns
- **TypeScript**: Use strict mode and leverage type safety
- **Signals**: Use Angular Signals for state management (not NgRx)
- **Testing**: Add tests for new behavior and edge cases (80%+ coverage)
- **Documentation**: Update documentation and ADRs for significant architecture decisions

### Pre-Commit Checklist

Before pushing changes, ensure:
- [ ] All tests pass: `npm run validate`
- [ ] Code is formatted: `npm run format`
- [ ] No linting errors: `npm run lint`
- [ ] Type checking passes: `npm run type-check`
- [ ] New features have tests
- [ ] Documentation is updated

### Pull Request Process

- Describe the changes and their motivation
- Link related issues and ADRs
- Ensure CI/CD checks pass
- Request review from maintainers
- Address feedback promptly

## Performance

### Performance Targets

The application targets high performance metrics:

- **Lighthouse Performance Score**: 95+
- **Lighthouse Accessibility Score**: 95+
- **Lighthouse Best Practices Score**: 90+
- **Lighthouse SEO Score**: 90+
- **First Contentful Paint**: < 1.8s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.8s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Optimization Techniques

- **Code Splitting**: Lazy-loaded feature modules
- **Tree Shaking**: Removal of unused code
- **Bundle Analysis**: Regular bundle size monitoring
- **Image Optimization**: WebP format with responsive sizing
- **Caching Strategy**: Aggressive caching for static assets
- **Web Workers**: Offloading heavy computations
- **Service Worker**: Offline caching and background sync

## Security

### Security Measures

- **Content Security Policy**: Strict CSP to prevent XSS attacks
- **Input Validation**: All user inputs are validated and sanitized
- **HTTPS Only**: All communications encrypted
- **Security Headers**: Comprehensive security headers configured
- **Dependency Scanning**: Regular security audits of dependencies
- **No Secrets in Code**: Environment variables for sensitive data
- **API Rate Limiting**: Protection against API abuse

### Reporting Security Issues

If you discover a security vulnerability, please:
1. Do not create a public issue
2. Send details to the maintainers privately
3. Include steps to reproduce the vulnerability
4. Allow time for remediation before disclosure

## Maintainer Notes

- `package.json` is configured as `private: true` to prevent accidental publication
- Service worker settings are managed in `ngsw-config.json` for offline caching
- The repository is intended as a production-quality example rather than a minimal demo
- Security, performance, and resilience are first-class concerns across the stack
- All architectural decisions are documented in ADRs for transparency
- The project follows semantic versioning for releases

## Roadmap

### Planned Enhancements

- **Advanced Analytics**: Portfolio performance analytics and insights
- **Multi-Currency Support**: Support for fiat currency conversions
- **Tax Reporting**: Generate tax reports for cryptocurrency transactions
- **Social Features**: Share portfolios and compare with others
- **Mobile Apps**: Native iOS and Android applications
- **Advanced Charts**: More chart types and technical indicators
- **Price Alerts**: Custom price alerts via push notifications
- **Exchange Integration**: Direct integration with cryptocurrency exchanges

### Known Limitations

- CoinGecko API rate limits may affect real-time data frequency
- Offline mode has limited historical data storage
- Portfolio calculations are client-side only (no server-side backup)
- No multi-device sync (data is local to device)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- **CoinGecko API** for providing cryptocurrency market data
- **Angular Team** for the amazing framework and tools
- **Open Source Community** for the valuable libraries and tools used

## Contact

- **Repository**: [https://github.com/JahanzaibJameel/CryptoVault-Pro](https://github.com/JahanzaibJameel/CryptoVault-Pro)
- **Issues**: [https://github.com/JahanzaibJameel/CryptoVault-Pro/issues](https://github.com/JahanzaibJameel/CryptoVault-Pro/issues)
- **Live Demo**: [https://crypto-vault-pro.netlify.app](https://crypto-vault-pro.netlify.app)

## Star History

If you find this project useful, please consider giving it a ⭐ star on GitHub!

---

Built with ❤️ using Angular 21
