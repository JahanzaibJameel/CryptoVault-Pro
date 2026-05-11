# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portfolio.spec.ts >> Portfolio Management >> should be responsive on mobile
- Location: tests\e2e\portfolio.spec.ts:163:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="mobile-menu-btn"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="mobile-menu-btn"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - img [ref=e7]
        - button "Toggle sidebar" [ref=e11] [cursor=pointer]:
          - img [ref=e12]
      - navigation [ref=e14]:
        - img [ref=e16]
        - img [ref=e19]
        - img [ref=e22]
        - img [ref=e25]
        - img [ref=e28]
    - generic [ref=e30]:
      - banner [ref=e31]:
        - generic [ref=e32]:
          - button "Toggle mobile menu" [ref=e33] [cursor=pointer]:
            - img [ref=e34]
          - generic [ref=e36]:
            - img [ref=e37]
            - textbox "Search coins, portfolios..." [ref=e39]
        - generic [ref=e40]:
          - button "Notifications" [ref=e43] [cursor=pointer]:
            - img [ref=e44]
            - generic [ref=e46]: "3"
          - img "User avatar" [ref=e48] [cursor=pointer]
      - main [ref=e49]:
        - generic [ref=e51]:
          - generic [ref=e52]:
            - generic [ref=e53]:
              - heading "Portfolio Overview" [level=1] [ref=e54]
              - paragraph [ref=e55]: Track your cryptocurrency investments and performance
            - generic [ref=e56]:
              - button "Add Transaction" [ref=e58] [cursor=pointer]:
                - generic [ref=e59]:
                  - img [ref=e60]
                  - text: Add Transaction
              - button "Export" [ref=e63] [cursor=pointer]:
                - generic [ref=e64]:
                  - img [ref=e65]
                  - text: Export
              - button "Import" [ref=e68] [cursor=pointer]:
                - generic [ref=e69]:
                  - img [ref=e70]
                  - text: Import
          - generic [ref=e73]:
            - generic [ref=e78]:
              - img [ref=e80]
              - generic [ref=e82]: Total Value$0 +$0
            - generic [ref=e87]:
              - img [ref=e89]
              - generic [ref=e91]: Total Invested$0
            - generic [ref=e96]:
              - img [ref=e98]
              - generic [ref=e100]: Total P&L $0 +0.00%
            - generic [ref=e105]:
              - img [ref=e107]
              - generic [ref=e109]: Holdings0Unique coins
          - generic [ref=e111]:
            - generic [ref=e112]:
              - generic [ref=e113]:
                - heading "Holdings" [level=2] [ref=e114]
                - paragraph [ref=e115]: Your cryptocurrency positions
              - generic [ref=e116]:
                - button "Cards" [ref=e117] [cursor=pointer]:
                  - img [ref=e118]
                  - text: Cards
                - button "Table" [ref=e120] [cursor=pointer]:
                  - img [ref=e121]
                  - text: Table
            - generic [ref=e126]:
              - heading "No Holdings Yet" [level=3] [ref=e127]
              - paragraph [ref=e128]: Start building your portfolio by adding your first transaction.
              - button "Add First Transaction" [ref=e130] [cursor=pointer]:
                - generic [ref=e131]: Add First Transaction
          - generic [ref=e132]:
            - generic [ref=e133]:
              - heading "Recent Transactions" [level=2] [ref=e134]
              - button "View All" [ref=e136] [cursor=pointer]:
                - generic [ref=e137]: View All
            - paragraph [ref=e141]: No transactions yet. Add your first transaction to get started.
      - contentinfo [ref=e142]:
        - generic [ref=e143]:
          - generic [ref=e144]: © 2026 CryptoVault Pro
          - generic [ref=e147]: System Online
  - generic [ref=e152]:
    - generic [ref=e153]:
      - heading "Network Simulation" [level=5] [ref=e154]
      - generic [ref=e155]:
        - button "🚫 Go Offline" [ref=e156] [cursor=pointer]
        - button "⚡ Open Circuit Breaker" [ref=e157] [cursor=pointer]
        - button "🐌 Throttle Network" [ref=e158] [cursor=pointer]
    - generic [ref=e159]:
      - heading "Storage Management" [level=5] [ref=e160]
      - generic [ref=e161]:
        - button "🗑️ Clear IndexedDB" [ref=e162] [cursor=pointer]
        - button "📤 Export Data" [ref=e163] [cursor=pointer]
        - button "📝 Fill Test Data" [ref=e164] [cursor=pointer]
    - generic [ref=e165]:
      - heading "Cache Statistics" [level=5] [ref=e166]
      - generic [ref=e167]:
        - generic [ref=e168]:
          - generic [ref=e169]: Cache Size
          - generic [ref=e170]: 0 items
        - generic [ref=e171]:
          - generic [ref=e172]: Circuit State
          - generic [ref=e173]: closed
        - generic [ref=e174]:
          - generic [ref=e175]: Failure Count
          - generic [ref=e176]: "0"
        - generic [ref=e177]:
          - generic [ref=e178]: Network Status
          - generic [ref=e179]: Online
    - generic [ref=e180]:
      - heading "Performance" [level=5] [ref=e181]
      - generic [ref=e182]:
        - button "🐢 Simulate Slow Network" [ref=e183] [cursor=pointer]
        - button "❌ Simulate API Errors" [ref=e184] [cursor=pointer]
