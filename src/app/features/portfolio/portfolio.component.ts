import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PortfolioStore } from '../../application/portfolio/store/portfolio.store';
import { SettingsStore } from '../../application/settings/store/settings.store';
import { ButtonComponent } from '../../shared/design-system/button/button.component';
import { CardComponent } from '../../shared/design-system/card/card.component';
import { SkeletonComponent } from '../../shared/design-system/skeleton/skeleton.component';
import { Price } from '../../../domain/value-objects/price';
import { Percentage } from '../../../domain/value-objects/percentage';
import { AllocationItem } from '../../../domain/models/portfolio-state.model';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonComponent,
    CardComponent,
    SkeletonComponent
  ],
  template: `
    <div class="portfolio">
      <header class="portfolio-header">
        <h1 class="portfolio-title">My Portfolio</h1>
        <div class="portfolio-actions">
          <ui-button 
            variant="primary" 
            size="sm"
            routerLink="/portfolio/transactions"
          >
            Add Transaction
          </ui-button>
          <ui-button 
            variant="secondary" 
            size="sm"
            (click)="exportPortfolio()"
          >
            Export
          </ui-button>
          <ui-button 
            variant="ghost" 
            size="sm"
            (click)="showImportDialog()"
          >
            Import
          </ui-button>
        </div>
      </header>

      <!-- Portfolio Summary -->
      <section class="portfolio-summary">
        <div class="summary-grid">
          <ui-card variant="elevated" size="md" class="summary-card">
            <div class="summary-content">
              <span class="summary-label">Total Value</span>
              <span class="summary-value">{{ formatCurrency(currentValue()) }}</span>
              <span class="summary-change" [class]="getChangeClass(pnl())">
                {{ formatChange(pnl()) }}
              </span>
            </div>
          </ui-card>
          
          <ui-card variant="elevated" size="md" class="summary-card">
            <div class="summary-content">
              <span class="summary-label">Total Invested</span>
              <span class="summary-value">{{ formatCurrency(totalInvested()) }}</span>
            </div>
          </ui-card>
          
          <ui-card variant="elevated" size="md" class="summary-card">
            <div class="summary-content">
              <span class="summary-label">Total P&L</span>
              <span class="summary-value" [class]="getChangeClass(pnl())">
                {{ formatCurrency(pnl()) }}
              </span>
              <span class="summary-percentage" [class]="getChangeClass(roi())">
                {{ formatPercentage(roi()) }}
              </span>
            </div>
          </ui-card>
          
          <ui-card variant="elevated" size="md" class="summary-card">
            <div class="summary-content">
              <span class="summary-label">Holdings</span>
              <span class="summary-value">{{ holdings().length }}</span>
              <span class="summary-sublabel">Unique coins</span>
            </div>
          </ui-card>
        </div>
      </section>

      <!-- Holdings and Allocation -->
      <div class="portfolio-content">
        <!-- Holdings List -->
        <section class="holdings-section">
          <div class="section-header">
            <h2>Holdings</h2>
            <div class="view-options">
              <button 
                class="view-toggle" 
                [class.active]="viewMode() === 'cards'"
                (click)="setViewMode('cards')"
              >
                Cards
              </button>
              <button 
                class="view-toggle" 
                [class.active]="viewMode() === 'table'"
                (click)="setViewMode('table')"
              >
                Table
              </button>
            </div>
          </div>

          @if (portfolioStore.isLoading()) {
            <div class="holdings-loading">
              @for (i of [1,2,3,4,5]; track i) {
                <ui-card variant="elevated" size="md" class="holding-skeleton">
                  <div class="holding-skeleton-content">
                    <ui-skeleton variant="circular" size="md" />
                    <div class="holding-skeleton-info">
                      <ui-skeleton variant="text" size="md" width="120px" />
                      <ui-skeleton variant="text" size="sm" width="80px" />
                      <ui-skeleton variant="text" size="xs" width="100px" />
                    </div>
                  </div>
                </ui-card>
              }
            </div>
          } @else if (holdings().length === 0) {
            <ui-card variant="outlined" size="lg" class="empty-state">
              <div class="empty-content">
                <h3>No Holdings Yet</h3>
                <p>Start building your portfolio by adding your first transaction.</p>
                <ui-button 
                  variant="primary" 
                  size="md"
                  routerLink="/portfolio/transactions"
                >
                  Add First Transaction
                </ui-button>
              </div>
            </ui-card>
          } @else {
            <div class="holdings-container" [class.card-view]="viewMode() === 'cards'" [class.table-view]="viewMode() === 'table'">
              @for (holding of holdings(); track holding.coinId) {
                @if (viewMode() === 'cards') {
                  <ui-card variant="elevated" size="md" class="holding-card">
                    <div class="holding-content">
                      <div class="holding-header">
                        <div class="holding-info">
                          <h3 class="coin-name">{{ getCoinName(holding.coinId) }}</h3>
                          <span class="coin-amount">{{ holding.amount }} coins</span>
                        </div>
                        <div class="holding-actions">
                          <ui-button 
                            variant="ghost" 
                            size="sm"
                            (click)="viewTransactions(holding.coinId)"
                          >
                            View
                          </ui-button>
                        </div>
                      </div>
                      <div class="holding-details">
                        <div class="detail-row">
                          <span class="detail-label">Avg Buy Price</span>
                          <span class="detail-value">{{ formatCurrency(holding.avgBuyPrice) }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">Current Value</span>
                          <span class="detail-value">{{ formatCurrency(getHoldingValue(holding)) }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">P&L</span>
                          <span class="detail-value" [class]="getChangeClass(getHoldingPnL(holding))">
                            {{ formatCurrency(getHoldingPnL(holding)) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </ui-card>
                } @else {
                  <div class="holding-row">
                    <div class="holding-table-info">
                      <span class="coin-name">{{ getCoinName(holding.coinId) }}</span>
                      <span class="coin-amount">{{ holding.amount }}</span>
                    </div>
                    <div class="holding-table-details">
                      <span>{{ formatCurrency(holding.avgBuyPrice) }}</span>
                      <span>{{ formatCurrency(getHoldingValue(holding)) }}</span>
                      <span [class]="getChangeClass(getHoldingPnL(holding))">
                        {{ formatCurrency(getHoldingPnL(holding)) }}
                      </span>
                    </div>
                    <div class="holding-table-actions">
                      <ui-button 
                        variant="ghost" 
                        size="sm"
                        (click)="viewTransactions(holding.coinId)"
                      >
                        View
                      </ui-button>
                    </div>
                  </div>
                }
              }
            </div>
          }
        </section>

        <!-- Allocation Chart -->
        @if (allocation().length > 0) {
          <section class="allocation-section">
            <div class="section-header">
              <h2>Portfolio Allocation</h2>
            </div>
            <ui-card variant="elevated" size="md" class="allocation-card">
              <div class="allocation-content">
                <div class="allocation-chart">
                  <!-- Simple pie chart representation -->
                  <div class="pie-chart">
                    @for (item of allocation(); track item.coinId; let i = $index) {
                      <div 
                        class="pie-slice" 
                        [style.background-color]="getCoinColor(item.coinId)"
                        [style.transform]="'rotate(' + getCumulativeRotation(i) + 'deg)'"
                        [style.clip-path]="'polygon(50% 50%, 50% 0%, ' + getSliceEndAngle(item.percentage) + ')'"
                      ></div>
                    }
                  </div>
                </div>
                <div class="allocation-legend">
                  @for (item of allocation(); track item.coinId) {
                    <div class="legend-item">
                      <div 
                        class="legend-color" 
                        [style.background-color]="getCoinColor(item.coinId)"
                      ></div>
                      <div class="legend-info">
                        <span class="legend-name">{{ getCoinName(item.coinId) }}</span>
                        <span class="legend-percentage">{{ item.percentage.toFixed(1) }}%</span>
                        <span class="legend-value">{{ formatCurrency(item.value) }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </ui-card>
          </section>
        }
      </div>

      <!-- Recent Transactions -->
      <section class="transactions-section">
        <div class="section-header">
          <h2>Recent Transactions</h2>
          <ui-button 
            variant="ghost" 
            size="sm"
            routerLink="/portfolio/transactions"
          >
            View All
          </ui-button>
        </div>

        @if (recentTransactions().length === 0) {
          <ui-card variant="outlined" size="md" class="empty-transactions">
            <p>No transactions yet. Add your first transaction to get started.</p>
          </ui-card>
        } @else {
          <div class="transactions-list">
            @for (transaction of recentTransactions(); track transaction.id) {
              <ui-card variant="outlined" size="sm" class="transaction-item">
                <div class="transaction-content">
                  <div class="transaction-info">
                    <span class="transaction-type" [class]="transaction.type">
                      {{ transaction.type.toUpperCase() }}
                    </span>
                    <span class="transaction-coin">{{ getCoinName(transaction.coinId) }}</span>
                    <span class="transaction-amount">{{ transaction.amount }}</span>
                  </div>
                  <div class="transaction-details">
                    <span class="transaction-price">{{ formatCurrency(transaction.price) }}</span>
                    <span class="transaction-date">{{ formatDate(transaction.date) }}</span>
                  </div>
                </div>
              </ui-card>
            }
          </div>
        }
      </section>
    </div>

    <!-- Hidden file input for import -->
    <input 
      type="file" 
      #fileInput 
      accept=".json" 
      style="display: none"
      (change)="handleFileImport($event)"
    />
  `,
  styles: [`
    .portfolio {
      padding: var(--spacing-lg);
      max-width: 1400px;
      margin: 0 auto;
    }

    .portfolio-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .portfolio-title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin: 0;
    }

    .portfolio-actions {
      display: flex;
      gap: var(--spacing-sm);
      align-items: center;
    }

    .portfolio-summary {
      margin-bottom: var(--spacing-2xl);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-lg);
    }

    .summary-card {
      transition: transform 0.2s ease;
    }

    .summary-content {
      padding: var(--spacing-lg);
      text-align: center;
    }

    .summary-label {
      display: block;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-medium);
      margin-bottom: var(--spacing-xs);
    }

    .summary-value {
      display: block;
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-xs);
    }

    .summary-change {
      display: block;
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
    }

    .summary-percentage {
      display: block;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
    }

    .summary-sublabel {
      display: block;
      font-size: var(--font-size-xs);
      color: var(--color-text-hint);
    }

    .positive {
      color: var(--color-success-500);
    }

    .negative {
      color: var(--color-danger-500);
    }

    .portfolio-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--spacing-2xl);
    }

    .holdings-section,
    .allocation-section,
    .transactions-section {
      margin-bottom: var(--spacing-2xl);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
    }

    .section-header h2 {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0;
    }

    .view-options {
      display: flex;
      gap: var(--spacing-xs);
      background-color: var(--color-gray-100);
      border-radius: var(--radius-md);
      padding: var(--spacing-xs);
    }

    .view-toggle {
      padding: var(--spacing-xs) var(--spacing-sm);
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      font-size: var(--font-size-sm);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .view-toggle.active {
      background-color: var(--color-primary-500);
      color: var(--color-white);
    }

    .holdings-container {
      display: grid;
      gap: var(--spacing-lg);
    }

    .holdings-container.card-view {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }

    .holdings-container.table-view {
      grid-template-columns: 1fr;
    }

    .holdings-loading {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--spacing-lg);
    }

    .holding-skeleton {
      margin-bottom: var(--spacing-md);
    }

    .holding-skeleton-content {
      padding: var(--spacing-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .holding-skeleton-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .holding-card {
      transition: transform 0.2s ease;
    }

    .holding-content {
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      height: 100%;
    }

    .holding-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .holding-info {
      flex: 1;
    }

    .coin-name {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-xs) 0;
    }

    .coin-amount {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .holding-details {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .detail-label {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .detail-value {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .holding-row {
      display: grid;
      grid-template-columns: 2fr 2fr 1fr;
      gap: var(--spacing-md);
      align-items: center;
      padding: var(--spacing-md);
      border-bottom: 1px solid var(--color-border-default);
    }

    .holding-table-info {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .holding-table-details {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }

    .holding-table-actions {
      display: flex;
      justify-content: flex-end;
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-2xl);
    }

    .empty-content h3 {
      font-size: var(--font-size-xl);
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-md);
    }

    .empty-content p {
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-lg);
    }

    .allocation-card {
      height: fit-content;
    }

    .allocation-content {
      padding: var(--spacing-lg);
      display: flex;
      gap: var(--spacing-xl);
      align-items: center;
    }

    .pie-chart {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      position: relative;
      background: conic-gradient(
        from 0deg,
        var(--color-gray-200) 0deg,
        var(--color-gray-200) 360deg
      );
    }

    .pie-slice {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      transform-origin: center;
    }

    .allocation-legend {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .legend-item {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
    }

    .legend-info {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .legend-name {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .legend-percentage {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }

    .legend-value {
      font-size: var(--font-size-xs);
      color: var(--color-text-hint);
    }

    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .transaction-item {
      transition: transform 0.2s ease;
    }

    .transaction-content {
      padding: var(--spacing-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .transaction-info {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }

    .transaction-type {
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
    }

    .transaction-type.buy {
      background-color: var(--color-success-100);
      color: var(--color-success-700);
    }

    .transaction-type.sell {
      background-color: var(--color-danger-100);
      color: var(--color-danger-700);
    }

    .transaction-coin {
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .transaction-amount {
      color: var(--color-text-secondary);
    }

    .transaction-details {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      align-items: flex-end;
    }

    .transaction-price {
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .transaction-date {
      font-size: var(--font-size-xs);
      color: var(--color-text-hint);
    }

    .empty-transactions {
      text-align: center;
      padding: var(--spacing-lg);
    }

    /* Responsive design */
    @media (max-width: 1024px) {
      .portfolio-content {
        grid-template-columns: 1fr;
      }

      .summary-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }
    }

    @media (max-width: 768px) {
      .portfolio {
        padding: var(--spacing-md);
      }

      .portfolio-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-md);
      }

      .holding-row {
        grid-template-columns: 1fr;
        gap: var(--spacing-sm);
      }

      .holding-table-details {
        flex-wrap: wrap;
      }

      .allocation-content {
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .pie-chart {
        width: 150px;
        height: 150px;
      }
    }

    /* Dark theme */
    [data-theme="dark"] .view-options {
      background-color: var(--color-gray-800);
    }

    [data-theme="dark"] .view-toggle.active {
      background-color: var(--color-primary-400);
    }

    [data-theme="dark"] .transaction-type.buy {
      background-color: var(--color-success-900);
      color: var(--color-success-300);
    }

    [data-theme="dark"] .transaction-type.sell {
      background-color: var(--color-danger-900);
      color: var(--color-danger-300);
    }
  `]
})
export class PortfolioComponent implements OnInit {
  portfolioStore = inject(PortfolioStore);
  settingsStore = inject(SettingsStore);

