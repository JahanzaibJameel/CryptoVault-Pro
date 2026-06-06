import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/design-system/button/button.component';
import { CardComponent } from '../../shared/design-system/card/card.component';
import { MarketDataStore } from '../../../application/market-data/store';

@Component({
  selector: 'app-coin-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonComponent,
    CardComponent
  ],
  template: `
    <div class="coin-detail animate-fade-in">
      <header class="detail-header">
        <div>
          <h1 class="detail-title">Coin details</h1>
          <p class="detail-subtitle text-secondary">Deep dive into the selected market asset.</p>
        </div>
        <ui-button variant="ghost" size="sm" (click)="goBack()" class="glass">
          Back
        </ui-button>
      </header>

      <section *ngIf="coin() as coin; else notFound">
        <ui-card variant="elevated" size="lg" class="detail-card">
          <div class="detail-grid">
            <div class="detail-summary">
              <div class="detail-top">
                <img [src]="coin.image" [alt]="coin.name" class="coin-image" />
                <div>
                  <h2>{{ coin.name }}</h2>
                  <p class="text-secondary">{{ coin.symbol }}</p>
                </div>
              </div>

              <div class="detail-metrics">
                <div>
                  <span class="label">Current Price</span>
                  <p>{{ formatCurrency(coin.currentPrice) }}</p>
                </div>
                <div>
                  <span class="label">24h Change</span>
                  <p [class.positive]="coin.priceChange24h >= 0" [class.negative]="coin.priceChange24h < 0">
                    {{ formatPercentage(coin.priceChange24h) }}
                  </p>
                </div>
                <div>
                  <span class="label">Market Cap</span>
                  <p>{{ formatMarketCap(coin.marketCap) }}</p>
                </div>
              </div>
            </div>

            <div class="detail-actions">
              <ui-button
                variant="primary"
                size="md"
                [routerLink]="['/portfolio/transactions']"
                [queryParams]="{ coin: coin.id }"
              >
                View Coin Transactions
              </ui-button>
            </div>
          </div>
        </ui-card>
      </section>

      <ng-template #notFound>
        <ui-card variant="outlined" size="lg" class="detail-card">
          <p class="text-secondary">Coin not found yet. Please refresh the dashboard to load the latest market data.</p>
        </ui-card>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .detail-title {
        margin: 0;
      }

      .detail-card {
        padding: 2rem;
      }

      .detail-grid {
        display: grid;
        gap: 2rem;
        grid-template-columns: 1fr;
      }

      .detail-top {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .coin-image {
        width: 64px;
        height: 64px;
        border-radius: 9999px;
        object-fit: contain;
      }

      .detail-metrics {
        display: grid;
        gap: 1rem;
        margin-top: 1.5rem;
      }

      .label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--color-text-secondary);
        font-size: 0.875rem;
      }

      .positive {
        color: var(--color-success);
      }

      .negative {
        color: var(--color-warning);
      }
    `
  ]
})
export class CoinDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private marketDataStore = inject(MarketDataStore);

  coinId = signal<string>('');
  coin = computed(() => this.marketDataStore.getCoinById(this.coinId()));

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const coinId = params.get('coinId');
      this.coinId.set(coinId ?? '');
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  formatMarketCap(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }
}
