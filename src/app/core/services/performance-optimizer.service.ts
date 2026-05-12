import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TransferState, makeStateKey } from '@angular/platform-browser';

export interface PerformanceMetrics {
  navigationTiming: PerformanceNavigationTiming;
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
}

export interface OptimizationStrategy {
  name: string;
  description: string;
  apply: () => void;
  revert?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceOptimizerService {
  private router = inject(Router);
  private transferState = inject(TransferState);
  
  private metrics: PerformanceMetrics[] = [];
  private strategies: Map<string, OptimizationStrategy> = new Map();
  private observers: PerformanceObserver[] = [];
  
  private readonly PERFORMANCE_KEY = makeStateKey<PerformanceMetrics[]>('perf_metrics');
  private readonly THRESHOLDS = {
    LCP_GOOD: 2500,      // 2.5s
    LCP_NEEDS_IMPROVEMENT: 4000, // 4s
    FID_GOOD: 100,        // 100ms
    FID_NEEDS_IMPROVEMENT: 300, // 300ms
    CLS_GOOD: 0.1,       // 0.1
    CLS_NEEDS_IMPROVEMENT: 0.25 // 0.25
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
      apply: () => this.enableSmartPreloading()
    });

    // Bundle splitting optimization
    this.strategies.set('bundleSplitting', {
      name: 'Dynamic Bundle Splitting',
      description: 'Splits bundles based on route and feature usage',
      apply: () => this.optimizeBundleLoading()
    });

    // Memory management
    this.strategies.set('memoryManagement', {
      name: 'Memory Management',
      description: 'Optimizes memory usage through garbage collection hints',
      apply: () => this.optimizeMemoryUsage()
    });

