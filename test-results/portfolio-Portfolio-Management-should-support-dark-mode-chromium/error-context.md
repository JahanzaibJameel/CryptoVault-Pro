# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portfolio.spec.ts >> Portfolio Management >> should support dark mode
- Location: tests\e2e\portfolio.spec.ts:202:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="theme-toggle"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="theme-toggle"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - img [ref=e7]
          - generic [ref=e11]: CryptoVault
        - button "Toggle sidebar" [ref=e12] [cursor=pointer]:
          - img [ref=e13]
      - navigation [ref=e15]:
        - generic [ref=e16]:
          - img [ref=e17]
          - generic [ref=e19]: Dashboard
        - generic [ref=e20]:
          - img [ref=e21]
          - generic [ref=e23]: Portfolio
        - generic [ref=e24]:
          - img [ref=e25]
          - generic [ref=e27]: Watchlist
        - generic [ref=e28]:
          - img [ref=e29]
          - generic [ref=e31]: News
        - generic [ref=e32]:
          - img [ref=e33]
          - generic [ref=e35]: Settings
      - generic [ref=e36]:
        - generic [ref=e39]: Connected
        - button "Toggle theme" [ref=e40] [cursor=pointer]:
          - img [ref=e41]
    - generic [ref=e43]:
      - banner [ref=e44]:
        - generic [ref=e46]:
          - img [ref=e47]
          - textbox "Search coins, portfolios..." [ref=e49]
        - generic [ref=e50]:
          - generic [ref=e53]: Live
          - button "Notifications" [ref=e54] [cursor=pointer]:
            - img [ref=e55]
            - generic [ref=e57]: "3"
          - img "User avatar" [ref=e59] [cursor=pointer]
      - main [ref=e60]:
        - generic [ref=e62]:
          - generic [ref=e63]:
            - generic [ref=e64]:
              - heading "Portfolio Overview" [level=1] [ref=e65]
              - paragraph [ref=e66]: Track your cryptocurrency investments and performance
            - generic [ref=e67]:
              - button "Add Transaction" [ref=e69] [cursor=pointer]:
                - generic [ref=e70]:
                  - img [ref=e71]
                  - text: Add Transaction
              - button "Export" [ref=e74] [cursor=pointer]:
                - generic [ref=e75]:
                  - img [ref=e76]
                  - text: Export
              - button "Import" [ref=e79] [cursor=pointer]:
                - generic [ref=e80]:
                  - img [ref=e81]
                  - text: Import
          - generic [ref=e84]:
            - generic [ref=e89]:
              - img [ref=e91]
              - generic [ref=e93]: Total Value$0 +$0
            - generic [ref=e98]:
              - img [ref=e100]
              - generic [ref=e102]: Total Invested$0
            - generic [ref=e107]:
              - img [ref=e109]
              - generic [ref=e111]: Total P&L $0 +0.00%
            - generic [ref=e116]:
              - img [ref=e118]
              - generic [ref=e120]: Holdings0Unique coins
          - generic [ref=e122]:
            - generic [ref=e123]:
              - generic [ref=e124]:
                - heading "Holdings" [level=2] [ref=e125]
                - paragraph [ref=e126]: Your cryptocurrency positions
              - generic [ref=e127]:
                - button "Cards" [ref=e128] [cursor=pointer]:
                  - img [ref=e129]
                  - text: Cards
                - button "Table" [ref=e131] [cursor=pointer]:
                  - img [ref=e132]
                  - text: Table
            - generic [ref=e137]:
              - heading "No Holdings Yet" [level=3] [ref=e138]
              - paragraph [ref=e139]: Start building your portfolio by adding your first transaction.
              - button "Add First Transaction" [ref=e141] [cursor=pointer]:
                - generic [ref=e142]: Add First Transaction
          - generic [ref=e143]:
            - generic [ref=e144]:
              - heading "Recent Transactions" [level=2] [ref=e145]
              - button "View All" [ref=e147] [cursor=pointer]:
                - generic [ref=e148]: View All
            - paragraph [ref=e152]: No transactions yet. Add your first transaction to get started.
      - contentinfo [ref=e153]:
        - generic [ref=e154]:
          - generic [ref=e155]: © 2026 CryptoVault Pro
          - generic [ref=e158]: System Online
  - generic [ref=e163]:
    - generic [ref=e164]:
      - heading "Network Simulation" [level=5] [ref=e165]
      - generic [ref=e166]:
        - button "🚫 Go Offline" [ref=e167] [cursor=pointer]
        - button "⚡ Open Circuit Breaker" [ref=e168] [cursor=pointer]
        - button "🐌 Throttle Network" [ref=e169] [cursor=pointer]
    - generic [ref=e170]:
      - heading "Storage Management" [level=5] [ref=e171]
      - generic [ref=e172]:
        - button "🗑️ Clear IndexedDB" [ref=e173] [cursor=pointer]
        - button "📤 Export Data" [ref=e174] [cursor=pointer]
        - button "📝 Fill Test Data" [ref=e175] [cursor=pointer]
    - generic [ref=e176]:
      - heading "Cache Statistics" [level=5] [ref=e177]
      - generic [ref=e178]:
        - generic [ref=e179]:
          - generic [ref=e180]: Cache Size
          - generic [ref=e181]: 0 items
        - generic [ref=e182]:
          - generic [ref=e183]: Circuit State
          - generic [ref=e184]: closed
        - generic [ref=e185]:
          - generic [ref=e186]: Failure Count
          - generic [ref=e187]: "0"
        - generic [ref=e188]:
          - generic [ref=e189]: Network Status
          - generic [ref=e190]: Online
    - generic [ref=e191]:
      - heading "Performance" [level=5] [ref=e192]
      - generic [ref=e193]:
        - button "🐢 Simulate Slow Network" [ref=e194] [cursor=pointer]
        - button "❌ Simulate API Errors" [ref=e195] [cursor=pointer]
