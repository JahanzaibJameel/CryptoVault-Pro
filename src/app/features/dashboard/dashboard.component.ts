import { Component, OnInit, computed, inject, signal, ChangeDetectionStrategy, untracked, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MarketDataStore } from '../../../application/market-data/store';
import { WatchlistStore } from '../../../application/watchlist/store';
import { SettingsStore } from '../../../application/settings/store';
import { ButtonComponent } from '../../shared/design-system/button/button.component';
import { CardComponent } from '../../shared/design-system/card/card.component';
import { SkeletonComponent } from '../../shared/design-system/skeleton/skeleton.component';
import { MarketChartComponent } from '../../shared/market-chart/market-chart.component';
import { NewsComponent } from '../../features/news/news.component';
import { Coin } from '../../../domain/models/coin.model';
import { MarketStatsCardComponent } from './components/market-stats-card.component';
import { CoinListComponent } from './components/coin-list.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    ScrollingModule,
    ButtonComponent,
    CardComponent,
    SkeletonComponent,
    MarketChartComponent,
    NewsComponent,
    MarketStatsCardComponent,
    CoinListComponent
  ],
  template: `
    <div class="dashboard animate-fade-in">
      <header class="dashboard-header">
        <div class="header-content">
          <h1 class="dashboard-title text-heading">Market Dashboard</h1>
          <p class="dashboard-subtitle text-secondary">Real-time cryptocurrency market analysis</p>
        </div>
        <div class="dashboard-actions">
          <ui-button 
            variant="secondary" 
            size="sm"
            (click)="refreshData()"
            [loading]="isLoading()"
            class="glass"
          >
            <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Refresh Data
          </ui-button>
          <ui-button 
            variant="ghost" 
            size="sm"
            routerLink="/watchlist"
            class="glass"
          >
            <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            Watchlist
          </ui-button>
        </div>
      </header>

      <!-- Market Overview Stats -->
      <section class="market-stats">
        <div class="stats-grid grid-cols-4">
          <app-market-stats-card 
            label="Total Market Cap"
            [value]="globalMarketData().totalMarketCap"
            type="market-cap"
            [currency]="currency()"
            style="animation-delay: 0s"
          />
          <app-market-stats-card 
            label="24h Volume"
            [value]="globalMarketData().totalVolume24h"
            type="volume"
            [currency]="currency()"
            style="animation-delay: 0.1s"
          />
          <app-market-stats-card 
            label="Market Cap Change"
            [value]="globalMarketData().marketCapChange24h"
            type="change"
            [currency]="currency()"
            style="animation-delay: 0.2s"
          />
          <app-market-stats-card 
            label="Fear & Greed Index"
            [value]="72"
            type="index"
            [currency]="currency()"
            style="animation-delay: 0.3s"
          />
        </div>
      </section>

      <!-- Top Coins -->
      <section class="top-coins">
        <div class="section-header">
          <div class="header-left">
            <h2 class="text-heading">Top Cryptocurrencies</h2>
            <p class="section-subtitle text-secondary">Market leaders by market capitalization</p>
          </div>
          <div class="view-options glass">
            <button 
              class="view-toggle" 
              [class.active]="viewMode() === 'grid'"
              (click)="setViewMode('grid')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/>
              </svg>
              Grid
            </button>
            <button 
              class="view-toggle" 
              [class.active]="viewMode() === 'list'"
              (click)="setViewMode('list')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
              List
            </button>
          </div>
        </div>

        <app-coin-list
          [coins]="topCoins()"
          [isLoading]="isLoading()"
          [viewMode]="viewMode()"
          [watchlistCoins]="watchlistCoins()"
          [currency]="currency()"
          (navigateToCoin)="navigateToCoin($event)"
          (toggleWatchlist)="toggleWatchlist($event)"
        />
      </section>

      <!-- Market Chart (Deferred) -->
      @defer (on viewport) {
        <section class="market-chart-section">
          <app-market-chart [data]="{
            symbol: 'MARKET',
            currentPrice: globalMarketData().totalMarketCap,
            change24h: globalMarketData().marketCapChange24h,
            volume24h: globalMarketData().totalVolume24h,
            chartData: []
          }" />
        </section>
      } @placeholder {
        <section class="market-chart-section">
          <ui-card variant="elevated" size="lg">
            <div class="chart-placeholder">
              <ui-skeleton variant="rectangular" size="lg" width="100%" height="300px" />
            </div>
          </ui-card>
        </section>
      }

      <!-- News Feed (Deferred) -->
      @defer (on viewport) {
        <section class="news-section">
          <app-news />
        </section>
      } @placeholder {
        <section class="news-section">
          <ui-card variant="elevated" size="lg">
            <div class="news-placeholder">
              <h3>Latest Crypto News</h3>
              <div class="news-skeletons">
                @for (i of [1,2,3]; track i) {
                  <div class="news-skeleton-item">
                    <ui-skeleton variant="rectangular" size="md" width="100%" height="120px" />
                    <div class="news-skeleton-text">
                      <ui-skeleton variant="text" size="md" width="80%" />
                      <ui-skeleton variant="text" size="sm" width="100%" />
                      <ui-skeleton variant="text" size="sm" width="60%" />
                    </div>
                  </div>
                }
              </div>
            </div>
          </ui-card>
        </section>
      }

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
    /* Cyber-Glass 2026 Dashboard Styles */
    .dashboard {
      padding: var(--spacing-6);
      max-width: 1400px;
      margin: 0 auto;
      min-height: 100vh;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-8);
      flex-wrap: wrap;
      gap: var(--spacing-6);
    }

    .header-content {
      flex: 1;
    }

    .dashboard-title {
      font-size: 2.5rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-2) 0;
      line-height: 1.2;
    }

    .dashboard-subtitle {
      font-size: 1rem;
      margin: 0;
      opacity: 0.8;
    }

    .dashboard-actions {
      display: flex;
      gap: var(--spacing-3);
      align-items: center;
    }

    /* Market Stats Section */
    .market-stats {
      margin-bottom: var(--spacing-8);
    }

    .stats-grid {
      display: grid;
      gap: var(--spacing-6);
    }

    .stat-card {
      transition: all var(--transition-normal);
    }

    .stat-card:hover {
      transform: translateY(-4px);
    }

    .stat-content {
      padding: 0;
    }

    .stat-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stat-icon.success {
      background: rgba(0, 227, 150, 0.1);
      color: var(--color-success);
      box-shadow: 0 0 20px rgba(0, 227, 150, 0.2);
    }

    .stat-icon.primary {
      background: rgba(0, 194, 255, 0.1);
      color: var(--color-primary);
      box-shadow: 0 0 20px rgba(0, 194, 255, 0.2);
    }

    .stat-icon.warning {
      background: rgba(255, 189, 0, 0.1);
      color: var(--color-warning);
      box-shadow: 0 0 20px rgba(255, 189, 0, 0.2);
    }

    .stat-icon.info {
      background: rgba(0, 194, 255, 0.1);
      color: var(--color-primary);
      box-shadow: 0 0 20px rgba(0, 194, 255, 0.2);
    }

    .stat-info {
      flex: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: var(--spacing-1);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      line-height: 1.2;
    }

    .stat-value.positive {
      color: var(--color-success);
    }

    .stat-value.negative {
      color: var(--color-danger);
    }

    /* Top Coins Section */
    .top-coins {
      margin-bottom: var(--spacing-8);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-6);
      flex-wrap: wrap;
      gap: var(--spacing-4);
    }

    .header-left h2 {
      font-size: 2rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-1) 0;
      line-height: 1.3;
    }

    .section-subtitle {
      font-size: 1rem;
      margin: 0;
      opacity: 0.7;
    }

    .view-options {
      display: flex;
      gap: var(--spacing-1);
      background: var(--color-bg-glass);
      border: 1px solid var(--color-border-glass);
      border-radius: var(--radius-lg);
      padding: var(--spacing-1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    .view-toggle {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      padding: var(--spacing-2) var(--spacing-3);
      border: none;
      background: transparent;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .view-toggle:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--color-text-primary);
    }

    .view-toggle.active {
      background: rgba(0, 194, 255, 0.2);
      color: var(--color-primary);
      border: 1px solid rgba(0, 194, 255, 0.3);
    }

    .coins-viewport {
      height: 600px;
      max-height: 70vh;
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .coins-container {
      display: grid;
      gap: var(--spacing-6);
      padding: var(--spacing-2);
    }

    .coins-container.grid-view {
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }

    .coins-container.list-view {
      grid-template-columns: 1fr;
    }

    .coins-loading {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--spacing-6);
    }

    .coin-skeleton {
      margin-bottom: 0;
    }

    .coin-skeleton-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
      padding: var(--spacing-6);
    }

    .coin-skeleton-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
    }

    .coin-skeleton-price {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
      align-items: flex-end;
    }

    .coin-card {
      transition: all var(--transition-normal);
      cursor: pointer;
    }

    .coin-card:hover {
      transform: translateY(-4px);
      border-color: var(--color-primary);
    }

    .coin-content {
      padding: var(--spacing-6);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4);
      height: 100%;
    }

    .coin-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
    }

    .coin-image {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-full);
      border: 2px solid var(--color-border);
    }

    .coin-image-small {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border);
    }

    .coin-info {
      flex: 1;
    }

    .coin-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
      line-height: 1.3;
    }

    .coin-symbol {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      font-weight: 500;
    }

    .coin-price {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1);
      align-items: flex-end;
    }

    .current-price {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 1.2;
    }

    .price-change {
      font-size: 0.875rem;
      font-weight: 500;
      padding: var(--spacing-1) var(--spacing-2);
      border-radius: var(--radius-sm);
    }

    .price-change.positive {
      color: var(--color-success);
      background: rgba(0, 227, 150, 0.1);
    }

    .price-change.negative {
      color: var(--color-danger);
      background: rgba(255, 77, 106, 0.1);
    }

    .coin-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-2) 0;
      border-top: 1px solid var(--color-border);
    }

    .market-cap {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .coin-actions {
      margin-top: auto;
      display: flex;
      justify-content: flex-end;
    }

    /* Market Chart Section */
    .market-chart-section {
      margin-bottom: var(--spacing-8);
    }

    .chart-placeholder {
      padding: var(--spacing-8);
      text-align: center;
    }

    /* News Section */
    .news-section {
      margin-bottom: var(--spacing-8);
    }

    .news-placeholder h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-6) 0;
    }

    .news-skeletons {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--spacing-6);
    }

    .news-skeleton-item {
      margin-bottom: 0;
    }

    .news-skeleton-text {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
      margin-top: var(--spacing-4);
    }

    /* Watchlist Preview */
    .watchlist-preview {
      margin-bottom: var(--spacing-8);
    }

    .watchlist-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: var(--spacing-4);
    }

    .watchlist-item {
      transition: all var(--transition-normal);
    }

    .watchlist-item:hover {
      transform: translateY(-2px);
    }

    .watchlist-content {
      padding: var(--spacing-4);
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
    }

    .watchlist-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1);
    }

    .watchlist-info .coin-name {
      font-size: 0.875rem;
      font-weight: 500;
      margin: 0;
    }

    .watchlist-info .coin-price {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-primary);
    }

    /* Quick Actions */
    .quick-actions {
      margin-bottom: var(--spacing-8);
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--spacing-4);
      padding: var(--spacing-6);
    }

    .action-button {
      width: 100%;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .stats-grid.grid-cols-4 {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .dashboard {
        padding: var(--spacing-4);
      }

      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-4);
      }

      .dashboard-title {
        font-size: 2rem;
      }

      .stats-grid.grid-cols-4,
      .stats-grid.grid-cols-2 {
        grid-template-columns: 1fr;
      }

      .coins-container.grid-view {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-3);
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }

      .watchlist-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .dashboard-title {
        font-size: 1.75rem;
      }

      .coin-header {
        gap: var(--spacing-3);
      }

      .coin-image {
        width: 40px;
        height: 40px;
      }

      .current-price {
        font-size: 1.125rem;
      }

      .dashboard-actions {
        flex-direction: column;
        width: 100%;
      }

      .dashboard-actions ui-button {
        width: 100%;
      }
    }

    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in {
      animation: fadeInUp 0.6s ease-out;
    }

    /* Glass effects for cards */
    .glass-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);
      border-radius: inherit;
      opacity: 0;
      transition: opacity var(--transition-fast);
      pointer-events: none;
    }

    .glass-card:hover::before {
      opacity: 1;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private marketDataStore: MarketDataStore = inject(MarketDataStore);
  private watchlistStore: WatchlistStore = inject(WatchlistStore);
  private settingsStore: SettingsStore = inject(SettingsStore);
  private destroyRef = inject(DestroyRef);

  // Signals
  viewMode = signal<'grid' | 'list'>('grid');
  globalMarketData = signal({
    totalMarketCap: 0,
    totalVolume24h: 0,
    marketCapChange24h: 0
  });

  // Simplified computed properties to avoid signal nesting
  topCoins = this.marketDataStore.topCoins;
  isLoading = this.marketDataStore.getIsLoadingTopCoins;
  watchlistCoins = computed(() => {
    const watchlistIds = this.watchlistStore.coins();
    return this.topCoins().filter((coin: Coin) => watchlistIds.includes(coin.id));
  });
  currency = this.settingsStore.currency;
  hasWatchlist = computed(() => this.watchlistStore.coins().length > 0);

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

  private loadGlobalMarketData(): void {
    this.marketDataStore.fetchGlobalMarket(this.currency())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.globalMarketData.set({
            totalMarketCap: data.totalMarketCap,
            totalVolume24h: data.totalVolume24h,
            marketCapChange24h: data.marketCapChange24h
          });
        },
        error: (error: any) => {
          console.error('Failed to load global market data:', error);
          // Use last cached value from store or empty state; never hardcode
          const cached = this.marketDataStore.lastGlobalMarket();
          if (cached) {
            this.globalMarketData.set(cached);
          } else {
            // Set empty state as last resort
            this.globalMarketData.set({
              totalMarketCap: 0,
              totalVolume24h: 0,
              marketCapChange24h: 0
            });
          }
        }
      });
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  navigateToCoin(coinId: string): void {
    // TODO: Navigate to coin detail page
  }

  toggleWatchlist(coinId: string): void {
    if (this.isInWatchlist(coinId)) {
      this.watchlistStore.removeCoin(coinId);
    } else {
      this.watchlistStore.addCoin(coinId);
    }
  }

  isInWatchlist = (coinId: string): boolean => {
    return untracked(() => this.watchlistStore.coins().includes(coinId));
  };

  // Optimized utility methods using untracked for expensive operations
  formatCurrency = (value: number): string => {
    return untracked(() => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency(),
      minimumFractionDigits: 0,
      maximumFractionDigits: value < 1 ? 6 : 2
    }).format(value));
  };

  formatMarketCap = (value: number): string => {
    return untracked(() => {
      if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
      if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
      return this.formatCurrency(value);
    });
  };

  formatPercentage = (value: number): string => {
    return untracked(() => {
      const sign = value >= 0 ? '+' : '';
      return `${sign}${value.toFixed(2)}%`;
    });
  };

  getChangeClass = (value: number): string => {
    return untracked(() => value >= 0 ? 'positive' : 'negative');
  };

  formatLastUpdated(): string {
    return new Date().toLocaleTimeString();
  }
}