```

# Test source

```ts
  68  |     // Check holding details
  69  |     await expect(page.locator('[data-testid="holding-item"]').first()).toContainText('ETH');
  70  |     await expect(page.locator('[data-testid="holding-item"]').first()).toContainText('10');
  71  |   });
  72  | 
  73  |   test('should calculate portfolio metrics correctly', async ({ page }) => {
  74  |     // Add multiple transactions
  75  |     const transactions = [
  76  |       { coin: 'bitcoin', type: 'buy', amount: '1', price: '50000' },
  77  |       { coin: 'ethereum', type: 'buy', amount: '10', price: '3000' }
  78  |     ];
  79  |     
  80  |     for (const transaction of transactions) {
  81  |       await page.locator('[data-testid="add-transaction-btn"]').click();
  82  |       await page.locator('[data-testid="coin-select"]').selectOption(transaction.coin);
  83  |       await page.locator('[data-testid="transaction-type"]').selectOption(transaction.type);
  84  |       await page.locator('[data-testid="amount-input"]').fill(transaction.amount);
  85  |       await page.locator('[data-testid="price-input"]').fill(transaction.price);
  86  |       await page.locator('[data-testid="save-transaction-btn"]').click();
  87  |       await page.waitForTimeout(500);
  88  |     }
  89  |     
  90  |     // Check portfolio metrics
  91  |     await expect(page.locator('[data-testid="total-value"]')).toBeVisible();
  92  |     await expect(page.locator('[data-testid="total-invested"]')).toBeVisible();
  93  |     await expect(page.locator('[data-testid="total-pnl"]')).toBeVisible();
  94  |     
  95  |     // Verify calculations (approximate)
  96  |     const totalValueText = await page.locator('[data-testid="total-value"]').textContent();
  97  |     expect(totalValueText).toContain('80,000'); // 1*50000 + 10*3000
  98  |   });
  99  | 
  100 |   test('should delete transaction successfully', async ({ page }) => {
  101 |     // Add a transaction first
  102 |     await page.locator('[data-testid="add-transaction-btn"]').click();
  103 |     await page.locator('[data-testid="coin-select"]').selectOption('bitcoin');
  104 |     await page.locator('[data-testid="transaction-type"]').selectOption('buy');
  105 |     await page.locator('[data-testid="amount-input"]').fill('1');
  106 |     await page.locator('[data-testid="price-input"]').fill('50000');
  107 |     await page.locator('[data-testid="save-transaction-btn"]').click();
  108 |     await page.waitForTimeout(1000);
  109 |     
  110 |     // Go to transactions tab
  111 |     await page.locator('[data-testid="transactions-tab"]').click();
  112 |     
  113 |     // Find and delete transaction
  114 |     await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible();
  115 |     await page.locator('[data-testid="delete-transaction-btn"]').first().click();
  116 |     
  117 |     // Confirm deletion
  118 |     await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible();
  119 |     await page.locator('[data-testid="confirm-delete-btn"]').click();
  120 |     
  121 |     // Wait for success notification
  122 |     await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
  123 |     await expect(page.locator('[data-testid="success-notification"]')).toContainText('Transaction deleted successfully');
  124 |   });
  125 | 
  126 |   test('should handle form validation correctly', async ({ page }) => {
  127 |     // Click add transaction button
  128 |     await page.locator('[data-testid="add-transaction-btn"]').click();
  129 |     
  130 |     // Try to submit empty form
  131 |     await page.locator('[data-testid="save-transaction-btn"]').click();
  132 |     
  133 |     // Check validation errors
  134 |     await expect(page.locator('[data-testid="coin-error"]')).toBeVisible();
  135 |     await expect(page.locator('[data-testid="amount-error"]')).toBeVisible();
  136 |     await expect(page.locator('[data-testid="price-error"]')).toBeVisible();
  137 |     
  138 |     // Check save button is disabled
  139 |     await expect(page.locator('[data-testid="save-transaction-btn"]')).toBeDisabled();
  140 |   });
  141 | 
  142 |   test('should be keyboard accessible', async ({ page }) => {
  143 |     // Test keyboard navigation
  144 |     await page.keyboard.press('Tab');
  145 |     await expect(page.locator('[data-testid="add-transaction-btn"]:focus')).toBeVisible();
  146 |     
  147 |     // Open modal with keyboard
  148 |     await page.keyboard.press('Enter');
  149 |     await expect(page.locator('[data-testid="transaction-modal"]')).toBeVisible();
  150 |     
  151 |     // Navigate form with keyboard
  152 |     await page.keyboard.press('Tab');
  153 |     await expect(page.locator('[data-testid="coin-select"]:focus')).toBeVisible();
  154 |     
  155 |     await page.keyboard.press('Tab');
  156 |     await expect(page.locator('[data-testid="transaction-type"]:focus')).toBeVisible();
  157 |     
  158 |     // Close modal with Escape
  159 |     await page.keyboard.press('Escape');
  160 |     await expect(page.locator('[data-testid="transaction-modal"]')).not.toBeVisible();
  161 |   });
  162 | 
  163 |   test('should be responsive on mobile', async ({ page }) => {
  164 |     // Set mobile viewport
  165 |     await page.setViewportSize({ width: 375, height: 667 });
  166 |     
  167 |     // Check mobile layout
> 168 |     await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible();
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
  169 |     await expect(page.locator('[data-testid="holdings-section"]')).toBeVisible();
  170 |     
  171 |     // Test mobile menu
  172 |     await page.locator('[data-testid="mobile-menu-btn"]').click();
  173 |     await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  174 |     
  175 |     // Check navigation works on mobile
  176 |     await page.locator('[data-testid="dashboard-link"]').click();
  177 |     await expect(page).toHaveURL(/dashboard/);
  178 |   });
  179 | 
  180 |   test('should handle offline state gracefully', async ({ page }) => {
  181 |     // Simulate offline state
  182 |     await page.context().setOffline(true);
  183 |     
  184 |     // Try to add transaction
  185 |     await page.locator('[data-testid="add-transaction-btn"]').click();
  186 |     
  187 |     // Check offline indicator
  188 |     await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
  189 |     
  190 |     // Check error message
  191 |     await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
  192 |     await expect(page.locator('[data-testid="network-error"]')).toContainText('No internet connection');
  193 |     
  194 |     // Restore online state
  195 |     await page.context().setOffline(false);
  196 |     await page.reload();
  197 |     
  198 |     // Check offline indicator is gone
  199 |     await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
  200 |   });
  201 | 
  202 |   test('should support dark mode', async ({ page }) => {
  203 |     // Check if dark mode toggle exists
  204 |     await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible();
  205 |     
  206 |     // Toggle dark mode
  207 |     await page.locator('[data-testid="theme-toggle"]').click();
  208 |     
  209 |     // Check dark mode class is applied
  210 |     await expect(page.locator('body')).toHaveClass(/dark/);
  211 |     
  212 |     // Check dark mode styles are applied
  213 |     const backgroundColor = await page.locator('body').evaluate(el => 
  214 |       getComputedStyle(el).backgroundColor
  215 |     );
  216 |     expect(backgroundColor).not.toBe('rgb(255, 255, 255)'); // Should not be white
  217 |   });
  218 | 
  219 |   test('should support internationalization', async ({ page }) => {
  220 |     // Check language selector exists
  221 |     await expect(page.locator('[data-testid="language-selector"]')).toBeVisible();
  222 |     
  223 |     // Change language to Spanish
  224 |     await page.locator('[data-testid="language-selector"]').selectOption('es');
  225 |     
  226 |     // Wait for language change
  227 |     await page.waitForTimeout(1000);
  228 |     
  229 |     // Check text is in Spanish
  230 |     await expect(page.locator('h1')).toContainText('Cartera');
  231 |     await expect(page.locator('[data-testid="add-transaction-btn"]')).toContainText('Agregar Transacción');
  232 |   });
  233 | 
  234 |   test('should load data from API correctly', async ({ page }) => {
  235 |     // Mock API responses for consistent testing
  236 |     await page.route('**/api/coins/markets', route => {
  237 |       route.fulfill({
  238 |         status: 200,
  239 |         contentType: 'application/json',
  240 |         body: JSON.stringify([
  241 |           { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', current_price: 60000 },
  242 |           { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', current_price: 3500 }
  243 |         ])
  244 |       });
  245 |     });
  246 |     
  247 |     // Reload page to trigger API call
  248 |     await page.reload();
  249 |     await page.waitForLoadState('networkidle');
  250 |     
  251 |     // Check data is loaded
  252 |     await expect(page.locator('[data-testid="price-data"]')).toBeVisible();
  253 |     await expect(page.locator('[data-testid="price-data"]')).toContainText('BTC');
  254 |     await expect(page.locator('[data-testid="price-data"]')).toContainText('60,000');
  255 |   });
  256 | 
  257 |   test('should handle API errors gracefully', async ({ page }) => {
  258 |     // Mock API error
  259 |     await page.route('**/api/coins/markets', route => {
  260 |       route.fulfill({
  261 |         status: 500,
  262 |         contentType: 'application/json',
  263 |         body: JSON.stringify({ error: 'Internal server error' })
  264 |       });
  265 |     });
  266 |     
  267 |     // Reload page to trigger API call
  268 |     await page.reload();
```