```

# Test source

```ts
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
  168 |     await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible();
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
> 204 |     await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible();
      |                                                                ^ Error: expect(locator).toBeVisible() failed
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
  269 |     await page.waitForLoadState('networkidle');
  270 |     
  271 |     // Check error state
  272 |     await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
  273 |     await expect(page.locator('[data-testid="error-state"]')).toContainText('Server is temporarily unavailable');
  274 |     
  275 |     // Check retry button exists
  276 |     await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
  277 |   });
  278 | 
  279 |   test('should maintain scroll position on navigation', async ({ page }) => {
  280 |     // Add enough transactions to create scroll
  281 |     for (let i = 0; i < 10; i++) {
  282 |       await page.locator('[data-testid="add-transaction-btn"]').click();
  283 |       await page.locator('[data-testid="coin-select"]').selectOption('bitcoin');
  284 |       await page.locator('[data-testid="transaction-type"]').selectOption('buy');
  285 |       await page.locator('[data-testid="amount-input"]').fill('0.1');
  286 |       await page.locator('[data-testid="price-input"]').fill('50000');
  287 |       await page.locator('[data-testid="save-transaction-btn"]').click();
  288 |       await page.waitForTimeout(200);
  289 |     }
  290 |     
  291 |     // Scroll down
  292 |     await page.locator('[data-testid="transactions-list"]').scrollIntoViewIfNeeded();
  293 |     const scrollPosition = await page.evaluate(() => window.scrollY);
  294 |     
  295 |     // Navigate away and back
  296 |     await page.locator('[data-testid="dashboard-link"]').click();
  297 |     await page.waitForTimeout(1000);
  298 |     await page.locator('[data-testid="portfolio-link"]').click();
  299 |     await page.waitForLoadState('networkidle');
  300 |     
  301 |     // Check scroll position is maintained
  302 |     const newScrollPosition = await page.evaluate(() => window.scrollY);
  303 |     expect(newScrollPosition).toBeCloseTo(scrollPosition, 0);
  304 |   });
```