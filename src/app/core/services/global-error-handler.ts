import { Injectable, ErrorHandler, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import { SentryService } from './sentry.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private notificationService = inject(NotificationService);
  private sentryService = inject(SentryService);

  handleError(error: any): void {
    console.error('[CryptoVault] Unexpected error:', error);

    // Show user-friendly toast notification
    const userMessage = this.getUserFriendlyMessage(error);
    this.notificationService.error('Application Error', userMessage, {
      persistent: false,
      duration: 5000
    });

    // Log to external monitoring service in production
    this.logToMonitoring(error);
  }

  private getUserFriendlyMessage(error: any): string {
    if (error?.message) {
      // Handle specific error types
      if (error.message.includes('ChunkLoadError')) {
        return 'Failed to load application resources. Please refresh the page.';
      }
      
      if (error.message.includes('NetworkError') || error.message.includes('ERR_NETWORK')) {
        return 'Network connection lost. Please check your internet connection.';
      }
      
      if (error.message.includes('QuotaExceededError')) {
        return 'Storage quota exceeded. Please clear some data in settings.';
      }
      
      if (error.message.includes('SecurityError')) {
        return 'Security error occurred. Please refresh and try again.';
      }
      
      // Generic error message
      return error.message.length > 100 
        ? 'Something went wrong. Please try again.'
        : error.message;
    }

    return 'An unexpected error occurred. Please refresh the page and try again.';
  }

  private logToMonitoring(error: any): void {
    // In production, this would send to monitoring service
    // For now, just log with context
    const errorInfo = {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.warn('[CryptoVault] Error logged for monitoring:', errorInfo);

    // Integrate with monitoring service like Sentry, LogRocket, etc.
    if (environment.production) {
      this.sentryService.captureException(error, { extra: errorInfo });
    }
  }
}
