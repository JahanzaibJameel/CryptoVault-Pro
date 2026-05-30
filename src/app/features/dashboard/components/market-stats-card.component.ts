import { Component, input, computed } from '@angular/core';
import { CardComponent } from '../../../shared/design-system/card/card.component';

@Component({
  selector: 'app-market-stats-card',
  standalone: true,
  imports: [CardComponent],
  template: `
    <ui-card variant="glass" size="md" class="stat-card glass-card animate-fade-in">
      <div class="stat-content">
        <div class="stat-header">
          <div class="stat-icon" [class]="iconClass()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path [attr.d]="iconPath()" />
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-label text-hint">{{ label() }}</span>
            <span class="stat-value text-mono" [class]="getChangeClass(value())">
              {{ formattedValue() }}
            </span>
          </div>
        </div>
      </div>
    </ui-card>
  `,
  styles: [
    `
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
    `,
  ],
})
export class MarketStatsCardComponent {
  label = input.required<string>();
  value = input.required<number>();
  type = input<'market-cap' | 'volume' | 'change' | 'index'>('market-cap');
  currency = input('usd');

  formattedValue = computed(() => {
    const val = this.value();
    const type = this.type();
    const currency = this.currency();

    switch (type) {
      case 'market-cap':
        return this.formatMarketCap(val);
      case 'volume':
        return this.formatMarketCap(val);
      case 'change':
        return this.formatPercentage(val);
      case 'index':
        return val.toString();
      default:
        return this.formatCurrency(val, currency);
    }
  });

  iconClass = computed(() => {
    const type = this.type();
    return type === 'change'
      ? 'warning'
      : type === 'volume'
        ? 'primary'
        : type === 'index'
          ? 'info'
          : 'success';
  });

  iconPath = computed(() => {
    const type = this.type();
    switch (type) {
      case 'market-cap':
        return 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.81.45 1.61 1.67 1.61 1.16 0 1.6-.64 1.6-1.46 0-.84-.68-1.22-1.88-1.54-1.55-.38-3.03-1.06-3.03-2.88 0-1.62 1.39-2.55 3.11-2.89V4h2.67v1.71c1.63.31 2.71 1.42 2.83 2.95h-1.96c-.11-.75-.47-1.43-1.39-1.43-1.06 0-1.46.59-1.46 1.28 0 .64.41 1.02 1.7 1.36 1.7.42 3.2 1.17 3.2 3.02 0 1.8-1.48 2.66-3.22 3.02z';
      case 'volume':
        return 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
      case 'change':
        return 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z';
      case 'index':
        return 'M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2zm0 4h2v-2h-2v2z';
      default:
        return '';
    }
  });

  getChangeClass(value: number): string {
    return value >= 0 ? 'positive' : 'negative';
  }

  private formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: value < 1 ? 6 : 2,
    }).format(value);
  }

  private formatMarketCap(value: number): string {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else {
      return this.formatCurrency(value, 'USD');
    }
  }

  private formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }
}
