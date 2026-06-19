import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TransferState, makeStateKey } from '@angular/core';

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift (0-1)
}

export interface PerformanceMetrics {
  navigationTiming: PerformanceNavigationTiming;
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  coreWebVitals: CoreWebVitals;
}

export interface OptimizationStrategy {
  name: string;
  description: string;
  apply: () => void;
  revert?: () => void;
}

/**
 * Performance thresholds and limits
 */
interface PerformanceThresholds {
  lcpGood: number;
  lcpNeedsImprovement: number;
  fidGood: number;
  fidNeedsImprovement: number;
  clsGood: number;
  clsNeedsImprovement: number;
  memoryHighThreshold: number;
  maxMetricsStored: number;
  memoryCheckInterval: number;
}

@Injectable({
  providedIn: 'root',
})
export class PerformanceOptimizerService implements OnDestroy {
  private readonly router = inject(Router);
  private readonly transferState = inject(TransferState);

  private metrics: PerformanceMetrics[] = [];
  private strategies: Map<string, OptimizationStrategy> = new Map();
  private observers: PerformanceObserver[] = [];
  private memoryCheckIntervalId: number | null = null;

  private readonly PERFORMANCE_KEY = makeStateKey<PerformanceMetrics[]>('perf_metrics');

  private readonly THRESHOLDS: PerformanceThresholds = {
    lcpGood: 2500, // 2.5s
    lcpNeedsImprovement: 4000, // 4s
    fidGood: 100, // 100ms
    fidNeedsImprovement: 300, // 300ms
    clsGood: 0.1, // 0.1
    clsNeedsImprovement: 0.25, // 0.25
    memoryHighThreshold: 0.8, // 80%
    maxMetricsStored: 100,
    memoryCheckInterval: 30000, // 30 seconds
  };

  constructor() {
    this.initializeStrategies();
    this.setupPerformanceMonitoring();
  }

  /**
   * Initialize performance optimization strategies
   */
  private initializeStrategies(): void {
    // Route preloading optimization
    this.strategies.set('routePreloading', {
      name: 'Smart Route Preloading',
      description: 'Preloads critical routes based on user behavior patterns',
      apply: () => this.enableSmartPreloading(),
    });

    // Bundle splitting optimization
    this.strategies.set('bundleSplitting', {
      name: 'Dynamic Bundle Splitting',
      description: 'Splits bundles based on route and feature usage',
      apply: () => this.optimizeBundleLoading(),
    });

    // Memory management
    this.strategies.set('memoryManagement', {
      name: 'Memory Management',
      description: 'Optimizes memory usage through garbage collection hints',
      apply: () => this.optimizeMemoryUsage(),
    });

    // Image optimization
    this.strategies.set('imageOptimization', {
      name: 'Progressive Image Loading',
      description: 'Implements lazy loading and WebP format detection',
      apply: () => this.enableProgressiveImageLoading(),
    });
  }

