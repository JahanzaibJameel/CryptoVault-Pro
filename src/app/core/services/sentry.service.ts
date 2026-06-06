import { Injectable, inject } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { OfflineService } from './offline.service';
import { NotificationService } from './notification.service';

export interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  release?: string;
  enabled: boolean;
}

export interface Breadcrumb {
  timestamp: number;
  message: string;
  category: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class SentryService {
  private offlineService = inject(OfflineService);
  private notificationService = inject(NotificationService);
  private isEnabled = false;
  private offlineQueue: Array<() => void> = [];
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 100;

  constructor() {
    this.initializeSentry();
  }

  private initializeSentry(): void {
    const config: SentryConfig = this.getSentryConfig();
    
    if (!config.enabled || !config.dsn) {
      console.warn('Sentry is disabled or DSN not configured');
      return;
    }

    try {
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        release: config.release,
        tracesSampleRate: config.tracesSampleRate,
        integrations: [
          Sentry.browserTracingIntegration(),
        ],
        beforeSend: (event, hint) => {
          // Filter out certain errors
          if (this.shouldFilterError(event)) {
            return null;
          }

          // Add custom context
          event.contexts = {
            ...event.contexts,
            app: {
              name: 'CryptoVault Pro',
              version: config.release || '1.0.0',
              buildDate: new Date().toISOString()
            },
            device: this.getDeviceContext(),
            network: this.getNetworkContext()
          };

          return event;
        },
        beforeBreadcrumb: (breadcrumb) => {
          // Filter sensitive data from breadcrumbs
          if (this.shouldFilterBreadcrumb(breadcrumb)) {
            return null;
          }
          return breadcrumb;
        }
      });

      this.isEnabled = true;
      this.addBreadcrumb('Sentry initialized', 'system', 'info');
      
      // Set up global error handlers
      this.setupGlobalErrorHandlers();
      
      // Set up offline queue processing
      this.setupOfflineQueueProcessing();
      
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  private getSentryConfig(): SentryConfig {
    // In production, these would come from environment variables
    const dsn = (globalThis as any).process?.env?.SENTRY_DSN || '';
    const environment = (globalThis as any).process?.env?.NODE_ENV || 'development';
    const tracesSampleRate = environment === 'production' ? 0.1 : 1.0;
    
    return {
      dsn,
      environment,
      tracesSampleRate,
      enabled: !!dsn,
      release: '1.0.0' // This would be dynamic in real app
    };
  }

  private shouldFilterError(event: Sentry.Event): boolean {
    // Filter out network errors when offline
    if (this.offlineService.getConnectionStatus() === 'offline') {
      const message = event.exception?.values?.[0]?.value || '';
      if (message.includes('NetworkError') || message.includes('ERR_NETWORK')) {
        return true;
      }
    }

    // Filter out certain error types
    const ignoredErrors = [
      'Non-Error promise rejection',
      'ResizeObserver loop limit exceeded',
      'Script error'
    ];

    return ignoredErrors.some(ignored => 
      event.exception?.values?.[0]?.value?.includes(ignored)
    );
  }

  private shouldFilterBreadcrumb(breadcrumb: Sentry.Breadcrumb): boolean {
    // Filter out sensitive URLs and data
    if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
      const url = breadcrumb.data?.['url'] || '';
      if (url.includes('/api/') && url.includes('key=')) {
        return true;
      }
    }

    return false;
  }

