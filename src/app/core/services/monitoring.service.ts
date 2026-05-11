import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MonitoringService {
  logError(context: string, error: any): void {
    console.error(`[CryptoVault] ${context}`, error);
    
    // In production, you would send this to monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'error', {
        event_category: 'application',
        event_label: context,
        value: 1
      });
    }
  }

  trackEvent(name: string, data?: Record<string, any>): void {
    console.log(`[CryptoVault] Event: ${name}`, data);
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name, {
        event_category: 'user_action',
        ...data
      });
    }
  }

  trackPageView(page: string): void {
    console.log(`[CryptoVault] Page View: ${page}`);
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', {
        page_title: page,
        page_location: window.location.href
      });
    }
  }

  trackPerformance(metric: string, value: number): void {
    console.log(`[CryptoVault] Performance: ${metric} = ${value}ms`);
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        event_category: 'performance',
        event_label: metric,
        value: Math.round(value)
      });
    }
  }

  trackUserAction(action: string, details?: Record<string, any>): void {
    this.trackEvent(`user_${action}`, details);
  }

  trackApiCall(endpoint: string, duration: number, success: boolean): void {
    this.trackEvent('api_call', {
      event_label: endpoint,
      custom_parameter: {
        duration_ms: Math.round(duration),
        success: success
      }
    });
  }

  trackCircuitBreakerState(service: string, state: string, failureCount: number): void {
    this.trackEvent('circuit_breaker', {
      event_label: service,
      custom_parameter: {
        state,
        failure_count: failureCount
      }
    });
  }

  trackOfflineSession(duration: number, actions: number): void {
    this.trackEvent('offline_session', {
      custom_parameter: {
        duration_ms: duration,
        actions_count: actions
      }
    });
  }

  trackSyncFailure(reason: string, retryCount: number): void {
    this.trackEvent('sync_failure', {
      event_label: reason,
      custom_parameter: {
        retry_count: retryCount
      }
    });
  }
}