  // Signals
  private viewMode = signal<'cards' | 'table'>('cards');

  // Computed properties
  holdings = this.portfolioStore.holdings;
  currentValue = this.portfolioStore.currentValue;
  totalInvested = this.portfolioStore.totalInvested;
  pnl = this.portfolioStore.pnl;
  roi = this.portfolioStore.roi;
  allocation = this.portfolioStore.allocation;
  currency = this.settingsStore.currency;

  recentTransactions = computed(() => 
    this.portfolioStore.transactions().slice(0, 5)
  );

  ngOnInit(): void {
    // Portfolio data is loaded automatically by the store
  }

  setViewMode(mode: 'cards' | 'table'): void {
    this.viewMode.set(mode);
  }

  // Portfolio actions
  async exportPortfolio(): Promise<void> {
    try {
      const data = await this.portfolioStore.exportPortfolio();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export portfolio:', error);
    }
  }

  showImportDialog(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  async handleFileImport(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await this.portfolioStore.importPortfolio(text);
    } catch (error) {
      console.error('Failed to import portfolio:', error);
    }
  }

  viewTransactions(coinId: string): void {
    // Navigate to transactions filtered by coin
    console.log('View transactions for:', coinId);
  }

  // Utility methods
  getCoinName(coinId: string): string {
    // This would typically come from a market data store
    return coinId.charAt(0).toUpperCase() + coinId.slice(1);
  }