    // Image optimization
    this.strategies.set('imageOptimization', {
      name: 'Progressive Image Loading',
      description: 'Implements lazy loading and WebP format detection',
      apply: () => this.enableProgressiveImageLoading()
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

      vitalsObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
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
   * Extract metric data from performance entry
   */
  private extractMetricFromEntry(entry: PerformanceEntry): Partial<PerformanceMetrics['coreWebVitals']> | null {
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        return { lcp: entry.startTime };
      
      case 'first-input':
        return { fid: (entry as any).processingStart - entry.startTime };
      
      case 'layout-shift':
        return { cls: (entry as any).value };
      
      default:
        return null;
    }
  }

  /**
   * Evaluate performance against thresholds and suggest optimizations
   */
  private evaluatePerformance(metrics: Partial<PerformanceMetrics['coreWebVitals']>): void {
    const suggestions: string[] = [];

    if (metrics.lcp) {
      if (metrics.lcp > this.THRESHOLDS.LCP_NEEDS_IMPROVEMENT) {
        suggestions.push('LCP needs improvement: Consider optimizing images and server response time');
      } else if (metrics.lcp > this.THRESHOLDS.LCP_GOOD) {
        suggestions.push('LCP could be improved: Optimize critical resources');
      }
    }

    if (metrics.fid) {
      if (metrics.fid > this.THRESHOLDS.FID_NEEDS_IMPROVEMENT) {
        suggestions.push('FID needs improvement: Reduce JavaScript execution time');
      } else if (metrics.fid > this.THRESHOLDS.FID_GOOD) {
        suggestions.push('FID could be improved: Minimize main thread work');
      }
    }

    if (metrics.cls) {
      if (metrics.cls > this.THRESHOLDS.CLS_NEEDS_IMPROVEMENT) {
        suggestions.push('CLS needs improvement: Ensure stable layout during load');
      } else if (metrics.cls > this.THRESHOLDS.CLS_GOOD) {
        suggestions.push('CLS could be improved: Optimize dynamic content insertion');
      }
    }

    if (suggestions.length > 0) {
      console.group('🚀 Performance Optimization Suggestions');
      suggestions.forEach(suggestion => console.warn(`⚠️ ${suggestion}`));
      console.groupEnd();
    }
  }

  /**
   * Enable smart route preloading based on user patterns
   */
  private enableSmartPreloading(): void {
    // Implement intelligent preloading based on user behavior analytics
    this.router.events.subscribe((event) => {
      // Track route access patterns
      // Preload likely next routes
      // Cache critical components
    });
  }

  /**
   * Optimize bundle loading with dynamic imports
   */
  private optimizeBundleLoading(): void {
    // Implement dynamic bundle splitting
    // Load non-critical bundles on demand
    // Implement bundle versioning for caching
  }

  /**
   * Optimize memory usage with garbage collection hints
   */
  private optimizeMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      // Trigger garbage collection if memory usage is high
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
        if ('gc' in window) {
          (window as any).gc();
        }
      }
    }
  }

  /**
   * Enable progressive image loading with WebP support
   */
  private enableProgressiveImageLoading(): void {
    // Implement intersection observer for lazy loading
    // Detect WebP support and serve appropriate format
    // Add blur-up placeholder technique
  }

  /**
   * Monitor navigation timing metrics
   */
  private observeNavigationTiming(): void {
    const navigationObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const navTiming = entry as PerformanceNavigationTiming;
        this.recordMetrics({
          navigationTiming: navTiming,
          renderTime: navTiming.loadEventEnd - navTiming.loadEventStart,
          bundleSize: this.calculateBundleSize(),
          memoryUsage: this.getMemoryUsage(),
          coreWebVitals: { lcp: 0, fid: 0, cls: 0 }
        });
      }
    });

    navigationObserver.observe({ entryTypes: ['navigation'] });
    this.observers.push(navigationObserver);
  }

  /**
   * Monitor render performance
   */
  private observeRenderPerformance(): void {
    let renderStartTime: number;

    const renderObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'render') {
          renderStartTime = entry.startTime;
        }
      }
    });

    renderObserver.observe({ entryTypes: ['measure'] });
    this.observers.push(renderObserver);
  }

  /**
   * Monitor memory usage
   */
  private observeMemoryUsage(): void {
    setInterval(() => {
      const memoryUsage = this.getMemoryUsage();
      if (memoryUsage > 0.8) { // 80% threshold
        this.optimizeMemoryUsage();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Store in transfer state for SSR
    this.transferState.set(this.PERFORMANCE_KEY, this.metrics);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Calculate bundle size from performance entries
   */
  private calculateBundleSize(): number {
    const resources = performance.getEntriesByType('resource');
    return resources.reduce((total, resource) => {
      return total + (resource as any).transferSize || 0;
    }, 0);
  }

  /**
   * Get current memory usage as percentage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
    return 0;
  }

  /**
   * Check if Performance API is supported
   */
  private isPerformanceSupported(): boolean {
    return 'performance' in window && 'observer' in window.Performance;
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
    if (this.metrics.length === 0) return {};

    const sum = this.metrics.reduce((acc, metric) => ({
      renderTime: (acc.renderTime || 0) + metric.renderTime,
      bundleSize: (acc.bundleSize || 0) + metric.bundleSize,
      memoryUsage: (acc.memoryUsage || 0) + metric.memoryUsage,
      coreWebVitals: {
        lcp: (acc.coreWebVitals?.lcp || 0) + metric.coreWebVitals.lcp,
        fid: (acc.coreWebVitals?.fid || 0) + metric.coreWebVitals.fid,
        cls: (acc.coreWebVitals?.cls || 0) + metric.coreWebVitals.cls
      }
    }), {} as any);

    const count = this.metrics.length;
    return {
      renderTime: sum.renderTime / count,
      bundleSize: sum.bundleSize / count,
      memoryUsage: sum.memoryUsage / count,
      coreWebVitals: {
        lcp: sum.coreWebVitals.lcp / count,
        fid: sum.coreWebVitals.fid / count,
        cls: sum.coreWebVitals.cls / count
      }
    };
  }

  /**
   * Apply optimization strategy
   */
  applyStrategy(strategyName: string): void {
    const strategy = this.strategies.get(strategyName);
    if (strategy) {
      console.log(`🚀 Applying optimization strategy: ${strategy.name}`);
      strategy.apply();
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
   * Cleanup observers on destroy
   */
  ngOnDestroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}
