import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: Date;
  imageUrl?: string;
  categories: string[];
}

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [
    CommonModule
  ],
  template: `
    <div class="news-container animate-fade-in">
      <header class="news-header">
        <div class="header-content">
          <h1 class="news-title text-heading">Crypto News</h1>
          <p class="news-subtitle text-secondary">Stay updated with the latest cryptocurrency news</p>
        </div>
        <div class="news-actions">
          <button 
            type="button"
            class="refresh-button glass"
            (click)="refreshNews()"
          >
            <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Refresh
          </button>
        </div>
      </header>

      @if (isLoading()) {
        <div class="news-loading">
          @for (i of [1,2,3]; track i) {
            <div class="news-skeleton glass-card">
              <div class="skeleton-content">
                <div class="skeleton-image glass"></div>
                <div class="skeleton-text">
                  <div class="skeleton-line skeleton-title glass"></div>
                  <div class="skeleton-line skeleton-desc glass"></div>
                  <div class="skeleton-line skeleton-meta glass"></div>
                </div>
              </div>
            </div>
          }
        </div>
      } @else if (newsItems().length === 0) {
        <div class="news-empty">
          <div class="empty-content">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-7h-7v-2h7v2z"/>
              </svg>
            </div>
            <h3 class="empty-title">No news available</h3>
            <p class="empty-description">Check back later for the latest crypto news.</p>
            <button 
              type="button"
              class="retry-button glass"
              (click)="refreshNews()"
            >
              <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              Try Again
            </button>
          </div>
        </div>
      } @else {
        <div class="news-grid">
          @for (item of newsItems(); track trackByNews($index, item)) {
            <div 
              class="news-item glass-item"
              (click)="openNews(item.url)"
            >
              <div class="news-content">
                @if (item.imageUrl) {
                  <div class="news-image">
                    <img [src]="item.imageUrl" [alt]="item.title" />
                    <div class="image-overlay"></div>
                  </div>
                }
                <div class="news-text">
                  <h3 class="news-headline">{{ item.title }}</h3>
                  <p class="news-description">{{ item.description }}</p>
                  <div class="news-meta">
                    <span class="source">{{ item.source }}</span>
                    <span class="date">{{ formatDate(item.publishedAt) }}</span>
                  </div>
                  <div class="news-categories">
                    @for (category of item.categories; track category) {
                      <span class="category-tag">{{ category }}</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './news.component.scss'
})
export class NewsComponent {
  newsItems = signal<NewsItem[]>([]);
  isLoading = signal(true);

  constructor() {
    this.loadNews();
  }

  private async loadNews(): Promise<void> {
    this.isLoading.set(true);
    try {
      // Simulate API call - in real implementation, this would fetch from news API
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'Bitcoin Reaches New All-Time High',
          description: 'Bitcoin surged past $70,000 for the first time in its history, driven by institutional adoption...',
          url: 'https://example.com/news/1',
          source: 'CryptoNews',
          publishedAt: new Date(),
          categories: ['market', 'bitcoin']
        },
        {
          id: '2',
          title: 'Ethereum 2.0 Upgrade Announced',
          description: 'The Ethereum Foundation has announced the timeline for the upcoming 2.0 upgrade...',
          url: 'https://example.com/news/2',
          source: 'CryptoNews',
          publishedAt: new Date(),
          categories: ['technology', 'ethereum']
        }
      ];
      
      this.newsItems.set(mockNews);
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  refreshNews(): void {
    this.loadNews();
  }

  openNews(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  trackByNews(index: number, item: NewsItem): string {
    return item.id;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  }

  private simulateApiCall(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
}
