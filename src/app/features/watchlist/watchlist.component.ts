import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { RouterLink } from '@angular/router';
import { WatchlistStore } from '../../application/watchlist/store/watchlist.store';
import { MarketDataStore } from '../../application/market-data/store/market-data.store';
import { ButtonComponent } from '../../shared/design-system/button/button.component';
import { CardComponent } from '../../shared/design-system/card/card.component';
import { SkeletonComponent } from '../../shared/design-system/skeleton/skeleton.component';
import { Coin } from '../../../domain/models/coin.model';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    ScrollingModule,
    RouterLink,
    ButtonComponent,
    CardComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="watchlist-container animate-fade-in">
      <header class="watchlist-header">
        <div class="header-content">
          <h1 class="watchlist-title text-heading">Watchlist</h1>
          <p class="watchlist-subtitle text-secondary">Track your favorite cryptocurrencies</p>
        </div>
        <div class="watchlist-actions">
          <ui-button variant="secondary" size="sm" routerLink="/dashboard" class="glass">
            <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Back to Dashboard
          </ui-button>
        </div>
      </header>

      @if (watchlistStore.isLoading()) {
        <div class="watchlist-loading">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <ui-card variant="glass" size="md" class="watchlist-skeleton glass-card">
              <div class="skeleton-content">
                <ui-skeleton variant="circular" size="md" class="glass" />
                <div class="skeleton-info">
                  <ui-skeleton variant="text" size="sm" width="120px" class="glass" />
                  <ui-skeleton variant="text" size="xs" width="80px" class="glass" />
                </div>
              </div>
            </ui-card>
          }
        </div>
      } @else if (watchlistCoins().length === 0) {
        <ui-card variant="glass" size="lg" class="empty-watchlist glass-card">
          <div class="empty-content">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
            </div>
            <h2 class="empty-title">Your watchlist is empty</h2>
            <p class="empty-description">
              Add cryptocurrencies from the dashboard to track their prices here.
            </p>
            <ui-button variant="primary" size="md" routerLink="/dashboard" class="glass">
              <svg
                class="button-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
              Browse Cryptocurrencies
            </ui-button>
          </div>
        </ui-card>
      } @else {
        <ui-card variant="glass" size="lg" class="watchlist-card glass-card">
          <div slot="header">
            <div class="watchlist-header-content">
              <h2 class="watchlist-count text-heading">
                Your Watchlist ({{ watchlistCoins().length }})
              </h2>
              <span class="drag-hint glass">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 3L5 6.99h3V14h2V6.99h3L9 3zm7 14.01V10h-2v7.01h2L21 18l-5-1z" />
                </svg>
                Drag to reorder
              </span>
            </div>
          </div>

          <cdk-virtual-scroll-viewport itemSize="120" class="watchlist-viewport">
            <div cdkDropList (cdkDropListDropped)="drop($event)" class="watchlist-list">
              @for (coin of watchlistCoins(); track trackByCoin($index, coin)) {
                <div cdkDrag class="watchlist-item glass-item" [cdkDragDisabled]="false">
                  <div class="coin-content">
                    <div class="coin-drag-handle" cdkDragHandle>
                      <span class="drag-icon">⋮⋮</span>
                    </div>

                    <img [src]="coin.image" [alt]="coin.name" class="coin-image" loading="lazy" />

                    <div class="coin-info">
                      <h3 class="coin-name">{{ coin.name }}</h3>
                      <span class="coin-symbol">{{ coin.symbol }}</span>
                    </div>

                    <div class="coin-price">
                      <span class="current-price text-mono">{{
                        formatCurrency(coin.currentPrice)
                      }}</span>
                      <span class="price-change" [class]="getChangeClass(coin.priceChange24h)">
                        {{ formatPercentage(coin.priceChange24h) }}
                      </span>
                    </div>

                    <div class="coin-actions">
                      <ui-button
                        variant="ghost"
                        size="sm"
                        (click)="removeFromWatchlist(coin.id)"
                        class="glass"
                      >
                        <svg
                          class="button-icon"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                          />
                        </svg>
                        Remove
                      </ui-button>
                    </div>
                  </div>
                </div>
              }
            </div>
          </cdk-virtual-scroll-viewport>
        </ui-card>
      }
    </div>
  `,
  styleUrl: './watchlist.component.scss',
})
export class WatchlistComponent {
  watchlistStore = inject(WatchlistStore);
  private marketDataStore = inject(MarketDataStore);

  watchlistCoins = computed(() => {
    const watchlistIds = this.watchlistStore.coins();
    const allCoins = this.marketDataStore.allCoins();
    return allCoins.filter((coin: Coin) => watchlistIds.includes(coin.id));
  });

  drop(event: CdkDragDrop<string[]>) {
    const coins = [...this.watchlistStore.coins()];
    moveItemInArray(coins, event.previousIndex, event.currentIndex);
    this.watchlistStore.reorderFromList(coins);
  }

  removeFromWatchlist(coinId: string): void {
    this.watchlistStore.removeCoin(coinId);
  }

  trackByCoin(index: number, coin: Coin): string {
    return coin.id;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: value < 1 ? 6 : 2,
    }).format(value);
  }

  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  getChangeClass(value: number): string {
    return value >= 0 ? 'positive' : 'negative';
  }
}
