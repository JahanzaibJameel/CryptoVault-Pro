import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, EMPTY } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { EncryptedStorageService } from '../services/encrypted-storage.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private encryptedStorage = inject(EncryptedStorageService);

  constructor(private notificationService: NotificationService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      timeout(30000), // 30 second timeout
      retry(this.getRetryCount(req)),
      catchError(error => this.handleError(error, req))
    );
  }

  private getRetryCount(req: HttpRequest<any>): number {
    // Don't retry certain request types
    if (req.method !== 'GET') {
      return 0;
    }

    // Don't retry file uploads
    if (req.body instanceof FormData || req.body instanceof Blob) {
      return 0;
    }

    // Don't retry if explicitly disabled
    if (req.headers.get('X-No-Retry') === 'true') {
      return 0;
    }

    // Default retry count based on request type
    if (req.url.includes('/api/v3/coins/markets')) {
      return 2; // Retry market data twice
    }

    return 1; // Default retry once
  }

  private getRetryDelay(error: any, retryCount: number): number {
    // Don't delay on 4xx errors (except 429)
    if (error.status >= 400 && error.status < 500 && error.status !== 429) {
      throw error;
    }

    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    
    // Special handling for rate limiting (429)
    if (error.status === 429) {
      const retryAfter = error.headers?.get('Retry-After');
      if (retryAfter) {
        return parseInt(retryAfter, 10) * 1000;
      }
      return Math.min(exponentialDelay + jitter, 60000); // Max 1 minute for rate limits
    }

    // Max 30 seconds delay
    return Math.min(exponentialDelay + jitter, 30000);
  }

  private handleError(error: HttpErrorResponse, req: HttpRequest<any>): Observable<never> {
    // Don't show notifications for simulated errors
    if (error.error?.simulated) {
      return throwError(() => error);
    }

    // Handle different error types
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      this.handleClientError(error, req);
    } else {
      // Server-side error
      this.handleServerError(error, req);
    }

    return throwError(() => this.enhanceError(error, req));
  }

  private handleClientError(error: HttpErrorResponse, req: HttpRequest<any>): void {
    console.error('Client error:', error);
    
    this.notificationService.error(
      'Network Error',
      'Unable to connect to the server. Please check your internet connection.',
      {
        persistent: true,
        action: {
          label: 'Retry',
          handler: () => window.location.reload()
        }
      }
    );
  }

  private handleServerError(error: HttpErrorResponse, req: HttpRequest<any>): void {
    console.error('Server error:', error);

    switch (error.status) {
      case 0:
        // Network error or CORS issue
        this.notificationService.error(
          'Connection Failed',
          'Unable to reach the server. Please check your network connection.',
          {
            persistent: true
          }
        );
        break;

      case 400:
        this.handleBadRequest(error, req);
        break;

      case 401:
        this.handleUnauthorized(error, req);
        break;

      case 403:
        this.handleForbidden(error, req);
        break;

      case 404:
        this.handleNotFound(error, req);
        break;

      case 429:
        this.handleRateLimit(error, req);
        break;

      case 500:
        this.handleInternalServerError(error, req);
        break;

      case 502:
      case 503:
      case 504:
        this.handleServiceUnavailable(error, req);
        break;

      default:
        this.handleGenericError(error, req);
        break;
    }
  }

  private handleBadRequest(error: HttpErrorResponse, req: HttpRequest<any>): void {
    const message = error.error?.message || 'Invalid request parameters';
    
    this.notificationService.error(
      'Bad Request',
      message,
      {
        duration: 5000
      }
    );
  }

  private handleUnauthorized(error: HttpErrorResponse, req: HttpRequest<any>): void {
    this.notificationService.error(
      'Authentication Required',
      'Please log in to access this resource.',
      {
        persistent: true,
        action: {
          label: 'Login',
          handler: () => {
            // Redirect to login page
            window.location.href = '/login';
          }
        }
      }
    );
  }

  private handleForbidden(error: HttpErrorResponse, req: HttpRequest<any>): void {
    this.notificationService.error(
      'Access Denied',
      'You do not have permission to access this resource.',
      {
        persistent: true
      }
    );
  }

  private handleNotFound(error: HttpErrorResponse, req: HttpRequest<any>): void {
    // Don't show notification for 404 on certain endpoints
    if (req.url.includes('/api/v3/ping')) {
      return;
    }

    this.notificationService.warning(
      'Not Found',
      'The requested resource was not found.',
      {
        duration: 3000
      }
    );
  }

  private handleRateLimit(error: HttpErrorResponse, req: HttpRequest<any>): void {
    const retryAfter = error.headers?.get('Retry-After');
    const message = retryAfter 
      ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
      : 'Rate limit exceeded. Please slow down your requests.';

    this.notificationService.warning(
      'Rate Limited',
      message,
      {
        persistent: true,
        duration: retryAfter ? parseInt(retryAfter, 10) * 1000 : 10000
      }
    );
  }

  private handleInternalServerError(error: HttpErrorResponse, req: HttpRequest<any>): void {
    this.notificationService.error(
      'Server Error',
      'An internal server error occurred. Please try again later.',
      {
        persistent: true,
        action: {
          label: 'Report Issue',
          handler: () => {
            // Open issue reporting form
            window.open('https://github.com/your-repo/issues', '_blank');
          }
        }
      }
    );
  }

  private handleServiceUnavailable(error: HttpErrorResponse, req: HttpRequest<any>): void {
    const statusText = error.statusText || 'Service Unavailable';
    
    this.notificationService.error(
      'Service Unavailable',
      `${statusText}. The service is temporarily unavailable. Please try again later.`,
      {
        persistent: true
      }
    );
  }

  private handleGenericError(error: HttpErrorResponse, req: HttpRequest<any>): void {
    const message = error.error?.message || error.message || 'An unexpected error occurred';
    
    this.notificationService.error(
      'Error',
      message,
      {
        duration: 5000
      }
    );
  }

  private enhanceError(error: HttpErrorResponse, req: HttpRequest<any>): HttpErrorResponse {
    // Add additional context to the error
    const enhancedError = {
      ...error,
      url: req.url,
      method: req.method,
      timestamp: Date.now(),
      requestId: this.generateRequestId(),
      userAgent: navigator.userAgent
    };

    // Log to error tracking service
    this.logError(enhancedError);

    return enhancedError;
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logError(error: any): Promise<void> {
    // In a real app, this would send to error tracking service
    console.group('HTTP Error Details');
    console.error('Request URL:', error.url);
    console.error('Method:', error.method);
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Timestamp:', new Date(error.timestamp).toISOString());
    console.error('Request ID:', error.requestId);
    console.groupEnd();

    // Store error locally for debugging
    try {
      const errorLog = await this.encryptedStorage.get<any[]>('error-log') || [];
      errorLog.push({
        ...error,
        timestamp: Date.now()
      });
      
      // Keep only last 50 errors
      if (errorLog.length > 50) {
        errorLog.splice(0, errorLog.length - 50);
      }
      
      await this.encryptedStorage.set('error-log', errorLog);
    } catch (e) {
      console.warn('Failed to log error to encrypted storage:', e);
    }
  }

  // Public API for error management
  async getErrorLog(): Promise<any[]> {
    try {
      return await this.encryptedStorage.get<any[]>('error-log') || [];
    } catch (e) {
      return [];
    }
  }

  async clearErrorLog(): Promise<void> {
    try {
      await this.encryptedStorage.remove('error-log');
    } catch (e) {
      console.warn('Failed to clear error log:', e);
    }
  }

  async getErrorStats(): Promise<{
    total: number;
    byStatus: Record<number, number>;
    byUrl: Record<string, number>;
    recent: number;
  }> {
    const errors = await this.getErrorLog();
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const byStatus: Record<number, number> = {};
    const byUrl: Record<string, number> = {};

    errors.forEach((error: any) => {
      byStatus[error.status] = (byStatus[error.status] || 0) + 1;
      byUrl[error.url] = (byUrl[error.url] || 0) + 1;
    });

    const recent = errors.filter((error: any) => error.timestamp > oneHourAgo).length;

    return {
      total: errors.length,
      byStatus,
      byUrl,
      recent
    };
  }
}
