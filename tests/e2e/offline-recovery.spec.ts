import { test, expect } from '@playwright/test';

test.describe('Offline Functionality', () => {
  test('portfolio works offline and recovers', async ({ page, context }) => {
    await page.goto('/portfolio');
    
    // Add a transaction while online
    await page.click('[data-test=add-transaction]');
    await expect(page.locator('[data-test=transaction-modal]')).toBeVisible();
    await page.selectOption('[data-test=coin-select]', 'ethereum');
    await page.fill('[data-test=amount]', '0.5');
    await page.fill('[data-test=price]', '2000');
    await page.click('[data-test=submit]');
    
    // Verify transaction added
    await expect(page.locator('text=Transaction added successfully')).toBeVisible();
    await expect(page.locator('[data-test=transactions-list]')).toContainText('ETH');
    
    // Go offline
    await context.setOffline(true);
    
    // Reload page to simulate offline load
    await page.reload();
    
    // Should show offline banner
    await expect(page.locator('[data-test=offline-banner]')).toBeVisible();
    
    // Should still show cached data
    await expect(page.locator('[data-test=holdings-list]')).toContainText('Ethereum');
    await expect(page.locator('[data-test=transactions-list]')).toContainText('ETH');
    
    // Can still add transactions while offline
    await page.click('[data-test=add-transaction]');
    await page.selectOption('[data-test=coin-select]', 'cardano');
    await page.fill('[data-test=amount]', '100');
    await page.fill('[data-test=price]', '0.6');
    await page.click('[data-test=submit]');
    
    // Should show offline success message
    await expect(page.locator('text=Transaction saved locally')).toBeVisible();
    
    // Back online
    await context.setOffline(false);
    
    // Click refresh to trigger sync
    await page.click('[data-test=refresh-prices]');
    
    // Should hide offline banner
    await expect(page.locator('[data-test=offline-banner]')).not.toBeVisible();
    
    // Should show sync success
    await expect(page.locator('text=Data synchronized')).toBeVisible();
  });

  test('dashboard shows cached data offline', async ({ page, context }) => {
    await page.goto('/dashboard');
    
    // Wait for data to load
    await expect(page.locator('[data-test=market-overview]')).toBeVisible();
    
    // Go offline
    await context.setOffline(true);
    
    // Should show offline indicator
    await expect(page.locator('[data-test=offline-indicator]')).toBeVisible();
    
    // Should still show cached data
    await expect(page.locator('[data-test=top-coins]')).toBeVisible();
    
    // Refresh should use cached data
    await page.click('[data-test=refresh]');
    await expect(page.locator('[data-test=loading-skeleton]')).not.toBeVisible();
    
    // Back online
    await context.setOffline(false);
    
    // Should hide offline indicator
    await expect(page.locator('[data-test=offline-indicator]')).not.toBeVisible();
  });

  test('watchlist persists offline', async ({ page, context }) => {
    await page.goto('/watchlist');
    
    // Add coin to watchlist
    await page.click('[data-test=add-to-watchlist]');
    await page.selectOption('[data-test=coin-select]', 'solana');
    await page.click('[data-test=add-coin]');
    
    await expect(page.locator('[data-test=watchlist-item]')).toContainText('SOL');
    
    // Go offline
    await context.setOffline(true);
    await page.reload();
    
    // Should still show watchlist
    await expect(page.locator('[data-test=watchlist-item]')).toContainText('SOL');
    
    // Can reorder while offline
    await page.dragAndDrop('[data-test=watchlist-item]:first-child', '[data-test=watchlist-item]:last-child');
    
    // Back online
    await context.setOffline(false);
    
    // Should sync reordering
    await page.click('[data-test=save-order]');
    await expect(page.locator('text=Watchlist updated')).toBeVisible();
  });
});
