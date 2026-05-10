import { test, expect } from '@playwright/test';

test.describe('Portfolio Buy Flow', () => {
  test('complete a buy transaction', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Click add transaction button
    await page.click('[data-test=add-transaction]');
    
    // Wait for modal to appear
    await expect(page.locator('[data-test=transaction-modal]')).toBeVisible();
    
    // Select Bitcoin
    await page.selectOption('[data-test=coin-select]', 'bitcoin');
    
    // Fill amount
    await page.fill('[data-test=amount]', '1');
    
    // Set price
    await page.fill('[data-test=price]', '35000');
    
    // Submit form
    await page.click('[data-test=submit]');
    
    // Verify success message
    await expect(page.locator('text=Transaction added successfully')).toBeVisible();
    
    // Verify transaction appears in list
    await expect(page.locator('[data-test=transactions-list]')).toContainText('BTC');
    
    // Verify holdings updated
    await expect(page.locator('[data-test=holdings-list]')).toContainText('Bitcoin');
  });

  test('validation prevents invalid transactions', async ({ page }) => {
    await page.goto('/portfolio');
    
    await page.click('[data-test=add-transaction]');
    await expect(page.locator('[data-test=transaction-modal]')).toBeVisible();
    
    // Try to submit without amount
    await page.selectOption('[data-test=coin-select]', 'bitcoin');
    await page.click('[data-test=submit]');
    
    // Should show validation error
    await expect(page.locator('text=Amount is required')).toBeVisible();
    
    // Fill invalid amount
    await page.fill('[data-test=amount]', '-1');
    await page.click('[data-test=submit]');
    
    // Should show positive amount error
    await expect(page.locator('text=Amount must be positive')).toBeVisible();
  });
});
