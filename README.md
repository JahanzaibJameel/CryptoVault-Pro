# CryptoVault Pro

> A frontend system design case study: resilient, offline‑first crypto portfolio tracker built with Angular, domain‑driven design, and production‑grade engineering patterns.

## 🌐 Live Demo

**[https://crypto-vault-pro.netlify.app](https://crypto-vault-pro.netlify.app)**

*Experience the production-ready application with full offline capabilities, real-time market data, and resilient error handling.*

## Why This Project Stands Out

- **Framework‑agnostic domain logic** (zero Angular imports)
- **Signal‑based state stores** with strict mutation rules
- **API circuit breaker**, retry, and stale‑while‑revalidate cache
- **Full offline support** with IndexedDB persistence
- **Token‑driven design system** with dark/light themes
- **Measurable performance** (Lighthouse 96+)
- **Architecture Decision Records** and a "What Could Break" analysis

## Architecture Overview

![Architecture Diagram](docs/architecture-diagram.png)

### Layers

- **Domain** – pure TypeScript: models, pure functions, business rules
- **Application** – feature stores, use cases (framework‑agnostic)
- **Infrastructure** – API resilience, persistence, browser APIs
- **Presentation** – Angular standalone components, lazy routes

## Key Engineering Decisions

| Decision | Rationale |
|-----------|------------|
| Signals over NgRx | Smaller API, framework‑lean, simpler testing |
| Offline‑first IndexedDB | Full functionality without network |
| Circuit breaker | Production API resilience pattern |
| Design tokens | Consistent theming, white‑label ready |
| OnPush + @defer | Performance budget compliance |

## Performance

- Initial load < 1.5s on 3G
- Main bundle < 150KB gzipped
- Lighthouse scores: Performance 97, Accessibility 100
- Bundle analysis screenshot

## What Could Break This System

| Risk | Mitigation |
|-------|------------|
| API rate limits | Circuit breaker opens after 5 failures, 30s cooldown |
| IndexedDB corruption | Export/import JSON backup feature |
| Stale cache | 30s TTL, invalidated on re‑focus |

## Failure Simulation

A hidden debug panel (only in dev) lets you toggle API offline, clear storage, and test resilience in real time. See the demo video.

## Architecture Decision Records

- [Use Signals instead of NgRx](docs/adr/0001-use-signals-not-ngrx.md)
- [Offline‑first persistence](docs/adr/0002-offline-first-persistence.md)
- [Resilience strategy](docs/adr/0003-resilience-and-circuit-breaker.md)

## Quick Start

```bash
git clone https://github.com/your-username/crypto-vault-pro.git
cd crypto-vault-pro
npm install
ng serve
```

Navigate to `http://localhost:4200`

## Tech Stack

- **Framework**: Angular 17+ (standalone, signals, new control flow)
- **Language**: TypeScript 5+ (strict mode)
- **State Management**: Angular Signals + plain TS classes
- **UI**: Custom design system (no third‑party UI library)
- **Charts**: lightweight-charts (TradingView)
- **API**: CoinGecko free API
- **Persistence**: IndexedDB + localStorage
- **PWA**: @angular/service-worker
- **Testing**: Jest, Angular Testing Library, MSW, Cypress/Playwright

## Features

### Dashboard
- Real‑time cryptocurrency prices
- Market overview with global statistics
- Top cryptocurrencies with sorting and filtering
- Watchlist preview
- Quick action shortcuts

### Portfolio Management
- Add buy/sell transactions
- Automatic P&L calculations
- Portfolio allocation charts
- Historical performance tracking
- Export/import portfolio data
- Transaction history with filtering

### Watchlist
- Drag‑and‑drop reordering
- Quick add/remove from dashboard
- Price alerts and notifications
- Custom sorting and grouping

### News & Updates
- Crypto news aggregation
- Price change notifications
- Market sentiment indicators
- Filter by cryptocurrency

### Settings
- Dark/light theme toggle
- Currency selection (USD, EUR, GBP, JPY)
- Auto‑refresh intervals
- Notification preferences
- Data export/import
- Debug panel (dev only)

## Project Structure

```bash
src/
├── app/                          # Angular presentation layer
│   ├── core/                     # Singleton services, guards, interceptors
│   ├── features/                  # Feature modules / standalone route groups
│   ├── shared/                    # Reusable UI primitives, pipes, directives
│   └── layout/                    # Shell, header, footer, navigation
├── domain/                       # Framework‑agnostic business logic
│   ├── models/                    # Interfaces, types
│   ├── value-objects/             # Immutable value objects
│   └── services/                  # Pure functions (calculatePnL, riskScore)
├── application/                  # Use cases and state stores
│   ├── portfolio/store/
│   ├── watchlist/store/
│   ├── market-data/store/
│   └── settings/store/
├── infrastructure/               # External world implementation
│   ├── api/                      # API services and resilience
│   ├── persistence/               # IndexedDB and localStorage
│   └── notifications/            # Push notifications
├── design-system/                # Design tokens and global styles
│   ├── tokens/                    # Color, spacing, typography, shadows
│   └── styles/                    # Global SCSS files
└── docs/                        # ADRs and architecture docs
```

## Testing

### Test Pyramid

```text
        /\
       /E2E\      (Cypress: buy flow, offline, CRUD)
      /------\
     /Component\ (Angular Testing Library: forms, interactions)
    /----------\
   /Integration\ (MSW + HTTP testing: CoinGecko service, resilience)
  /--------------\
 /     Unit       \ (Jest: domain functions, store methods)
/------------------\
```

### Running Tests

```bash
# Unit + Integration tests
npm run test

# E2E tests
npm run e2e

# Test coverage
npm run test:coverage
```

### Key Test Scenarios

- Portfolio calculations accuracy
- Offline functionality
- API resilience and circuit breaker
- Data persistence and recovery
- Theme switching and accessibility
- Performance budgets

## Performance

### Lighthouse Scores

![Lighthouse scores](docs/lighthouse.png)

### Bundle Analysis

```bash
ng build --stats-json
npx webpack-bundle-analyzer dist/crypto-vault-pro/stats.json
```

### Lighthouse CI

```bash
npm run lighthouse
```

### Optimization Techniques

- Lazy loading of feature routes
- OnPush change detection on all components
- Virtual scrolling for large lists
- Image lazy loading
- @defer for heavy components
- Tree‑shakable standalone components

## Deployment

### Netlify (Recommended)

1. Connect your GitHub repository
2. Build command: `ng build`
3. Publish directory: `dist/crypto-vault-pro`
4. Add environment variables if needed

### Vercel Alternative

```bash
npm install -g vercel
vercel --prod
```

### Environment Variables

```bash
# For production builds
NG_BUILD_CONFIGURATION=production
NG_APP_COINGECKO_API_KEY=your_api_key
```

## Development

### Local Development

```bash
# Start dev server
ng serve

# Start with SSL (for PWA testing)
ng serve --ssl

# Build for production
ng build --configuration production
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run type-check
```

### Debug Tools

The debug panel (bottom‑right corner) provides:

- Connection simulation (offline/slow/unreliable)
- Latency control (0‑5000ms)
- Failure rate simulation (0‑100%)
- Cache management
- Circuit breaker status
- Storage utilities

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass before PR
- Keep bundle size impact minimal

## Security

### Data Protection

- All sensitive data encrypted at rest
- No API keys in client code
- Content Security Policy headers
- HTTPS enforcement in production

### Privacy

- No third‑party analytics without consent
- Local‑only data storage
- Clear data export functionality
- Transparent data usage policies

## Roadmap

### v1.0.0 (Current)
- Core portfolio tracking
- Offline functionality
- Basic charts and analytics
- Design system implementation

### v1.1.0 (Planned)
- Advanced portfolio analytics
- Price alerts and notifications
- Portfolio sharing features
- Mobile PWA improvements

### v2.0.0 (Future)
- Multi‑currency support
- Tax reporting features
- DeFi integration
- Advanced charting tools

## Troubleshooting

### Common Issues

**Q: Build fails with TypeScript errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Q: Service Worker not registering**
```bash
# Ensure HTTPS in production
# Check ngsw-config.json configuration
```

**Q: IndexedDB quota exceeded**
- Clear old data in settings
- Export data before clearing
- Check browser storage limits

### Getting Help

- [Documentation](docs/)
- [Issue Tracker](https://github.com/your-username/crypto-vault-pro/issues)
- [Discussions](https://github.com/your-username/crypto-vault-pro/discussions)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Angular](https://angular.dev/) - Framework
- [CoinGecko](https://www.coingecko.com/) - API provider
- [lightweight-charts](https://www.tradingview.com/lightweight-charts/) - Charting library
- [IDB](https://github.com/jakearchibald/idb) - IndexedDB wrapper

---
**Built with ❤️ for the crypto community**
