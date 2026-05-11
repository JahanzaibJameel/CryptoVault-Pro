# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portfolio.spec.ts >> Portfolio Management >> should display portfolio page correctly
- Location: tests\e2e\portfolio.spec.ts:12:7

# Error details

```
Error: expect(page).toHaveTitle(expected) failed

Expected pattern: /Portfolio/
Received string:  "CryptoVault Pro"
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    9 × unexpected value "CryptoVault Pro"

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
  3   | test.describe('Portfolio Management', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Navigate to portfolio page
  6   |     await page.goto('/portfolio');
  7   |     
  8   |     // Wait for page to load
  9   |     await page.waitForLoadState('networkidle');
  10  |   });
  11  | 
  12  |   test('should display portfolio page correctly', async ({ page }) => {
  13  |     // Check page title
> 14  |     await expect(page).toHaveTitle(/Portfolio/);
      |                        ^ Error: expect(page).toHaveTitle(expected) failed
  15  |     
  16  |     // Check main elements are visible
  17  |     await expect(page.locator('h1')).toContainText('Portfolio');
  18  |     await expect(page.locator('[data-testid="holdings-section"]')).toBeVisible();
  19  |     await expect(page.locator('[data-testid="transactions-section"]')).toBeVisible();
  20  |   });
  21  | 
  22  |   test('should display empty state when no holdings', async ({ page }) => {
  23  |     // Check for empty state
  24  |     await expect(page.locator('[data-testid="empty-holdings"]')).toBeVisible();
  25  |     await expect(page.locator('[data-testid="empty-holdings"]')).toContainText('No holdings yet');
  26  |   });
  27  | 
  28  |   test('should add new transaction successfully', async ({ page }) => {
  29  |     // Click add transaction button
  30  |     await page.locator('[data-testid="add-transaction-btn"]').click();
  31  |     
  32  |     // Wait for modal to open
  33  |     await expect(page.locator('[data-testid="transaction-modal"]')).toBeVisible();
  34  |     
  35  |     // Fill form
  36  |     await page.locator('[data-testid="coin-select"]').selectOption('bitcoin');
  37  |     await page.locator('[data-testid="transaction-type"]').selectOption('buy');
  38  |     await page.locator('[data-testid="amount-input"]').fill('0.5');
  39  |     await page.locator('[data-testid="price-input"]').fill('50000');
  40  |     
  41  |     // Submit form
  42  |     await page.locator('[data-testid="save-transaction-btn"]').click();
  43  |     
  44  |     // Wait for success notification
  45  |     await expect(page.locator('[data-testid="success-notification"]')).toBeVisible();
  46  |     await expect(page.locator('[data-testid="success-notification"]')).toContainText('Transaction added successfully');
  47  |     
  48  |     // Check modal is closed
  49  |     await expect(page.locator('[data-testid="transaction-modal"]')).not.toBeVisible();
  50  |   });
  51  | 
  52  |   test('should display holdings after adding transactions', async ({ page }) => {
  53  |     // Add a transaction first
  54  |     await page.locator('[data-testid="add-transaction-btn"]').click();
  55  |     await page.locator('[data-testid="coin-select"]').selectOption('ethereum');
  56  |     await page.locator('[data-testid="transaction-type"]').selectOption('buy');
  57  |     await page.locator('[data-testid="amount-input"]').fill('10');
  58  |     await page.locator('[data-testid="price-input"]').fill('3000');
  59  |     await page.locator('[data-testid="save-transaction-btn"]').click();
  60  |     
  61  |     // Wait for transaction to be added
  62  |     await page.waitForTimeout(1000);
  63  |     
  64  |     // Check holdings are displayed
  65  |     await expect(page.locator('[data-testid="holdings-list"]')).toBeVisible();
  66  |     await expect(page.locator('[data-testid="holding-item"]')).toHaveCount(1);
  67  |     
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
```