  getHoldingValue(holding: any): number {
    // This would calculate based on current price
    return holding.amount * holding.avgBuyPrice * 1.1; // Mock 10% gain
  }

  getHoldingPnL(holding: any): number {
    const currentValue = this.getHoldingValue(holding);
    const invested = holding.amount * holding.avgBuyPrice;
    return currentValue - invested;
  }

  getCoinColor(coinId: string): string {
    const colors = [
      '#3f51b5', '#e91e63', '#4caf50', '#ff9800', 
      '#2196f3', '#9c27b0', '#00bcd4', '#ffeb3b'
    ];
    const index = coinId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }

  getCumulativeRotation(index: number): number {
    const allocation = this.allocation();
    let rotation = 0;
    for (let i = 0; i < index; i++) {
      rotation += (allocation[i].percentage / 100) * 360;
    }
    return rotation;
  }

  getSliceEndAngle(percentage: number): string {
    const angle = (percentage / 100) * 360;
    const x = 50 + 50 * Math.cos((angle - 90) * Math.PI / 180);
    const y = 50 + 50 * Math.sin((angle - 90) * Math.PI / 180);
    return `50% 50%, ${x}% ${y}%`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatChange(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${this.formatCurrency(value)}`;
  }

  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  getChangeClass(value: number): string {
    return value >= 0 ? 'positive' : 'negative';
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }
}