  private getDeviceContext(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null
    };
  }

  private getNetworkContext(): Record<string, any> {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
      type: connection?.type || 'unknown'
    };
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(event.reason, {
        context: 'unhandledrejection',
        promise: event.promise
      });
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.captureException(event.error, {
        context: 'uncaught error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }

  private setupOfflineQueueProcessing(): void {
    // Process queued events when coming back online
    this.offlineService.onConnectionStatusChange().subscribe(status => {
      if (status.isOnline && this.offlineQueue.length > 0) {
        this.processOfflineQueue();
      }
    });
  }

  private processOfflineQueue(): void {
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    
    queue.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Failed to process queued Sentry task:', error);
      }
    });
  }

  // Public API methods
  captureException(error: any, context?: Record<string, any>): void {
    if (!this.isEnabled) {
      console.error('Sentry Error:', error, context);
      return;
    }

    const task = () => {
      Sentry.withScope((scope) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setContext(key, value);
          });
        }
        
        scope.setTag('connection_status', this.offlineService.getConnectionStatus());
        scope.setTag('app_section', this.getCurrentSection());
        
        Sentry.captureException(error);
      });
    };

    if (this.offlineService.getConnectionStatus() === 'offline') {
      this.offlineQueue.push(task);
    } else {
      task();
    }
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): void {
    if (!this.isEnabled) {
      console.warn(`Sentry Message [${level}]:`, message, context);
      return;
    }

    const task = () => {
      Sentry.withScope((scope) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setContext(key, value);
          });
        }
        
        scope.setTag('connection_status', this.offlineService.getConnectionStatus());
        scope.setTag('app_section', this.getCurrentSection());
        
        Sentry.captureMessage(message, level);
      });
    };

    if (this.offlineService.getConnectionStatus() === 'offline') {
      this.offlineQueue.push(task);
    } else {
      task();
    }
  }

  addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>): void {
    const breadcrumb: Breadcrumb = {
      timestamp: Date.now(),
      message,
      category,
      level,
      data
    };

    this.breadcrumbs.push(breadcrumb);
    
    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }

    if (this.isEnabled) {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        data,
        timestamp: breadcrumb.timestamp / 1000
      });
    }
  }

  setUser(user: { id?: string; email?: string; username?: string }): void {
    if (this.isEnabled) {
      Sentry.setUser(user);
    }
  }

  setTag(key: string, value: string): void {
    if (this.isEnabled) {
      Sentry.setTag(key, value);
    }
  }

  setContext(key: string, context: Record<string, any>): void {
    if (this.isEnabled) {
      Sentry.setContext(key, context);
    }
  }

  startTransaction(name: string, operation: string = 'navigation'): any | null {
    if (!this.isEnabled) {
      return null;
    }

    try {
      return Sentry.startSpan(
        { name, op: operation },
        () => {}
      );
    } catch {
      return null;
    }
  }

  // Circuit breaker specific methods
  trackCircuitBreaker(service: string, state: string, failureCount: number): void {
    this.addBreadcrumb(
      `Circuit breaker ${state}`,
      'circuit-breaker',
      state === 'open' ? 'warning' : 'info',
      {
        service,
        state,
        failureCount,
        timestamp: Date.now()
      }
    );

    this.setTag('circuit_breaker_state', state);
    this.setTag('circuit_breaker_service', service);
  }

  // API call tracking
  trackApiCall(url: string, method: string, statusCode: number, duration: number): void {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warning' : 'info';
    
    this.addBreadcrumb(
      `API ${method} ${url}`,
      'api',
      level,
      {
        url,
        method,
        statusCode,
        duration,
        success: statusCode < 400
      }
    );

    // Track slow API calls
    if (duration > 5000) {
      this.captureMessage(
        `Slow API call: ${method} ${url} took ${duration}ms`,
        'warning',
        { url, method, duration, statusCode }
      );
    }
  }

  // Performance tracking
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.addBreadcrumb(
      `Performance: ${metric}`,
      'performance',
      value > this.getPerformanceThreshold(metric) ? 'warning' : 'info',
      {
        metric,
        value,
        unit,
        threshold: this.getPerformanceThreshold(metric)
      }
    );

    if (value > this.getPerformanceThreshold(metric)) {
      this.captureMessage(
        `Performance threshold exceeded: ${metric} = ${value}${unit}`,
        'warning',
        { metric, value, unit, threshold: this.getPerformanceThreshold(metric) }
      );
    }
  }

  private getPerformanceThreshold(metric: string): number {
    const thresholds: Record<string, number> = {
      'LCP': 2500,
      'CLS': 0.1,
      'INP': 200,
      'FCP': 1800,
      'TTI': 3800,
      'TTFB': 800
    };
    return thresholds[metric] || 1000;
  }

  private getCurrentSection(): string {
    const path = window.location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/portfolio')) return 'portfolio';
    if (path.includes('/watchlist')) return 'watchlist';
    if (path.includes('/news')) return 'news';
    if (path.includes('/settings')) return 'settings';
    return 'unknown';
  }

  // Analytics and user behavior
  trackUserAction(action: string, details?: Record<string, any>): void {
    this.addBreadcrumb(
      `User action: ${action}`,
      'user-action',
      'info',
      details
    );
  }

  trackPageView(page: string): void {
    this.addBreadcrumb(
      `Page view: ${page}`,
      'navigation',
      'info',
      { page, url: window.location.href }
    );
  }

  // Health check
  checkHealth(): { healthy: boolean; checks: Record<string, boolean> } {
    const checks = {
      sentry_enabled: this.isEnabled,
      breadcrumb_tracking: this.breadcrumbs.length > 0,
      offline_queue: this.offlineQueue.length === 0 || this.offlineService.getConnectionStatus() === 'offline'
    };

    return {
      healthy: Object.values(checks).every(check => check),
      checks
    };
  }

  // Debug methods
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  getOfflineQueueSize(): number {
    return this.offlineQueue.length;
  }

  flush(): Promise<void> {
    if (this.isEnabled) {
      return (Sentry.flush(2000) as unknown as Promise<void>);
    }
    return Promise.resolve();
  }
}
