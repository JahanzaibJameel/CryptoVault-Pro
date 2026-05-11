# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: buy-flow.spec.ts >> Portfolio Buy Flow >> complete a buy transaction
- Location: tests\e2e\buy-flow.spec.ts:4:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-test=add-transaction]')

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
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Portfolio Buy Flow', () => {
  4  |   test('complete a buy transaction', async ({ page }) => {
  5  |     await page.goto('/portfolio');
  6  |     
  7  |     // Click add transaction button
> 8  |     await page.click('[data-test=add-transaction]');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  9  |     
  10 |     // Wait for modal to appear
  11 |     await expect(page.locator('[data-test=transaction-modal]')).toBeVisible();
  12 |     
  13 |     // Select Bitcoin
  14 |     await page.selectOption('[data-test=coin-select]', 'bitcoin');
  15 |     
  16 |     // Fill amount
  17 |     await page.fill('[data-test=amount]', '1');
  18 |     
  19 |     // Set price
  20 |     await page.fill('[data-test=price]', '35000');
  21 |     
  22 |     // Submit form
  23 |     await page.click('[data-test=submit]');
  24 |     
  25 |     // Verify success message
  26 |     await expect(page.locator('text=Transaction added successfully')).toBeVisible();
  27 |     
  28 |     // Verify transaction appears in list
  29 |     await expect(page.locator('[data-test=transactions-list]')).toContainText('BTC');
  30 |     
  31 |     // Verify holdings updated
  32 |     await expect(page.locator('[data-test=holdings-list]')).toContainText('Bitcoin');
  33 |   });
  34 | 
  35 |   test('validation prevents invalid transactions', async ({ page }) => {
  36 |     await page.goto('/portfolio');
  37 |     
  38 |     await page.click('[data-test=add-transaction]');
  39 |     await expect(page.locator('[data-test=transaction-modal]')).toBeVisible();
  40 |     
  41 |     // Try to submit without amount
  42 |     await page.selectOption('[data-test=coin-select]', 'bitcoin');
  43 |     await page.click('[data-test=submit]');
  44 |     
  45 |     // Should show validation error
  46 |     await expect(page.locator('text=Amount is required')).toBeVisible();
  47 |     
  48 |     // Fill invalid amount
  49 |     await page.fill('[data-test=amount]', '-1');
  50 |     await page.click('[data-test=submit]');
  51 |     
  52 |     // Should show positive amount error
  53 |     await expect(page.locator('text=Amount must be positive')).toBeVisible();
  54 |   });
  55 | });
  56 | 
```