import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsStore } from '../../../application/settings/store/settings.store';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [
    CommonModule
  ],
  template: `
    <div class="offline-banner" [class.visible]="isOffline()">
      <div class="banner-content">
        <div class="banner-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 9l2 2a1 1 0 0 0-2 2a1 1 0 0zm0 3a1 1 0 0 0 1.41 0 0 0 1.41-1.41 0 0-2.83 0 0-2.83 0 0 1.41 0 0 1.41 1.41 0 0zm7 20a2 2 0 0 0 2.83 0 0 2.83 0 0 1.41 0 0 1.41 1.41 0 0zm3 17a2 2 0 0 0 2.83 0 0 2.83 0 0 1.41 0 0 1.41 1.41 0 0zm18 7a2 2 0 0 0 2.83 0 0 2.83 0 0 1.41 0 0 1.41 1.41 0 0z"/>
          </svg>
        </div>
        <div class="banner-text">
          <h3>You are offline</h3>
          <p>Showing cached data. Some features may be limited.</p>
          <div class="banner-actions">
            <button 
              type="button"
              class="dismiss-button"
              (click)="dismissBanner()"
            >
              Dismiss
            </button>
            <button 
              type="button"
              class="retry-button"
              (click)="retryConnection()"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .offline-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: var(--color-warning-500);
      color: white;
      padding: var(--spacing-md);
      transform: translateY(-100%);
      transition: transform var(--transition-normal), opacity var(--transition-normal);
      box-shadow: var(--shadow-lg);
    }

    .offline-banner.visible {
      transform: translateY(0);
      opacity: 1;
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .banner-icon {
      flex-shrink: 0;
    }

    .banner-text {
      flex: 1;
    }

    .banner-text h3 {
      margin: 0 0 var(--spacing-xs) 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
    }

    .banner-text p {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: var(--font-size-sm);
      opacity: 0.9;
    }

    .banner-actions {
      display: flex;
      gap: var(--spacing-sm);
    }

    @media (max-width: 768px) {
      .banner-content {
        flex-direction: column;
        text-align: center;
      }

      .banner-actions {
        flex-direction: column;
        gap: var(--spacing-xs);
      }
    }
  `]
})
export class OfflineBannerComponent {
  private settingsStore = inject(SettingsStore);
  
  isOffline = computed(() => !navigator.onLine);

  dismissBanner(): void {
    // Could add a setting to persist dismissal
    console.log('Offline banner dismissed');
  }

  retryConnection(): void {
    // Could trigger a reconnection attempt
    window.location.reload();
  }
}
