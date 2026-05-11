import { test, expect } from '@playwright/test';

test.describe('Portfolio Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to portfolio page
    await page.goto('/portfolio');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display portfolio page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Portfolio/);
    
    // Check main elements are visible
    await expect(page.locator('h1')).toContainText('Portfolio');
    await expect(page.locator('[data-testid="holdings-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="transactions-section"]')).toBeVisible();
  });

  test('should display empty state when no holdings', async ({ page }) => {
    // Check for empty state
    await expect(page.locator('[data-testid="empty-holdings"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-holdings"]')).toContainText('No holdings yet');
  });

  test('should add new transaction successfully', async ({ page }) => {
    // Click add transaction button
    await page.locator('[data-testid="add-transaction-btn"]').click();
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="transaction-modal"]')).toBeVisible();
    
    // Fill form
    await page.locator('[data-testid="coin-select"]').selectOption('bitcoin');
    await page.locator('[data-testid="transaction-type"]').selectOption('buy');
    await page.locator('[data-testid="amount-input"]').fill('0.5');
    await page.locator('[data-testid="price-input"]').fill('50000');
    
    // Submit form
    await page.locator('[data-testid="save-transaction-btn"]').click();
    
    // Wait for success notification
    await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-notification"]')).toContainText('Transaction added successfully');
    
    // Check modal is closed
    await expect(page.locator('[data-testid="transaction-modal"]')).not.toBeVisible();
  });

  test('should display holdings after adding transactions', async ({ page }) => {
    // Add a transaction first
    await page.locator('[data-testid="add-transaction-btn"]').click();
    await page.locator('[data-testid="coin-select"]').selectOption('ethereum');
    await page.locator('[data-testid="transaction-type"]').selectOption('buy');
    await page.locator('[data-testid="amount-input"]').fill('10');
    await page.locator('[data-testid="price-input"]').fill('3000');
    await page.locator('[data-testid="save-transaction-btn"]').click();
    
    // Wait for transaction to be added
    await page.waitForTimeout(1000);
    
    // Check holdings are displayed
    await expect(page.locator('[data-testid="holdings-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="holding-item"]')).toHaveCount(1);
    
    // Check holding details
    await expect(page.locator('[data-testid="holding-item"]').first()).toContainText('ETH');
    await expect(page.locator('[data-testid="holding-item"]').first()).toContainText('10');
  });

  test('should calculate portfolio metrics correctly', async ({ page }) => {
    // Add multiple transactions
    const transactions = [
      { coin: 'bitcoin', type: 'buy', amount: '1', price: '50000' },
      { coin: 'ethereum', type: 'buy', amount: '10', price: '3000' }
    ];
    
    for (const transaction of transactions) {
      await page.locator('[data-testid="add-transaction-btn"]').click();
      await page.locator('[data-testid="coin-select"]').selectOption(transaction.coin);
      await page.locator('[data-testid="transaction-type"]').selectOption(transaction.type);
      await page.locator('[data-testid="amount-input"]').fill(transaction.amount);
      await page.locator('[data-testid="price-input"]').fill(transaction.price);
      await page.locator('[data-testid="save-transaction-btn"]').click();
      await page.waitForTimeout(500);
    }
    
    // Check portfolio metrics
    await expect(page.locator('[data-testid="total-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-invested"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-pnl"]')).toBeVisible();
    
    // Verify calculations (approximate)
    const totalValueText = await page.locator('[data-testid="total-value"]').textContent();
    expect(totalValueText).toContain('80,000'); // 1*50000 + 10*3000
  });

  test('should delete transaction successfully', async ({ page }) => {
    // Add a transaction first
    await page.locator('[data-testid="add-transaction-btn"]').click();
    await page.locator('[data-testid="coin-select"]').selectOption('bitcoin');
    await page.locator('[data-testid="transaction-type"]').selectOption('buy');
    await page.locator('[data-testid="amount-input"]').fill('1');
    await page.locator('[data-testid="price-input"]').fill('50000');
    await page.locator('[data-testid="save-transaction-btn"]').click();
    await page.waitForTimeout(1000);
    
    // Go to transactions tab
    await page.locator('[data-testid="transactions-tab"]').click();
    
    // Find and delete transaction
    await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible();
    await page.locator('[data-testid="delete-transaction-btn"]').first().click();
    
    // Confirm deletion
    await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible();
    await page.locator('[data-testid="confirm-delete-btn"]').click();
    
    // Wait for success notification
    await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-notification"]')).toContainText('Transaction deleted successfully');
  });

  test('should handle form validation correctly', async ({ page }) => {
    // Click add transaction button
    await page.locator('[data-testid="add-transaction-btn"]').click();
    
    // Try to submit empty form
    await page.locator('[data-testid="save-transaction-btn"]').click();
    
    // Check validation errors
    await expect(page.locator('[data-testid="coin-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="amount-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-error"]')).toBeVisible();
    
    // Check save button is disabled
    await expect(page.locator('[data-testid="save-transaction-btn"]')).toBeDisabled();
  });

  test('should be keyboard accessible', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="add-transaction-btn"]:focus')).toBeVisible();
    
    // Open modal with keyboard
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="transaction-modal"]')).toBeVisible();
    
    // Navigate form with keyboard
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="coin-select"]:focus')).toBeVisible();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="transaction-type"]:focus')).toBeVisible();
    
    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="transaction-modal"]')).not.toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile layout
    await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="holdings-section"]')).toBeVisible();
    
    // Test mobile menu
    await page.locator('[data-testid="mobile-menu-btn"]').click();
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Check navigation works on mobile
    await page.locator('[data-testid="dashboard-link"]').click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should handle offline state gracefully', async ({ page }) => {
    // Simulate offline state
    await page.context().setOffline(true);
    
    // Try to add transaction
    await page.locator('[data-testid="add-transaction-btn"]').click();
    
    // Check offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Check error message
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-error"]')).toContainText('No internet connection');
    
    // Restore online state
    await page.context().setOffline(false);
    await page.reload();
    
    // Check offline indicator is gone
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
  });

  test('should support dark mode', async ({ page }) => {
    // Check if dark mode toggle exists
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible();
    
    // Toggle dark mode
    await page.locator('[data-testid="theme-toggle"]').click();
    
    // Check dark mode class is applied
    await expect(page.locator('body')).toHaveClass(/dark/);
    
    // Check dark mode styles are applied
    const backgroundColor = await page.locator('body').evaluate(el => 
      getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).not.toBe('rgb(255, 255, 255)'); // Should not be white
  });

  test('should support internationalization', async ({ page }) => {
    // Check language selector exists
    await expect(page.locator('[data-testid="language-selector"]')).toBeVisible();
    
    // Change language to Spanish
    await page.locator('[data-testid="language-selector"]').selectOption('es');
    
    // Wait for language change
    await page.waitForTimeout(1000);
    
    // Check text is in Spanish
    await expect(page.locator('h1')).toContainText('Cartera');
    await expect(page.locator('[data-testid="add-transaction-btn"]')).toContainText('Agregar Transacción');
  });

  test('should load data from API correctly', async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/coins/markets', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', current_price: 60000 },
          { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', current_price: 3500 }
        ])
      });
    });
    
    // Reload page to trigger API call
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check data is loaded
    await expect(page.locator('[data-testid="price-data"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-data"]')).toContainText('BTC');
    await expect(page.locator('[data-testid="price-data"]')).toContainText('60,000');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/coins/markets', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Reload page to trigger API call
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check error state
    await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-state"]')).toContainText('Server is temporarily unavailable');
    
    // Check retry button exists
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
  });

  test('should maintain scroll position on navigation', async ({ page }) => {
    // Add enough transactions to create scroll
    for (let i = 0; i < 10; i++) {
      await page.locator('[data-testid="add-transaction-btn"]').click();
      await page.locator('[data-testid="coin-select"]').selectOption('bitcoin');
      await page.locator('[data-testid="transaction-type"]').selectOption('buy');
      await page.locator('[data-testid="amount-input"]').fill('0.1');
      await page.locator('[data-testid="price-input"]').fill('50000');
      await page.locator('[data-testid="save-transaction-btn"]').click();
      await page.waitForTimeout(200);
    }
    
    // Scroll down
    await page.locator('[data-testid="transactions-list"]').scrollIntoViewIfNeeded();
    const scrollPosition = await page.evaluate(() => window.scrollY);
    
    // Navigate away and back
    await page.locator('[data-testid="dashboard-link"]').click();
    await page.waitForTimeout(1000);
    await page.locator('[data-testid="portfolio-link"]').click();
    await page.waitForLoadState('networkidle');
    
    // Check scroll position is maintained
    const newScrollPosition = await page.evaluate(() => window.scrollY);
    expect(newScrollPosition).toBeCloseTo(scrollPosition, 0);
  });
});

test.describe('Portfolio Performance', () => {
  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good performance metrics', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              resolve({
                LCP: entry.startTime,
                FID: 0, // Would need separate measurement
                CLS: 0  // Would need separate measurement
              });
            }
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    expect(metrics.LCP).toBeLessThan(2500); // Good LCP
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    
    // Run accessibility checks
    const accessibility = await page.accessibility.snapshot();
    
    // Check for critical violations
    expect(accessibility.issues.filter(issue => issue.severity === 'critical')).toHaveLength(0);
    
    // Check for serious violations
    expect(accessibility.issues.filter(issue => issue.severity === 'serious')).toHaveLength(0);
    
    // Check color contrast
    const contrastIssues = accessibility.issues.filter(issue => 
      issue.type === 'color-contrast'
    );
    expect(contrastIssues).toHaveLength(0);
  });
});
