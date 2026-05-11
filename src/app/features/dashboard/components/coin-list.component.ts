import { Component, input, output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ButtonComponent } from '../../../shared/design-system/button/button.component';
import { CardComponent } from '../../../shared/design-system/card/card.component';
import { SkeletonComponent } from '../../../shared/design-system/skeleton/skeleton.component';
import { Coin } from '../../../../domain/models/coin.model';

@Component({
  selector: 'app-coin-list',
  standalone: true,
  imports: [
    CommonModule,
    ScrollingModule,
    ButtonComponent,
    CardComponent,
    SkeletonComponent
  ],
  template: `
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
      <cdk-virtual-scroll-viewport 
        itemSize="200" 
        class="coins-viewport"
        [class.grid-view]="viewMode() === 'grid'"
        [class.list-view]="viewMode() === 'list'"
      >
        <div class="coins-container">
          @for (coin of coins(); track coin.id) {
            <ui-card 
              variant="elevated" 
              size="md" 
              class="coin-card"
              [clickable]="true"
              (click)="navigateToCoin.emit(coin.id)"
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
                    (click)="toggleWatchlist.emit(coin.id); $event.stopPropagation()"
                  >
                    {{ isInWatchlist(coin.id) ? 'Remove' : 'Add' }}
                  </ui-button>
                </div>
              </div>
            </ui-card>
          }
        </div>
      </cdk-virtual-scroll-viewport>
    }
  `,
  styles: [`
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

    @media (max-width: 768px) {
      .coins-container.grid-view {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CoinListComponent {
  coins = input.required<Coin[]>();
  isLoading = input.required<boolean>();
  viewMode = input.required<'grid' | 'list'>();
  watchlistCoins = input<Coin[]>([]);
  currency = input('usd');

  navigateToCoin = output<string>();
  toggleWatchlist = output<string>();

  isInWatchlist(coinId: string): boolean {
    return this.watchlistCoins().some(coin => coin.id === coinId);
  }

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
}
