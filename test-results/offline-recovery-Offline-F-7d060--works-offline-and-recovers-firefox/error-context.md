# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-recovery.spec.ts >> Offline Functionality >> portfolio works offline and recovers
- Location: tests\e2e\offline-recovery.spec.ts:4:7

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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Offline Functionality', () => {
  4   |   test('portfolio works offline and recovers', async ({ page, context }) => {
  5   |     await page.goto('/portfolio');
  6   |     
  7   |     // Add a transaction while online
> 8   |     await page.click('[data-test=add-transaction]');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  9   |     await expect(page.locator('[data-test=transaction-modal]')).toBeVisible();
  10  |     await page.selectOption('[data-test=coin-select]', 'ethereum');
  11  |     await page.fill('[data-test=amount]', '0.5');
  12  |     await page.fill('[data-test=price]', '2000');
  13  |     await page.click('[data-test=submit]');
  14  |     
  15  |     // Verify transaction added
  16  |     await expect(page.locator('text=Transaction added successfully')).toBeVisible();
  17  |     await expect(page.locator('[data-test=transactions-list]')).toContainText('ETH');
  18  |     
  19  |     // Go offline
  20  |     await context.setOffline(true);
  21  |     
  22  |     // Reload page to simulate offline load
  23  |     await page.reload();
  24  |     
  25  |     // Should show offline banner
  26  |     await expect(page.locator('[data-test=offline-banner]')).toBeVisible();
  27  |     
  28  |     // Should still show cached data
  29  |     await expect(page.locator('[data-test=holdings-list]')).toContainText('Ethereum');
  30  |     await expect(page.locator('[data-test=transactions-list]')).toContainText('ETH');
  31  |     
  32  |     // Can still add transactions while offline
  33  |     await page.click('[data-test=add-transaction]');
  34  |     await page.selectOption('[data-test=coin-select]', 'cardano');
  35  |     await page.fill('[data-test=amount]', '100');
  36  |     await page.fill('[data-test=price]', '0.6');
  37  |     await page.click('[data-test=submit]');
  38  |     
  39  |     // Should show offline success message
  40  |     await expect(page.locator('text=Transaction saved locally')).toBeVisible();
  41  |     
  42  |     // Back online
  43  |     await context.setOffline(false);
  44  |     
  45  |     // Click refresh to trigger sync
  46  |     await page.click('[data-test=refresh-prices]');
  47  |     
  48  |     // Should hide offline banner
  49  |     await expect(page.locator('[data-test=offline-banner]')).not.toBeVisible();
  50  |     
  51  |     // Should show sync success
  52  |     await expect(page.locator('text=Data synchronized')).toBeVisible();
  53  |   });
  54  | 
  55  |   test('dashboard shows cached data offline', async ({ page, context }) => {
  56  |     await page.goto('/dashboard');
  57  |     
  58  |     // Wait for data to load
  59  |     await expect(page.locator('[data-test=market-overview]')).toBeVisible();
  60  |     
  61  |     // Go offline
  62  |     await context.setOffline(true);
  63  |     
  64  |     // Should show offline indicator
  65  |     await expect(page.locator('[data-test=offline-indicator]')).toBeVisible();
  66  |     
  67  |     // Should still show cached data
  68  |     await expect(page.locator('[data-test=top-coins]')).toBeVisible();
  69  |     
  70  |     // Refresh should use cached data
  71  |     await page.click('[data-test=refresh]');
  72  |     await expect(page.locator('[data-test=loading-skeleton]')).not.toBeVisible();
  73  |     
  74  |     // Back online
  75  |     await context.setOffline(false);
  76  |     
  77  |     // Should hide offline indicator
  78  |     await expect(page.locator('[data-test=offline-indicator]')).not.toBeVisible();
  79  |   });
  80  | 
  81  |   test('watchlist persists offline', async ({ page, context }) => {
  82  |     await page.goto('/watchlist');
  83  |     
  84  |     // Add coin to watchlist
  85  |     await page.click('[data-test=add-to-watchlist]');
  86  |     await page.selectOption('[data-test=coin-select]', 'solana');
  87  |     await page.click('[data-test=add-coin]');
  88  |     
  89  |     await expect(page.locator('[data-test=watchlist-item]')).toContainText('SOL');
  90  |     
  91  |     // Go offline
  92  |     await context.setOffline(true);
  93  |     await page.reload();
  94  |     
  95  |     // Should still show watchlist
  96  |     await expect(page.locator('[data-test=watchlist-item]')).toContainText('SOL');
  97  |     
  98  |     // Can reorder while offline
  99  |     await page.dragAndDrop('[data-test=watchlist-item]:first-child', '[data-test=watchlist-item]:last-child');
  100 |     
  101 |     // Back online
  102 |     await context.setOffline(false);
  103 |     
  104 |     // Should sync reordering
  105 |     await page.click('[data-test=save-order]');
  106 |     await expect(page.locator('text=Watchlist updated')).toBeVisible();
  107 |   });
  108 | });
```