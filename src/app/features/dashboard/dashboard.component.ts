import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MarketDataStore } from '../../../application/market-data/store';
import { WatchlistStore } from '../../../application/watchlist/store';
import { SettingsStore } from '../../../application/settings/store';
import { ButtonComponent } from '../../shared/design-system/button/button.component';
import { CardComponent } from '../../shared/design-system/card/card.component';
import { SkeletonComponent } from '../../shared/design-system/skeleton/skeleton.component';
import { Coin } from '../../../domain/models/coin.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonComponent,
    CardComponent,
    SkeletonComponent
  ],
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1 class="dashboard-title">Crypto Dashboard</h1>
        <div class="dashboard-actions">
          <ui-button 
            variant="secondary" 
            size="sm"
            (click)="refreshData()"
            [loading]="isLoading()"
          >
            Refresh
          </ui-button>
          <ui-button 
            variant="ghost" 
            size="sm"
            routerLink="/watchlist"
          >
            Manage Watchlist
          </ui-button>
        </div>
      </header>

      <!-- Market Overview -->
      <section class="market-overview">
        <ui-card variant="elevated" size="lg">
          <div slot="header">
            <h2>Market Overview</h2>
            <span class="last-updated">
              Last updated: {{ formatLastUpdated() }}
            </span>
          </div>
          <div class="overview-content">
            @if (isLoading()) {
              <div class="overview-loading">
                <ui-skeleton variant="text" size="lg" width="200px" />
                <ui-skeleton variant="text" size="md" width="150px" />
                <ui-skeleton variant="rectangular" size="md" width="100px" height="100px" />
              </div>
            } @else {
              <div class="overview-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Market Cap</span>
                  <span class="stat-value">{{ formatCurrency(globalMarketData().totalMarketCap) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">24h Volume</span>
                  <span class="stat-value">{{ formatCurrency(globalMarketData().totalVolume24h) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Market Cap Change</span>
                  <span class="stat-value" [class]="getChangeClass(globalMarketData().marketCapChange24h)">
                    {{ formatPercentage(globalMarketData().marketCapChange24h) }}
                  </span>
                </div>
              </div>
            }
          </div>
        </ui-card>
      </section>

      <!-- Top Coins -->
      <section class="top-coins">
        <div class="section-header">
          <h2>Top Cryptocurrencies</h2>
          <div class="view-options">
            <button 
              class="view-toggle" 
              [class.active]="viewMode() === 'grid'"
              (click)="setViewMode('grid')"
            >
              Grid
            </button>
            <button 
              class="view-toggle" 
              [class.active]="viewMode() === 'list'"
              (click)="setViewMode('list')"
            >
              List
            </button>
          </div>
        </div>

        @if (isLoading()) {
          <div class="coins-loading">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <ui-card variant="elevated" size="md" class="coin-skeleton">
                <div class="coin-skeleton-content">
                  <ui-skeleton variant="circular" size="md" />
                  <div class="coin-skeleton-info">
                    <ui-skeleton variant="text" size="sm" width="100px" />
                    <ui-skeleton variant="text" size="xs" width="80px" />
                  </div>
                  <div class="coin-skeleton-price">
                    <ui-skeleton variant="text" size="md" width="120px" />
                    <ui-skeleton variant="text" size="xs" width="60px" />
                  </div>
                </div>
              </ui-card>
            }
          </div>
        } @else {
          <div class="coins-container" [class.grid-view]="viewMode() === 'grid'" [class.list-view]="viewMode() === 'list'">
            @for (coin of topCoins(); track coin.id) {
              <ui-card 
                variant="elevated" 
                size="md" 
                class="coin-card"
                [clickable]="true"
                (click)="navigateToCoin(coin.id)"
              >
                <div class="coin-content">
                  <div class="coin-header">
                    <img [src]="coin.image" [alt]="coin.name" class="coin-image" loading="lazy" />
                    <div class="coin-info">
                      <h3 class="coin-name">{{ coin.name }}</h3>
                      <span class="coin-symbol">{{ coin.symbol }}</span>
                    </div>
                  </div>
                  <div class="coin-price">
                    <span class="current-price">{{ formatCurrency(coin.currentPrice) }}</span>
                    <span class="price-change" [class]="getChangeClass(coin.priceChange24h)">
                      {{ formatPercentage(coin.priceChange24h) }}
                    </span>
                  </div>
                  <div class="coin-stats">
                    <span class="market-cap">{{ formatMarketCap(coin.marketCap) }}</span>
                  </div>
                  <div class="coin-actions">
                    <ui-button 
                      variant="ghost" 
                      size="sm"
                      (click)="toggleWatchlist(coin.id); $event.stopPropagation()"
                    >
                      {{ isInWatchlist(coin.id) ? 'Remove' : 'Add' }}
                    </ui-button>
                  </div>
                </div>
              </ui-card>
            }
          </div>
        }
      </section>

      <!-- Watchlist Preview -->
      @if (watchlistCoins().length > 0) {
        <section class="watchlist-preview">
          <div class="section-header">
            <h2>Your Watchlist</h2>
            <ui-button variant="ghost" size="sm" routerLink="/watchlist">
              View All
            </ui-button>
          </div>
          <div class="watchlist-grid">
            @for (coin of watchlistCoins().slice(0, 6); track coin.id) {
              <ui-card variant="outlined" size="sm" class="watchlist-item">
                <div class="watchlist-content">
                  <img [src]="coin.image" [alt]="coin.name" class="coin-image-small" loading="lazy" />
                  <div class="watchlist-info">
                    <span class="coin-name">{{ coin.name }}</span>
                    <span class="coin-price">{{ formatCurrency(coin.currentPrice) }}</span>
                  </div>
                </div>
              </ui-card>
            }
          </div>
        </section>
      }

      <!-- Quick Actions -->
      <section class="quick-actions">
        <ui-card variant="filled" size="md">
          <div slot="header">
            <h2>Quick Actions</h2>
          </div>
          <div class="actions-grid">
            <ui-button 
              variant="primary" 
              size="md"
              routerLink="/portfolio"
              class="action-button"
            >
              Manage Portfolio
            </ui-button>
            <ui-button 
              variant="secondary" 
              size="md"
              routerLink="/portfolio/transactions"
              class="action-button"
            >
              Add Transaction
            </ui-button>
            <ui-button 
              variant="ghost" 
              size="md"
              routerLink="/news"
              class="action-button"
            >
              Crypto News
            </ui-button>
            <ui-button 
              variant="ghost" 
              size="md"
              routerLink="/settings"
              class="action-button"
            >
              Settings
            </ui-button>
          </div>
        </ui-card>
      </section>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: var(--spacing-lg);
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .dashboard-title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin: 0;
    }

    .dashboard-actions {
      display: flex;
      gap: var(--spacing-sm);
      align-items: center;
    }

    .market-overview {
      margin-bottom: var(--spacing-2xl);
    }

    .overview-content {
      padding: var(--spacing-lg);
    }

    .overview-loading {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      align-items: flex-start;
    }

    .overview-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-lg);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-medium);
    }

    .stat-value {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .stat-value.positive {
      color: var(--color-success-500);
    }

    .stat-value.negative {
      color: var(--color-danger-500);
    }

    .last-updated {
      font-size: var(--font-size-xs);
      color: var(--color-text-hint);
    }

    .top-coins {
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

    .coins-container {
      display: grid;
      gap: var(--spacing-lg);
    }

    .coins-container.grid-view {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }

    .coins-container.list-view {
      grid-template-columns: 1fr;
    }

    .coins-loading {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--spacing-lg);
    }

    .coin-skeleton {
      margin-bottom: var(--spacing-md);
    }

    .coin-skeleton-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
    }

    .coin-skeleton-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .coin-skeleton-price {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      align-items: flex-end;
    }

    .coin-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .coin-content {
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      height: 100%;
    }

    .coin-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .coin-image {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .coin-image-small {
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }

    .coin-info {
      flex: 1;
    }

    .coin-name {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0;
    }

    .coin-symbol {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-transform: uppercase;
    }

    .coin-price {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      align-items: flex-start;
    }

    .current-price {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .price-change {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
    }

    .price-change.positive {
      color: var(--color-success-500);
    }

    .price-change.negative {
      color: var(--color-danger-500);
    }

    .coin-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .market-cap {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .coin-actions {
      margin-top: auto;
      display: flex;
      justify-content: flex-end;
    }

    .watchlist-preview {
      margin-bottom: var(--spacing-2xl);
    }

    .watchlist-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--spacing-md);
    }

    .watchlist-item {
      transition: transform 0.2s ease;
    }

    .watchlist-content {
      padding: var(--spacing-md);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .watchlist-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .quick-actions {
      margin-bottom: var(--spacing-2xl);
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
    }

    .action-button {
      width: 100%;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .dashboard {
        padding: var(--spacing-md);
      }

      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-md);
      }

      .overview-stats {
        grid-template-columns: 1fr;
      }

      .coins-container.grid-view {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-sm);
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Dark theme */
    [data-theme="dark"] .view-options {
      background-color: var(--color-gray-800);
    }

    [data-theme="dark"] .view-toggle.active {
      background-color: var(--color-primary-400);
    }
  `]
})
export class DashboardComponent implements OnInit {
  private marketDataStore: MarketDataStore = inject(MarketDataStore);
  private watchlistStore: WatchlistStore = inject(WatchlistStore);
  private settingsStore: SettingsStore = inject(SettingsStore);

  // Signals
  viewMode = signal<'grid' | 'list'>('grid');
  globalMarketData = signal({
    totalMarketCap: 0,
    totalVolume24h: 0,
    marketCapChange24h: 0
  });

  // Computed properties
  topCoins = this.marketDataStore.topCoins;
  isLoading = this.marketDataStore.isLoading();
  watchlistCoins = computed(() => {
    const watchlistIds = this.watchlistStore.coins();
    return this.topCoins().filter((coin: Coin) => watchlistIds.includes(coin.id));
  });
  currency = this.settingsStore.currency;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private async loadDashboardData(): Promise<void> {
    try {
      await Promise.all([
        this.marketDataStore.fetchTopCoins(this.currency()),
        this.loadGlobalMarketData()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  private async loadGlobalMarketData(): Promise<void> {
    // This would be implemented with a real API call
    // For now, using placeholder data
    this.globalMarketData.set({
      totalMarketCap: 2500000000000, // $2.5T
      totalVolume24h: 120000000000, // $120B
      marketCapChange24h: 2.5 // 2.5%
    });
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  navigateToCoin(coinId: string): void {
    // Navigate to coin detail page
    console.log('Navigate to coin:', coinId);
  }

  toggleWatchlist(coinId: string): void {
    if (this.isInWatchlist(coinId)) {
      this.watchlistStore.removeCoin(coinId);
    } else {
      this.watchlistStore.addCoin(coinId);
    }
  }

  isInWatchlist(coinId: string): boolean {
    return this.watchlistStore.coins().includes(coinId);
  }

  // Utility methods
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency(),
      minimumFractionDigits: 0,
      maximumFractionDigits: value < 1 ? 6 : 2
    }).format(value);
  }

  formatMarketCap(value: number): string {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else {
      return this.formatCurrency(value);
    }
  }

  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  getChangeClass(value: number): string {
    return value >= 0 ? 'positive' : 'negative';
  }

  formatLastUpdated(): string {
    return new Date().toLocaleTimeString();
  }
}
