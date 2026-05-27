import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { PerformanceOptimizerService } from '../services/performance-optimizer.service';
import { environment } from '../../../environments/environment';

export interface PerformanceMetrics {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  size?: number;
  status?: number;
  cacheHit?: boolean;
  error?: string;
}

@Injectable()
export class PerformanceInterceptor implements HttpInterceptor {
  private performanceService = inject(PerformanceOptimizerService);
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private readonly SLOW_REQUEST_THRESHOLD = 2000; // 2 seconds
  private readonly LARGE_PAYLOAD_THRESHOLD = 1024 * 1024; // 1MB

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = performance.now();
    const requestId = this.generateRequestId();
    
    // Initialize metrics
    const metrics: PerformanceMetrics = {
      url: req.url,
      method: req.method,
      startTime
    };

    this.metrics.set(requestId, metrics);

    // Log request start
    this.logRequestStart(req, requestId);

    return next.handle(req).pipe(
      tap(event => {
        if (event.type === 4) { // HTTP Response
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // Update metrics
          metrics.endTime = endTime;
          metrics.duration = duration;
          metrics.status = (event as any).status;
          metrics.size = this.getResponseSize(event);
          metrics.cacheHit = this.isCacheHit(req);

          // Analyze performance
          this.analyzeRequestPerformance(metrics);
          
          // Log completion
          this.logRequestComplete(metrics, requestId);
        }
      }),
      catchError(error => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Update error metrics
        metrics.endTime = endTime;
        metrics.duration = duration;
        metrics.error = error.message || 'Unknown error';

        // Log error
        this.logRequestError(metrics, requestId);
        
        return throwError(() => error);
      }),
      finalize(() => {
        // Cleanup
        this.metrics.delete(requestId);
      })
    );
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log request start with performance context
   */
  private logRequestStart(req: HttpRequest<any>, requestId: string): void {
    if (this.isDebugEnabled()) {
      console.group(`🌐 [${requestId}] HTTP Request`);
      console.log(`📤 ${req.method} ${req.url}`);
      console.log(`⏰ Started: ${new Date().toISOString()}`);
      
      // Log headers for debugging
      if (req.headers.keys().length > 0) {
        console.log('📋 Headers:', req.headers.keys());
      }
      
      // Log body size if present
      if (req.body) {
        const bodySize = this.getBodySize(req.body);
        console.log(`📦 Body size: ${this.formatBytes(bodySize)}`);
      }
      
      console.groupEnd();
    }
  }

  /**
   * Log request completion with performance metrics
   */
  private logRequestComplete(metrics: PerformanceMetrics, requestId: string): void {
    if (this.isDebugEnabled()) {
      console.group(`✅ [${requestId}] Request Complete`);
      console.log(`📤 ${metrics.method} ${metrics.url}`);
      console.log(`📊 Status: ${metrics.status}`);
      console.log(`⏱️ Duration: ${metrics.duration?.toFixed(2)}ms`);
      console.log(`📦 Size: ${this.formatBytes(metrics.size || 0)}`);
      
      if (metrics.cacheHit) {
        console.log(`💾 Cache: HIT`);
      }
      
      // Performance warnings
      if (metrics.duration && metrics.duration > this.SLOW_REQUEST_THRESHOLD) {
        console.warn(`⚠️ Slow request detected (${metrics.duration.toFixed(2)}ms > ${this.SLOW_REQUEST_THRESHOLD}ms)`);
      }
      
      if (metrics.size && metrics.size > this.LARGE_PAYLOAD_THRESHOLD) {
        console.warn(`⚠️ Large payload detected (${this.formatBytes(metrics.size)} > ${this.formatBytes(this.LARGE_PAYLOAD_THRESHOLD)})`);
      }
      
      console.groupEnd();
    }
  }

  /**
   * Log request error with performance context
   */
  private logRequestError(metrics: PerformanceMetrics, requestId: string): void {
    if (this.isDebugEnabled()) {
      console.group(`❌ [${requestId}] Request Failed`);
      console.log(`📤 ${metrics.method} ${metrics.url}`);
      console.log(`⏱️ Duration: ${metrics.duration?.toFixed(2)}ms`);
      console.log(`💥 Error: ${metrics.error}`);
      console.groupEnd();
    }
  }

  /**
   * Analyze request performance and suggest optimizations
   */
  private analyzeRequestPerformance(metrics: PerformanceMetrics): void {
    if (!metrics.duration || !metrics.size) return;

    const suggestions: string[] = [];

    // Analyze response time
    if (metrics.duration > this.SLOW_REQUEST_THRESHOLD) {
      suggestions.push(`Slow response (${metrics.duration.toFixed(2)}ms): Consider caching, CDN, or API optimization`);
      
      // Check if it's a repeated slow request
      const similarRequests = this.getSimilarRequests(metrics.url);
      if (similarRequests.length > 1) {
        suggestions.push(`Repeated slow requests to ${metrics.url}: Implement request deduplication`);
      }
    }

    // Analyze payload size
    if (metrics.size > this.LARGE_PAYLOAD_THRESHOLD) {
      suggestions.push(`Large payload (${this.formatBytes(metrics.size)}): Consider pagination, compression, or field filtering`);
    }

    // Analyze cache efficiency
    if (!metrics.cacheHit && this.shouldBeCached(metrics.url)) {
      suggestions.push(`Uncached request to ${metrics.url}: Consider adding to cache strategy`);
    }

    // Analyze HTTP method efficiency
    if (metrics.method === 'GET' && metrics.duration > 1000) {
      suggestions.push(`Slow GET request: Consider implementing HTTP caching headers`);
    }

    // Log suggestions if any
    if (suggestions.length > 0) {
      console.group('🚀 Performance Optimization Suggestions');
      suggestions.forEach(suggestion => console.warn(`⚠️ ${suggestion}`));
      console.groupEnd();
    }
  }

  /**
   * Get response size from HTTP event
   */
  private getResponseSize(event: HttpEvent<any>): number {
    const httpResponse = event as any;
    if (httpResponse.body) {
      return new Blob([httpResponse.body]).size;
    }
    return 0;
  }

  /**
   * Get body size for request logging
   */
  private getBodySize(body: any): number {
    if (!body) return 0;
    
    if (typeof body === 'string') {
      return new Blob([body]).size;
    }
    
    if (body instanceof FormData) {
      let size = 0;
      for (const [key, value] of (body as any).entries()) {
        if (typeof value === 'string') {
          size += new Blob([value]).size;
        } else if (value instanceof Blob) {
          size += value.size;
        }
      }
      return size;
    }
    
    return new Blob([JSON.stringify(body)]).size;
  }

  /**
   * Check if request is a cache hit
   */
  private isCacheHit(req: HttpRequest<any>): boolean {
    // This would need to be implemented based on your caching strategy
    // For now, return false as a placeholder
    return false;
  }

  /**
   * Check if request should be cached based on URL patterns
   */
  private shouldBeCached(url: string): boolean {
    const cacheablePatterns = [
      /\/api\/coins/i,
      /\/api\/market/i,
      /\/api\/portfolio/i,
      /\.json$/i
    ];

    return cacheablePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Get similar requests for analysis
   */
  private getSimilarRequests(url: string): PerformanceMetrics[] {
    const urlPattern = new URL(url).pathname;
    return Array.from(this.metrics.values())
      .filter(metric => new URL(metric.url).pathname === urlPattern)
      .filter(metric => metric.duration && metric.duration > this.SLOW_REQUEST_THRESHOLD);
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if debug logging is enabled
   */
  private isDebugEnabled(): boolean {
    // Check environment or configuration
    return !environment.production || localStorage.getItem('debug_http') === 'true';
  }

  /**
   * Get performance metrics for monitoring
   */
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get slow requests
   */
  getSlowRequests(threshold?: number): PerformanceMetrics[] {
    const slowThreshold = threshold || this.SLOW_REQUEST_THRESHOLD;
    return Array.from(this.metrics.values())
      .filter(metric => metric.duration && metric.duration > slowThreshold)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));
  }

  /**
   * Get large payloads
   */
  getLargePayloads(threshold?: number): PerformanceMetrics[] {
    const largeThreshold = threshold || this.LARGE_PAYLOAD_THRESHOLD;
    return Array.from(this.metrics.values())
      .filter(metric => metric.size && metric.size > largeThreshold)
      .sort((a, b) => (b.size || 0) - (a.size || 0));
  }
}
