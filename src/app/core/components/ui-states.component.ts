import { Component, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UIState = 'loading' | 'empty' | 'error' | 'content';

export interface LoadingState {
  message?: string;
  showSkeleton?: boolean;
  skeletonType?: 'card' | 'list' | 'table' | 'chart';
  progress?: number;
}

export interface EmptyState {
  title: string;
  message: string;
  illustration?: string;
  action?: {
    label: string;
    handler: () => void;
  };
  secondaryAction?: {
    label: string;
    handler: () => void;
  };
}

export interface ErrorState {
  title: string;
  message: string;
  error?: Error;
  action?: {
    label: string;
    handler: () => void;
  };
  showRetry?: boolean;
  retryHandler?: () => void;
}

@Component({
  selector: 'app-ui-states',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Loading State -->
    @if (currentState() === 'loading') {
      <div class="ui-state loading-state">
        @if (currentLoadingConfig().showSkeleton) {
          <div class="skeleton-container">
            @switch (currentLoadingConfig().skeletonType) {
              @case ('card') {
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
              }
              @case ('list') {
                <div class="skeleton-list">
                  @for (item of [1, 2, 3, 4, 5]; track item) {
                    <div class="skeleton-list-item"></div>
                  }
                </div>
              }
              @case ('table') {
                <div class="skeleton-table">
                  <div class="skeleton-table-header"></div>
                  @for (row of [1, 2, 3, 4]; track row) {
                    <div class="skeleton-table-row"></div>
                  }
                </div>
              }
              @case ('chart') {
                <div class="skeleton-chart">
                  <div class="skeleton-chart-header"></div>
                  <div class="skeleton-chart-content"></div>
                </div>
              }
            }
          </div>
        } @else {
          <div class="loading-spinner-container">
            <div class="loading-spinner"></div>
            <p class="loading-message">{{ currentLoadingConfig().message || 'Loading...' }}</p>
            @if (currentLoadingConfig().progress !== undefined) {
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="currentLoadingConfig().progress"></div>
              </div>
              <span class="progress-text">{{ currentLoadingConfig().progress }}%</span>
            }
          </div>
        }
      </div>
    }

    <!-- Empty State -->
    @if (currentState() === 'empty') {
      <div class="ui-state empty-state">
        <div class="empty-content">
          @if (currentEmptyConfig().illustration) {
            <div class="empty-illustration">
              <img [src]="currentEmptyConfig().illustration" [alt]="currentEmptyConfig().title" />
            </div>
          } @else {
            <div class="empty-icon">📭</div>
          }
          
          <h3 class="empty-title">{{ currentEmptyConfig().title }}</h3>
          <p class="empty-message">{{ currentEmptyConfig().message }}</p>
          
          <div class="empty-actions">
            @if (currentEmptyConfig().action) {
              <button class="glass-button primary" (click)="currentEmptyConfig().action!.handler()">
                {{ currentEmptyConfig().action!.label }}
              </button>
            }
            
            @if (currentEmptyConfig().secondaryAction) {
              <button class="glass-button secondary" (click)="currentEmptyConfig().secondaryAction!.handler()">
                {{ currentEmptyConfig().secondaryAction!.label }}
              </button>
            }
          </div>
        </div>
      </div>
    }

    <!-- Error State -->
    @if (currentState() === 'error') {
      <div class="ui-state error-state">
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          
          <h3 class="error-title">{{ currentErrorConfig().title }}</h3>
          <p class="error-message">{{ currentErrorConfig().message }}</p>
          
          @if (currentErrorConfig().error) {
            <details class="error-details">
              <summary>Technical Details</summary>
              <pre class="error-stack">{{ currentErrorConfig().error!.stack || currentErrorConfig().error!.message }}</pre>
            </details>
          }
          
          <div class="error-actions">
            @if (currentErrorConfig().showRetry && currentErrorConfig().retryHandler) {
              <button class="glass-button primary" (click)="currentErrorConfig().retryHandler!.call(this)">
                <span class="button-icon">🔄</span>
                Retry
              </button>
            }
            
            @if (currentErrorConfig().action) {
              <button class="glass-button secondary" (click)="currentErrorConfig().action!.handler()">
                {{ currentErrorConfig().action!.label }}
              </button>
            }
          </div>
        </div>
      </div>
    }

    <!-- Content State -->
    @if (currentState() === 'content') {
      <ng-content></ng-content>
    }
  `,
  styles: [`
    .ui-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      padding: 2rem;
      text-align: center;
    }

    /* Loading States */
    .loading-state {
      flex-direction: column;
    }

    .skeleton-container {
      width: 100%;
      max-width: 800px;
    }

    .skeleton-card {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 12px;
      height: 120px;
      margin-bottom: 1rem;
    }

    .skeleton-list-item {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
      height: 40px;
      margin-bottom: 0.5rem;
    }

    .skeleton-table-header {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.15) 25%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.15) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
      height: 40px;
      margin-bottom: 0.5rem;
    }

    .skeleton-table-row {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      height: 32px;
      margin-bottom: 0.25rem;
    }

    .skeleton-chart-header {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.15) 25%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.15) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
      height: 40px;
      margin-bottom: 1rem;
    }

    .skeleton-chart-content {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
      height: 200px;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    .loading-spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top: 3px solid var(--primary-color, #00d4ff);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-message {
      color: var(--text-secondary, #888);
      font-size: 0.875rem;
      margin: 0;
    }

    .progress-bar {
      width: 200px;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary-color, #00d4ff);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.75rem;
      color: var(--text-secondary, #888);
    }

    /* Empty States */
    .empty-state {
      flex-direction: column;
    }

    .empty-content {
      max-width: 400px;
    }

    .empty-illustration {
      width: 120px;
      height: 120px;
      margin: 0 auto 1.5rem;
      opacity: 0.7;
    }

    .empty-illustration img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      opacity: 0.5;
    }

    .empty-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--text-primary, #fff);
    }

    .empty-message {
      color: var(--text-secondary, #888);
      margin-bottom: 2rem;
      line-height: 1.5;
    }

    .empty-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Error States */
    .error-state {
      flex-direction: column;
    }

    .error-content {
      max-width: 500px;
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--error-color, #ff6b6b);
    }

    .error-message {
      color: var(--text-secondary, #888);
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    .error-details {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      text-align: left;
    }

    .error-details summary {
      cursor: pointer;
      color: var(--text-primary, #fff);
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .error-stack {
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      padding: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--text-primary, #fff);
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 200px;
      overflow-y: auto;
    }

    .error-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Common Button Styles */
    .glass-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
    }

    .glass-button.primary {
      background: var(--primary-color, #00d4ff);
      color: var(--background-dark, #0a0a0a);
    }

    .glass-button.secondary {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-primary, #fff);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .glass-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 212, 255, 0.3);
    }

    .button-icon {
      font-size: 1rem;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .ui-state {
        padding: 1rem;
        min-height: 150px;
      }

      .empty-actions,
      .error-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .glass-button {
        justify-content: center;
      }

      .progress-bar {
        width: 150px;
      }
    }
  `]
})
export class UIStatesComponent {
  // Inputs
  state = input<UIState>('content');
  loadingConfig = input<LoadingState>({ showSkeleton: true, skeletonType: 'card' });
  emptyConfig = input.required<EmptyState>();
  errorConfig = input.required<ErrorState>();

  // Outputs
  stateChange = output<UIState>();

  // Internal signals for dynamic state management
  private internalState = signal<UIState>('content');
  private internalLoadingConfig = signal<LoadingState>({ showSkeleton: true, skeletonType: 'card' });
  private internalEmptyConfig = signal<EmptyState>({ title: '', message: '' });
  private internalErrorConfig = signal<ErrorState>({ title: '', message: '' });

  // Computed properties for easier template access
  isLoading = computed(() => this.internalState() === 'loading');
  isEmpty = computed(() => this.internalState() === 'empty');
  hasError = computed(() => this.internalState() === 'error');
  hasContent = computed(() => this.internalState() === 'content');

  // Use input values or internal values
  currentState = computed(() => this.state() !== 'content' ? this.state() : this.internalState());
  currentLoadingConfig = computed(() => this.state() === 'loading' ? this.loadingConfig() : this.internalLoadingConfig());
  currentEmptyConfig = computed(() => this.state() === 'empty' ? this.emptyConfig() : this.internalEmptyConfig());
  currentErrorConfig = computed(() => this.state() === 'error' ? this.errorConfig() : this.internalErrorConfig());

  // Public methods
  setLoading(config?: Partial<LoadingState>): void {
    this.internalLoadingConfig.set({ ...this.internalLoadingConfig(), ...config });
    this.setState('loading');
  }

  setEmpty(config: EmptyState): void {
    this.internalEmptyConfig.set(config);
    this.setState('empty');
  }

  setError(config: ErrorState): void {
    this.internalErrorConfig.set(config);
    this.setState('error');
  }

  setContent(): void {
    this.setState('content');
  }

  private setState(newState: UIState): void {
    this.internalState.set(newState);
    this.stateChange.emit(newState);
  }

  // Utility methods for common patterns
  static createLoadingState(message?: string, skeletonType?: LoadingState['skeletonType']): LoadingState {
    return {
      message,
      showSkeleton: true,
      skeletonType: skeletonType || 'card'
    };
  }

  static createEmptyState(
    title: string, 
    message: string, 
    action?: EmptyState['action'],
    illustration?: string
  ): EmptyState {
    return {
      title,
      message,
      action,
      illustration
    };
  }

  static createErrorState(
    title: string,
    message: string,
    error?: Error,
    retryHandler?: () => void
  ): ErrorState {
    return {
      title,
      message,
      error,
      showRetry: !!retryHandler,
      retryHandler
    };
  }
}
