import { Component, ErrorHandler, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoggerService } from '../services/logger.service';
import { NotificationService } from '../services/notification.service';

export interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  component?: string;
  context?: Record<string, unknown>;
}

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-boundary-overlay" *ngIf="hasError()">
      <div class="error-boundary-container glass-card animate-fade-in">
        <div class="error-boundary-header">
          <div class="error-icon">⚠️</div>
          <h2 class="error-title">Something went wrong</h2>
          <p class="error-subtitle">We encountered an unexpected error</p>
        </div>

        <div class="error-boundary-content">
          <div class="error-summary">
            <p class="error-message">{{ getErrorInfo().message }}</p>
            <p class="error-time">Time: {{ getErrorInfo().timestamp | date: 'medium' }}</p>
            <p class="error-url">Page: {{ getErrorInfo().url }}</p>
          </div>

          @if (showDetails()) {
            <div class="error-details">
              <h3>Error Details</h3>
              <pre class="error-stack">{{
                getErrorInfo().stack || 'No stack trace available'
              }}</pre>

              @if (getErrorInfo().context) {
                <div class="error-context">
                  <h4>Context</h4>
                  <pre>{{ getErrorInfo().context | json }}</pre>
                </div>
              }
            </div>
          }
        </div>

        <div class="error-boundary-actions">
          <button class="glass-button primary" (click)="retry()">
            <span class="button-icon">🔄</span>
            Retry
          </button>
          <button class="glass-button secondary" (click)="goHome()">
            <span class="button-icon">🏠</span>
            Go Home
          </button>
          <button class="glass-button ghost" (click)="toggleDetails()">
            <span class="button-icon">{{ showDetails() ? '🙈' : '👁️' }}</span>
            {{ showDetails() ? 'Hide' : 'Show' }} Details
          </button>
          <button class="glass-button ghost" (click)="reload()">
            <span class="button-icon">🔄</span>
            Reload Page
          </button>
        </div>

        <div class="error-boundary-footer">
          <p class="help-text">
            If this problem persists, please contact support or check our
            <a href="#" (click)="openHelp()">help documentation</a>.
          </p>
          <p class="error-id">Error ID: {{ getErrorId() }}</p>
        </div>
      </div>
    </div>

    <!-- Normal content when no error -->
    <ng-content *ngIf="!hasError()"></ng-content>
  `,
  styles: [
    `
      .error-boundary-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 2rem;
      }

      .error-boundary-container {
        max-width: 600px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
        padding: 2rem;
        text-align: center;
      }

      .error-boundary-header {
        margin-bottom: 2rem;
      }

      .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .error-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--error-color, #ff6b6b);
      }

      .error-subtitle {
        color: var(--text-secondary, #888);
        margin-bottom: 0;
      }

      .error-boundary-content {
        text-align: left;
        margin-bottom: 2rem;
      }

      .error-summary {
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.3);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
      }

      .error-message {
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--error-color, #ff6b6b);
      }

      .error-time,
      .error-url {
        font-size: 0.875rem;
        color: var(--text-secondary, #888);
        margin-bottom: 0.25rem;
      }

      .error-details {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: 1rem;
        margin-top: 1rem;
      }

      .error-details h3,
      .error-details h4 {
        margin-bottom: 0.5rem;
        color: var(--text-primary, #fff);
      }

      .error-stack,
      .error-context pre {
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 0.75rem;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.875rem;
        color: var(--text-primary, #fff);
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-all;
      }

      .error-boundary-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 2rem;
      }

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

      .glass-button.ghost {
        background: transparent;
        color: var(--text-secondary, #888);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .glass-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 212, 255, 0.3);
      }

      .button-icon {
        font-size: 1rem;
      }

      .error-boundary-footer {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 1rem;
      }

      .help-text {
        font-size: 0.875rem;
        color: var(--text-secondary, #888);
        margin-bottom: 0.5rem;
      }

      .help-text a {
        color: var(--primary-color, #00d4ff);
        text-decoration: none;
      }

      .help-text a:hover {
        text-decoration: underline;
      }

      .error-id {
        font-size: 0.75rem;
        color: var(--text-secondary, #888);
        font-family: 'JetBrains Mono', monospace;
      }

      @media (max-width: 768px) {
        .error-boundary-overlay {
          padding: 1rem;
        }

        .error-boundary-container {
          padding: 1.5rem;
        }

        .error-boundary-actions {
          flex-direction: column;
          align-items: stretch;
        }

        .glass-button {
          justify-content: center;
        }
      }
    `,
  ],
})
export class ErrorBoundaryComponent implements ErrorHandler {
  private router = inject(Router);
  private loggerService = inject(LoggerService);
  private notificationService = inject(NotificationService);

  private errorInfo = signal<ErrorInfo | null>(null);
  private showDetailsSignal = signal(false);
  private retryCount = 0;
  private readonly maxRetries = 3;

  handleError(error: unknown): void {
    this.retryCount = 0; // Reset retry count on new error

    const errorInfo: ErrorInfo = {
      message: this.getErrorMessage(error),
      stack: this.getErrorStack(error),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      component: this.getComponentName(error),
      context: this.getErrorContext(error),
    };

    this.errorInfo.set(errorInfo);

    // Log the error
    this.loggerService.error('Error boundary caught error', error, 'error-boundary');

    // Show notification
    this.notificationService.error(
      'Application Error',
      'An unexpected error occurred. The app has been recovered.',
      { persistent: true },
    );
  }

  hasError(): boolean {
    return this.errorInfo() !== null;
  }

  getErrorInfo(): ErrorInfo {
    return (
      this.errorInfo() || {
        message: 'Unknown error',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }
    );
  }

  getErrorId(): string {
    const info = this.getErrorInfo();
    return `ERR-${info.timestamp}-${info.message
      .slice(0, 10)
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()}`;
  }

  showDetails(): boolean {
    return this.showDetailsSignal();
  }

  toggleDetails(): void {
    this.showDetailsSignal.set(!this.showDetailsSignal());
  }

  retry(): void {
    if (this.retryCount >= this.maxRetries) {
      this.notificationService.error(
        'Retry Limit Reached',
        `Maximum retry attempts (${this.maxRetries}) reached. Please reload the page.`,
      );
      return;
    }

    this.retryCount++;
    this.loggerService.info(
      'Error boundary retry attempt',
      {
        retryCount: this.retryCount,
        errorId: this.getErrorId(),
      },
      'error-boundary',
    );

    // Clear the error and retry
    this.errorInfo.set(null);

    // Small delay before retry
    setTimeout(() => {
      // Trigger a change detection cycle
      this.notificationService.info('Retrying', `Attempt ${this.retryCount} of ${this.maxRetries}`);
    }, 100);
  }

  goHome(): void {
    this.loggerService.info(
      'Navigating home due to error',
      {
        errorId: this.getErrorId(),
      },
      'error-boundary',
    );

    this.errorInfo.set(null);
    this.router.navigate(['/dashboard']);
  }

  reload(): void {
    this.loggerService.info(
      'Reloading page due to error',
      {
        errorId: this.getErrorId(),
      },
      'error-boundary',
    );

    window.location.reload();
  }

  openHelp(): void {
    this.loggerService.info(
      'Opening help documentation',
      {
        errorId: this.getErrorId(),
      },
      'error-boundary',
    );

    // In a real app, this would navigate to help page or open documentation
    window.open('/help/troubleshooting', '_blank');
  }

  private getComponentName(_error: unknown): string | undefined {
    const stack = this.getErrorStack(_error);
    const message = this.getErrorMessage(_error);

    if (stack) {
      const componentMatch = stack.match(/at (\w+)\./);
      if (componentMatch) {
        return componentMatch[1];
      }
    }

    if (message) {
      const componentMatch = message.match(/(\w+Component)/);
      if (componentMatch) {
        return componentMatch[1];
      }
    }

    return undefined;
  }

  private getErrorContext(_error: unknown): Record<string, unknown> {
    const context: Record<string, unknown> = {
      url: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      languages: navigator.languages,
      platform: navigator.platform,
      timestamp: Date.now(),
    };

    // Add memory info if available
    const perf = performance as Performance & {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
    };
    if (perf.memory) {
      context.memory = {
        used: perf.memory.usedJSHeapSize,
        total: perf.memory.totalJSHeapSize,
        limit: perf.memory.jsHeapSizeLimit,
      };
    }

    // Add connection info if available
    const nav = navigator as Navigator & {
      connection?: { effectiveType?: string; downlink?: number; rtt?: number };
    };
    if (nav.connection) {
      context.connection = {
        effectiveType: nav.connection.effectiveType,
        downlink: nav.connection.downlink,
        rtt: nav.connection.rtt,
      };
    }

    return context;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unknown error occurred';
  }

  private getErrorStack(error: unknown): string | undefined {
    if (error instanceof Error) {
      return error.stack;
    }

    return undefined;
  }

  // Public method to manually trigger error boundary
  triggerError(error: Error): void {
    this.handleError(error);
  }

  // Public method to clear error
  clearError(): void {
    this.errorInfo.set(null);
    this.retryCount = 0;
  }

  // Get error statistics
  getErrorStats(): {
    hasError: boolean;
    retryCount: number;
    errorId?: string;
    errorTime?: number;
  } {
    const info = this.errorInfo();
    return {
      hasError: !!info,
      retryCount: this.retryCount,
      errorId: info ? this.getErrorId() : undefined,
      errorTime: info?.timestamp,
    };
  }
}