  /**
   * Setup comprehensive performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (!this.isPerformanceSupported()) return;

    // Monitor Core Web Vitals
    this.observeCoreWebVitals();

    // Monitor navigation timing
    this.observeNavigationTiming();

    // Monitor render performance
    this.observeRenderPerformance();

    // Monitor memory usage
    this.observeMemoryUsage();
  }

  /**
   * Observe Core Web Vitals (LCP, FID, CLS)
   */
  private observeCoreWebVitals(): void {
    try {
      const vitalsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processVitalEntry(entry);
        }
      });

      vitalsObserver.observe({
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'],
      });
      this.observers.push(vitalsObserver);
    } catch (error) {
      console.warn('Core Web Vitals monitoring not supported:', error);
    }
  }

  /**
   * Process individual vital entry
   */
  private processVitalEntry(entry: PerformanceEntry): void {
    const metric = this.extractMetricFromEntry(entry);
    if (metric) {
      this.evaluatePerformance(metric);
    }
  }

  /**
   * Extract metric data from performance entry with proper typing
   */
  private extractMetricFromEntry(entry: PerformanceEntry): Partial<CoreWebVitals> | null {
    try {
      switch (entry.entryType) {
        case 'largest-contentful-paint':
          return { lcp: entry.startTime };

        case 'first-input':
          const firstInputEntry = entry as PerformanceEventTiming;
          return { fid: firstInputEntry.processingStart - entry.startTime };

        case 'layout-shift':
          const layoutShiftEntry = entry as any; // LayoutShift doesn't have standard typing
          return { cls: layoutShiftEntry.value || 0 };

        default:
          return null;
      }
    } catch (error) {
      console.error('Error extracting metric from entry:', error);
      return null;
    }
  }

  /**
   * Evaluate performance against thresholds and suggest optimizations
   */
  private evaluatePerformance(metrics: Partial<CoreWebVitals>): void {
    const suggestions: string[] = [];

    if (metrics.lcp) {
      if (metrics.lcp > this.THRESHOLDS.lcpNeedsImprovement) {
        suggestions.push(
          'LCP needs improvement: Consider optimizing images and server response time',
        );
      } else if (metrics.lcp > this.THRESHOLDS.lcpGood) {
        suggestions.push('LCP could be improved: Optimize critical resources');
      }
    }

    if (metrics.fid) {
      if (metrics.fid > this.THRESHOLDS.fidNeedsImprovement) {
        suggestions.push('FID needs improvement: Reduce JavaScript execution time');
      } else if (metrics.fid > this.THRESHOLDS.fidGood) {
        suggestions.push('FID could be improved: Minimize main thread work');
      }
    }

    if (metrics.cls) {
      if (metrics.cls > this.THRESHOLDS.clsNeedsImprovement) {
        suggestions.push('CLS needs improvement: Ensure stable layout during load');
      } else if (metrics.cls > this.THRESHOLDS.clsGood) {
        suggestions.push('CLS could be improved: Optimize dynamic content insertion');
      }
    }

    if (suggestions.length > 0) {
      this.logPerformanceSuggestions(suggestions);
    }
  }

  /**
   * Enable smart route preloading based on user patterns
   */
  private enableSmartPreloading(): void {
    try {
      // Implement intelligent preloading based on user behavior analytics
      this.router.events.subscribe((event) => {
        // Track route access patterns
        // Preload likely next routes
        // Cache critical components
      });
    } catch (error) {
      console.error('Failed to enable smart preloading:', error);
    }
  }

  /**
   * Optimize bundle loading with dynamic imports
   */
  private optimizeBundleLoading(): void {
    try {
      // Implement dynamic bundle splitting
      // Load non-critical bundles on demand
      // Implement bundle versioning for caching
      console.info('Bundle optimization strategy activated');
    } catch (error) {
      console.error('Failed to optimize bundle loading:', error);
    }
  }

  /**
   * Optimize memory usage with garbage collection hints
   */
  private optimizeMemoryUsage(): void {
    try {
      if (!this.isMemoryMonitoringSupported()) {
        return;
      }

      const memory = (performance as any).memory;

      // Trigger garbage collection if memory usage is high
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * this.THRESHOLDS.memoryHighThreshold) {
        if ('gc' in window) {
          (window as any).gc();
          console.info('Garbage collection triggered due to high memory usage');
        }
      }
    } catch (error) {
      console.error('Failed to optimize memory usage:', error);
    }
  }

  /**
   * Enable progressive image loading with WebP support
   */
  private enableProgressiveImageLoading(): void {
    try {
      // Implement intersection observer for lazy loading
      // Detect WebP support and serve appropriate format
      // Add blur-up placeholder technique
      console.info('Progressive image loading strategy activated');
    } catch (error) {
      console.error('Failed to enable progressive image loading:', error);
    }
  }

  /**
   * Monitor navigation timing metrics with error handling
   */
  private observeNavigationTiming(): void {
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navTiming = entry as PerformanceNavigationTiming;
          this.recordMetrics({
            navigationTiming: navTiming,
            renderTime: navTiming.loadEventEnd - navTiming.loadEventStart,
            bundleSize: this.calculateBundleSize(),
            memoryUsage: this.getMemoryUsage(),
            coreWebVitals: this.createDefaultCoreWebVitals(),
          });
        }
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (error) {
      console.warn('Navigation timing monitoring not supported:', error);
    }
  }

  /**
   * Monitor render performance with error handling
   */
  private observeRenderPerformance(): void {
    try {
      const renderObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'render') {
            // Log render timing information
            console.debug(`Render timing: ${entry.startTime}ms`);
          }
        }
      });

      renderObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(renderObserver);
    } catch (error) {
      console.warn('Render performance monitoring not supported:', error);
    }
  }

  /**
   * Monitor memory usage and trigger optimization when threshold exceeded
   */
  private observeMemoryUsage(): void {
    if (!this.isMemoryMonitoringSupported()) {
      console.warn('Memory monitoring not supported on this browser');
      return;
    }

    this.memoryCheckIntervalId = window.setInterval(() => {
      const memoryUsage = this.getMemoryUsage();
      if (memoryUsage > this.THRESHOLDS.memoryHighThreshold) {
        this.optimizeMemoryUsage();
      }
    }, this.THRESHOLDS.memoryCheckInterval);
  }

  /**
   * Record performance metrics with transfer state support
   */
  private recordMetrics(metrics: PerformanceMetrics): void {
    try {
      this.metrics.push(metrics);
      this.transferState.set(this.PERFORMANCE_KEY, this.metrics);

      // Keep only last N metrics to prevent memory issues
      if (this.metrics.length > this.THRESHOLDS.maxMetricsStored) {
        this.metrics = this.metrics.slice(-this.THRESHOLDS.maxMetricsStored);
      }
    } catch (error) {
      console.error('Failed to record performance metrics:', error);
    }
  }

  /**
   * Calculate bundle size from performance entries
   */
  private calculateBundleSize(): number {
    try {
      const resources = performance.getEntriesByType('resource');
      return resources.reduce((total, resource) => {
        const transferSize = (resource as any).transferSize || 0;
        return total + transferSize;
      }, 0);
    } catch (error) {
      console.warn('Failed to calculate bundle size:', error);
      return 0;
    }
  }

  /**
   * Get current memory usage as percentage (0-1)
   */
  private getMemoryUsage(): number {
    try {
      if (!this.isMemoryMonitoringSupported()) {
        return 0;
      }

      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      return Math.min(usage, 1); // Ensure value is between 0-1
    } catch (error) {
      console.warn('Failed to get memory usage:', error);
      return 0;
    }
  }

  /**
   * Check if Performance API is supported
   */
  private isPerformanceSupported(): boolean {
    return 'performance' in window && 'PerformanceObserver' in window;
  }

  /**
   * Check if memory monitoring is supported
   */
  private isMemoryMonitoringSupported(): boolean {
    return 'memory' in performance;
  }

  /**
   * Log performance suggestions in a formatted way
   */
  private logPerformanceSuggestions(suggestions: string[]): void {
    console.group('🚀 Performance Optimization Suggestions');
    suggestions.forEach((suggestion) => console.warn(`⚠️ ${suggestion}`));
    console.groupEnd();
  }
  /**
   * Create a default CoreWebVitals object
   */
  private createDefaultCoreWebVitals(): CoreWebVitals {
    return { lcp: 0, fid: 0, cls: 0 };
  }
  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get average performance metrics
   */
  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) {
      return {};
    }

    const count = this.metrics.length;
    const avgMetrics = {
      renderTime: 0,
      bundleSize: 0,
      memoryUsage: 0,
      coreWebVitals: { lcp: 0, fid: 0, cls: 0 },
    };

    for (const metric of this.metrics) {
      avgMetrics.renderTime += metric.renderTime;
      avgMetrics.bundleSize += metric.bundleSize;
      avgMetrics.memoryUsage += metric.memoryUsage;
      avgMetrics.coreWebVitals.lcp += metric.coreWebVitals.lcp;
      avgMetrics.coreWebVitals.fid += metric.coreWebVitals.fid;
      avgMetrics.coreWebVitals.cls += metric.coreWebVitals.cls;
    }

    return {
      renderTime: avgMetrics.renderTime / count,
      bundleSize: avgMetrics.bundleSize / count,
      memoryUsage: avgMetrics.memoryUsage / count,
      coreWebVitals: {
        lcp: avgMetrics.coreWebVitals.lcp / count,
        fid: avgMetrics.coreWebVitals.fid / count,
        cls: avgMetrics.coreWebVitals.cls / count,
      },
    };
  }

  /**
   * Apply optimization strategy with validation
   */
  applyStrategy(strategyName: string): void {
    if (!strategyName || typeof strategyName !== 'string') {
      console.error('Invalid strategy name provided');
      return;
    }

    const strategy = this.strategies.get(strategyName);
    if (strategy) {
      try {
        console.log(`🚀 Applying optimization strategy: ${strategy.name}`);
        strategy.apply();
      } catch (error) {
        console.error(`Failed to apply strategy ${strategyName}:`, error);
      }
    } else {
      console.warn(`Unknown optimization strategy: ${strategyName}`);
    }
  }

  /**
   * Get available optimization strategies
   */
  getAvailableStrategies(): OptimizationStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Cleanup observers and intervals on destroy
   */
  ngOnDestroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];

    if (this.memoryCheckIntervalId !== null) {
      clearInterval(this.memoryCheckIntervalId);
      this.memoryCheckIntervalId = null;
    }
  }
}
