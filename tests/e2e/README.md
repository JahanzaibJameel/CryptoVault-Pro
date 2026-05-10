# E2E Testing

## Setup

Install Playwright dependencies:

```bash
npm install --save-dev @playwright/test
npx playwright install
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/buy-flow.spec.ts

# Run with UI
npx playwright test --ui

# Run in headed mode
npx playwright test --headed
```

## Test Coverage

### Buy Flow Tests (`buy-flow.spec.ts`)
- ✅ Complete buy transaction with validation
- ✅ Transaction appears in holdings and transaction list
- ✅ Form validation prevents invalid submissions

### Offline Recovery Tests (`offline-recovery.spec.ts`)
- ✅ Portfolio works offline and recovers
- ✅ Dashboard shows cached data offline
- ✅ Watchlist persists offline with reordering
- ✅ Data syncs when coming back online

## Adding New Tests

1. Create new `.spec.ts` file in `tests/e2e/`
2. Use Playwright test syntax with descriptive test names
3. Include data-test attributes for reliable element selection
4. Test both online and offline scenarios
5. Verify state persistence and recovery

## Debugging

```bash
# Run with trace for debugging
npx playwright test --trace on

# Run with specific browser
npx playwright test --project=chromium
```
