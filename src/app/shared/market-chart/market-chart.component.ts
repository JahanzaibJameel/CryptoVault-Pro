import { Component, input, signal, computed, inject, AfterViewInit, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../design-system/card/card.component';
import { SkeletonComponent } from '../design-system/skeleton/skeleton.component';

interface ChartDataPoint {
  time: number;
  value: number;
}

interface MarketData {
  symbol: string;
  currentPrice: number;
  change24h: number;
  volume24h: number;
  chartData: ChartDataPoint[];
}

@Component({
  selector: 'app-market-chart',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    SkeletonComponent
  ],
  template: `
    <ui-card variant="elevated" size="lg" class="market-chart">
      <div slot="header">
        <h2>Market Overview</h2>
        <div class="chart-controls">
          <select (change)="onTimeframeChange($event)" class="timeframe-select">
            <option value="1D">1 Day</option>
            <option value="1W">1 Week</option>
            <option value="1M">1 Month</option>
            <option value="3M">3 Months</option>
          </select>
        </div>
      </div>
      
      <div class="chart-content">
        @if (isLoading()) {
          <div class="chart-loading">
            <ui-skeleton variant="rectangular" size="lg" width="100%" height="300px" />
          </div>
        } @else if (chartData().length > 0) {
          <div class="chart-container">
            <canvas 
              #chartCanvas 
              class="chart-canvas"
              (window:resize)="onResize()"
            ></canvas>
          </div>
          
          <div class="chart-stats">
            <div class="stat-item">
              <span class="stat-label">Current Price</span>
              <span class="stat-value">{{ formatCurrency(data().currentPrice) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">24h Change</span>
              <span class="stat-value" [class]="getChangeClass(data().change24h)">
                {{ formatPercentage(data().change24h) }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">24h Volume</span>
              <span class="stat-value">{{ formatVolume(data().volume24h) }}</span>
            </div>
          </div>
        } @else {
          <div class="chart-empty">
            <p>No chart data available</p>
          </div>
        }
      </div>
    </ui-card>
  `,
  styleUrl: './market-chart.component.scss'
})
export class MarketChartComponent implements AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) private chartCanvasRef?: ElementRef<HTMLCanvasElement>;

  data = input.required<MarketData>();
  isLoading = signal(true);
  timeframe = signal<'1D' | '1W' | '1M' | '3M'>('1D');

  chartData = computed(() => this.filterChartData(this.data().chartData || [], this.timeframe()));
  private canvas: HTMLCanvasElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    // Simulate loading
    setTimeout(() => this.isLoading.set(false), 1000);

    effect(() => {
      if (!this.isLoading()) {
        this.chartData();
        this.drawChart();
      }
    });
  }

  ngAfterViewInit(): void {
    this.canvas = this.chartCanvasRef?.nativeElement ?? null;
    if (!this.isLoading()) {
      this.drawChart();
    }
  }

  onTimeframeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.timeframe.set(select.value as '1D' | '1W' | '1M' | '3M');
    this.drawChart();
  }

  onResize(): void {
    if (this.canvas) {
      this.drawChart();
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: value < 1 ? 6 : 2
    }).format(value);
  }

  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  private filterChartData(data: ChartDataPoint[], timeframe: '1D' | '1W' | '1M' | '3M'): ChartDataPoint[] {
    if (!data.length) {
      return [];
    }

    const count = data.length;
    const sampleRate = {
      '1D': Math.max(1, Math.floor(count / 24)),
      '1W': Math.max(1, Math.floor(count / 28)),
      '1M': Math.max(1, Math.floor(count / 30)),
      '3M': Math.max(1, Math.floor(count / 60))
    }[timeframe];

    return data.filter((_, index) => index % sampleRate === 0 || index === count - 1);
  }

  formatVolume(value: number): string {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  }

  getChangeClass(value: number): string {
    return value >= 0 ? 'positive' : 'negative';
  }

  private drawChart(): void {
    if (!this.canvas || this.chartData().length === 0) return;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    const data = this.chartData();
    const padding = 40;
    const width = this.canvas.width - padding * 2;
    const height = this.canvas.height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Find min and max values
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + width, y);
      ctx.stroke();
    }

    // Draw chart line
    ctx.strokeStyle = '#3f51b5';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (width / (data.length - 1)) * index;
      const y = padding + height - ((point.value - minValue) / valueRange) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + height);
    gradient.addColorStop(0, 'rgba(63, 81, 181, 0.3)');
    gradient.addColorStop(1, 'rgba(63, 81, 181, 0.05)');

    ctx.fillStyle = gradient;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (width / (data.length - 1)) * index;
      const y = padding + height - ((point.value - minValue) / valueRange) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(padding + width, padding + height);
    ctx.lineTo(padding, padding + height);
    ctx.closePath();
    ctx.fill();
  }
}
