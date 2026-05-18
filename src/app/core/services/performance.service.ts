import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SentryService } from './sentry.service';

export interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

export interface PerformanceMetrics {
  LCP?: WebVital;
  CLS?: WebVital;
  INP?: WebVital;
  FCP?: WebVital;
  TTFB?: WebVital;
  TTI?: WebVital;
}

export interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  cached: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private router = inject(Router);
  private sentryService = inject(SentryService);
  
  private metrics = signal<PerformanceMetrics>({});
  private resourceTimings = signal<ResourceTiming[]>([]);
  private isTracking = signal(false);
  private vitalsObserver: PerformanceObserver | null = null;
  private resourceObserver: PerformanceObserver | null = null;
  private memoryTrackingInterval: number | null = null;
  
  // Thresholds for Web Vitals
  private readonly thresholds = {
    LCP: { good: 2500, poor: 4000 },
    CLS: { good: 0.1, poor: 0.25 },
    INP: { good: 200, poor: 500 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    TTI: { good: 3800, poor: 7300 }
  };

  constructor() {
    this.initializePerformanceTracking();
  }

  private initializePerformanceTracking(): void {
    // Only track in production or when explicitly enabled
    const shouldTrack = (typeof window !== 'undefined' && (window as any).__ENV?.NODE_ENV === 'production') || 
                       (typeof window !== 'undefined' && (window as any).__ENV?.ENABLE_PERFORMANCE_MONITORING === 'true');
    
    if (shouldTrack && this.isPerformanceAPIAvailable()) {
      this.startTracking();
    }
  }

  private isPerformanceAPIAvailable(): boolean {
    return 'PerformanceObserver' in window && 
           'performance' in window && 
           'navigation' in performance;
  }

  startTracking(): void {
    if (this.isTracking()) return;
    
    this.isTracking.set(true);
    this.setupVitalsObserver();
    this.setupResourceObserver();
    this.setupNavigationTracking();
    this.setupMemoryTracking();
    
    this.sentryService.addBreadcrumb('Performance tracking started', 'performance', 'info');
  }

  stopTracking(): void {
    if (!this.isTracking()) return;
    
    this.vitalsObserver?.disconnect();
    this.resourceObserver?.disconnect();
    this.vitalsObserver = null;
    this.resourceObserver = null;
    
    this.isTracking.set(false);
    this.sentryService.addBreadcrumb('Performance tracking stopped', 'performance', 'info');
  }

  ngOnDestroy(): void {
    // Clear memory tracking interval
    if (this.memoryTrackingInterval) {
      clearInterval(this.memoryTrackingInterval);
      this.memoryTrackingInterval = null;
    }
    
    // Disconnect observers
    this.vitalsObserver?.disconnect();
    this.resourceObserver?.disconnect();
  }

  private setupVitalsObserver(): void {
    try {
      this.vitalsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.processVitalEntry(entry as PerformanceEntry);
        });
      });

      // Observe all relevant performance entries
      const entryTypes = [
        'largest-contentful-paint',
        'layout-shift',
        'first-input',
        'paint',
        'navigation'
      ];

      entryTypes.forEach(type => {
        try {
          this.vitalsObserver!.observe({ type, buffered: true });
        } catch (error) {
          console.warn(`Failed to observe ${type}:`, error);
        }
      });
    } catch (error) {
      console.error('Failed to setup vitals observer:', error);
    }
  }

  private setupResourceObserver(): void {
    try {
      this.resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.processResourceEntry(entry as PerformanceResourceTiming);
        });
      });

      this.resourceObserver.observe({ type: 'resource', buffered: true });
    } catch (error) {
      console.error('Failed to setup resource observer:', error);
    }
  }

  private setupNavigationTracking(): void {
    this.router.events.subscribe(event => {
      if (event.constructor.name === 'NavigationEnd') {
        this.recordNavigation();
      }
    });
  }

  private setupMemoryTracking(): void {
    // Track memory usage every 30 seconds
    this.memoryTrackingInterval = window.setInterval(() => {
      if (this.isTracking()) {
        this.recordMemoryUsage();
      }
    }, 30000);
  }

  private processVitalEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        this.recordLCP(entry as LargestContentfulPaint);
        break;
      case 'layout-shift':
        this.recordCLS(entry as PerformanceEntry);
        break;
      case 'first-input':
        this.recordINP(entry as PerformanceEntry);
        break;
      case 'paint':
        this.recordPaint(entry as PerformanceEntry);
        break;
      case 'navigation':
        this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
        break;
    }
  }

  private recordLCP(entry: LargestContentfulPaint): void {
    const vital: WebVital = {
      name: 'LCP',
      value: entry.startTime,
      rating: this.getRating('LCP', entry.startTime),
      delta: 0, // LCP doesn't have delta
      id: this.generateId(),
      navigationType: this.getNavigationType()
    };

    this.metrics.update(current => ({ ...current, LCP: vital }));
    this.sendMetricToSentry(vital);
  }

  private recordCLS(entry: PerformanceEntry): void {
    // CLS needs to be accumulated
    const clsEntry = entry as any; // LayoutShiftEntry
    if (!clsEntry.hadRecentInput) {
      const currentCLS = this.metrics().CLS?.value || 0;
      const newCLS = currentCLS + clsEntry.value;
      
      const vital: WebVital = {
        name: 'CLS',
        value: newCLS,
        rating: this.getRating('CLS', newCLS),
        delta: clsEntry.value,
        id: this.generateId(),
        navigationType: this.getNavigationType()
      };

      this.metrics.update(current => ({ ...current, CLS: vital }));
      this.sendMetricToSentry(vital);
    }
  }

  private recordINP(entry: PerformanceEntry): void {
    const vital: WebVital = {
      name: 'INP',
      value: entry.duration,
      rating: this.getRating('INP', entry.duration),
      delta: entry.duration,
      id: this.generateId(),
      navigationType: this.getNavigationType()
    };

    this.metrics.update(current => ({ ...current, INP: vital }));
    this.sendMetricToSentry(vital);
  }

  private recordPaint(entry: PerformanceEntry): void {
    if (entry.name === 'first-contentful-paint') {
      const vital: WebVital = {
        name: 'FCP',
        value: entry.startTime,
        rating: this.getRating('FCP', entry.startTime),
        delta: 0,
        id: this.generateId(),
        navigationType: this.getNavigationType()
      };

      this.metrics.update(current => ({ ...current, FCP: vital }));
      this.sendMetricToSentry(vital);
    }
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    // TTFB
    const ttfbVital: WebVital = {
      name: 'TTFB',
      value: entry.responseStart - entry.fetchStart,
      rating: this.getRating('TTFB', entry.responseStart - entry.fetchStart),
      delta: 0,
      id: this.generateId(),
      navigationType: this.getNavigationType()
    };

    this.metrics.update(current => ({ ...current, TTFB: ttfbVital }));
    this.sendMetricToSentry(ttfbVital);

    // TTI (simplified calculation)
    const tti = this.calculateTTI(entry);
    if (tti) {
      const ttiVital: WebVital = {
        name: 'TTI',
        value: tti,
        rating: this.getRating('TTI', tti),
        delta: 0,
        id: this.generateId(),
        navigationType: this.getNavigationType()
      };

      this.metrics.update(current => ({ ...current, TTI: ttiVital }));
      this.sendMetricToSentry(ttiVital);
    }
  }

  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const resource: ResourceTiming = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      duration: entry.responseEnd - entry.requestStart,
      size: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0
    };

    this.resourceTimings.update(current => [...current, resource]);

    // Keep only last 100 resources
    if (this.resourceTimings().length > 100) {
      this.resourceTimings.update(current => current.slice(-100));
    }

    // Track slow resources
    if (resource.duration > 3000) {
      this.sentryService.captureMessage(
        `Slow resource: ${resource.name} took ${resource.duration}ms`,
        'warning',
        { resource }
      );
    }
  }

  private calculateTTI(navEntry: PerformanceNavigationTiming): number | null {
    // Simplified TTI calculation - in production you'd use a more sophisticated method
    const domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.fetchStart;
    const loadComplete = navEntry.loadEventEnd - navEntry.fetchStart;
    
    // Estimate TTI as the point when main thread is likely free
    return Math.max(domContentLoaded, loadComplete);
  }

  private recordNavigation(): void {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry) {
      this.recordNavigationMetrics(navEntry);
    }
  }

  private recordMemoryUsage(): void {
    const memory = (performance as any).memory;
    if (memory) {
      const usage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };

      this.sentryService.addBreadcrumb(
        `Memory usage: ${usage.percentage.toFixed(1)}%`,
        'memory',
        usage.percentage > 80 ? 'warning' : 'info',
        usage
      );

      // Alert on high memory usage
      if (usage.percentage > 90) {
        this.sentryService.captureMessage(
          `High memory usage: ${usage.percentage.toFixed(1)}%`,
          'warning',
          usage
        );
      }
    }
  }

  private sendMetricToSentry(vital: WebVital): void {
    this.sentryService.trackPerformance(vital.name, vital.value);
    
    if (vital.rating === 'poor') {
      this.sentryService.captureMessage(
        `Poor Web Vital: ${vital.name} = ${vital.value}`,
        'warning',
        { vital }
      );
    }
  }

  private getRating(metric: keyof typeof this.thresholds, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.thresholds[metric];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private getNavigationType(): string {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navEntry) return 'unknown';
    
    switch (navEntry.type) {
      case 'navigate': return 'navigation';
      case 'reload': return 'reload';
      case 'back_forward': return 'back_forward';
      case 'prerender': return 'prerender';
      default: return 'unknown';
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getMetrics(): PerformanceMetrics {
    return this.metrics();
  }

  getResourceTimings(): ResourceTiming[] {
    return this.resourceTimings();
  }

  getPerformanceScore(): number {
    const metrics = this.metrics();
    let score = 100;
    let count = 0;

    Object.entries(metrics).forEach(([name, vital]) => {
      if (vital) {
        count++;
        switch (vital.rating) {
          case 'good': break; // No penalty
          case 'needs-improvement': score -= 10; break;
          case 'poor': score -= 25; break;
        }
      }
    });

    return count > 0 ? Math.max(0, score) : 100;
  }

  getSlowResources(thresholdMs: number = 3000): ResourceTiming[] {
    return this.resourceTimings().filter(resource => resource.duration > thresholdMs);
  }

  getLargestResources(limit: number = 10): ResourceTiming[] {
    return this.resourceTimings()
      .sort((a, b) => b.size - a.size)
      .slice(0, limit);
  }

  // Manual timing methods
  startTimer(name: string): () => number {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.sentryService.addBreadcrumb(
        `Timer: ${name} completed`,
        'timer',
        'info',
        { name, duration }
      );
      return duration;
    };
  }

  measureFunction<T>(name: string, fn: () => T): T {
    const endTimer = this.startTimer(name);
    try {
      const result = fn();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const endTimer = this.startTimer(name);
    try {
      const result = await fn();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  // Health check
  checkHealth(): { healthy: boolean; checks: Record<string, boolean> } {
    const checks = {
      tracking_enabled: this.isTracking(),
      vitals_observer: !!this.vitalsObserver,
      resource_observer: !!this.resourceObserver,
      performance_api_available: this.isPerformanceAPIAvailable()
    };

    return {
      healthy: Object.values(checks).every(check => check),
      checks
    };
  }

  // Debug methods
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics(),
      resourceTimings: this.resourceTimings(),
      score: this.getPerformanceScore(),
      timestamp: Date.now()
    }, null, 2);
  }

  clearMetrics(): void {
    this.metrics.set({});
    this.resourceTimings.set([]);
    this.sentryService.addBreadcrumb('Performance metrics cleared', 'performance', 'info');
  }
}
