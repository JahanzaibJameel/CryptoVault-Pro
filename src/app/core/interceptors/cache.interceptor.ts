/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<
    string,
    { response: HttpResponse<any>; timestamp: number; etag?: string }
  >();
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CACHEABLE_METHODS = ['GET', 'HEAD'];
  private readonly CACHEABLE_STATUS_CODES = [200, 203, 300, 301, 302, 304, 307];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only cache GET and HEAD requests
    if (!this.isCacheable(req)) {
      return next.handle(req);
    }

    // Check cache first
    const cachedResponse = this.getFromCache(req);
    if (cachedResponse) {
      return of(cachedResponse);
    }

    // Make the request and cache the response
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse && this.isCacheableResponse(event)) {
          this.putInCache(req, event);
        }
      }),
      catchError((error) => {
        // On error, try to serve stale cache if available
        const staleResponse = this.getStaleFromCache(req);
        if (staleResponse) {
          console.warn(`Serving stale cache for ${req.url} due to network error`);
          return of(staleResponse);
        }
        return throwError(() => error);
      }),
    );
  }

  private isCacheable(req: HttpRequest<any>): boolean {
    // Don't cache requests with Cache-Control: no-cache
    if (req.headers.get('Cache-Control') === 'no-cache') {
      return false;
    }

    // Don't cache requests with cache busting parameters
    if (req.url.includes('cache_bust') || req.url.includes('_t=')) {
      return false;
    }

    return this.CACHEABLE_METHODS.includes(req.method);
  }

  private isCacheableResponse(response: HttpResponse<any>): boolean {
    return this.CACHEABLE_STATUS_CODES.includes(response.status);
  }

  private getCacheKey(req: HttpRequest<any>): string {
    // Include method and URL in cache key
    const key = `${req.method}:${req.url}`;

    // Include body for POST requests if needed (rare case)
    if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
      return `${key}:${JSON.stringify(req.body)}`;
    }

    return key;
  }

  private getFromCache(req: HttpRequest<any>): HttpResponse<any> | null {
    const key = this.getCacheKey(req);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    const ttl = this.getCacheTTL(req);
    if (Date.now() - cached.timestamp < ttl) {
      // Add cache header for debugging
      const response = cached.response.clone({
        headers: cached.response.headers.set('X-Cache', 'HIT'),
      });
      return response;
    }

    return null;
  }

  private getStaleFromCache(req: HttpRequest<any>): HttpResponse<any> | null {
    const key = this.getCacheKey(req);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Return stale cache with appropriate header
    const response = cached.response.clone({
      headers: cached.response.headers
        .set('X-Cache', 'STALE')
        .set('X-Cache-Age', `${Date.now() - cached.timestamp}`),
    });

    return response;
  }

  private putInCache(req: HttpRequest<any>, response: HttpResponse<any>): void {
    const key = this.getCacheKey(req);

    // Don't cache if response has Cache-Control: no-store
    if (response.headers.get('Cache-Control')?.includes('no-store')) {
      return;
    }

    const etag = response.headers.get('ETag');

    this.cache.set(key, {
      response: response.clone({
        headers: response.headers.set('X-Cache', 'MISS'),
      }),
      timestamp: Date.now(),
      etag: etag || undefined,
    });

    // Clean up old entries periodically
    this.cleanupCache();
  }

  private getCacheTTL(req: HttpRequest<any>): number {
    // Check for custom cache duration in headers
    const cacheControl = req.headers.get('Cache-Control');
    if (cacheControl) {
      const maxAge = this.parseMaxAge(cacheControl);
      if (maxAge !== null) {
        return maxAge * 1000; // Convert to milliseconds
      }
    }

    // Default TTL based on URL patterns
    if (req.url.includes('/api/v3/coins/markets')) {
      return 30 * 1000; // 30 seconds for market data
    }

    if (req.url.includes('/api/v3/simple/price')) {
      return 10 * 1000; // 10 seconds for price data
    }

    return this.DEFAULT_CACHE_TTL;
  }

  private parseMaxAge(cacheControl: string): number | null {
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    return maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : null;
  }

  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      const ttl = this.DEFAULT_CACHE_TTL; // Use default TTL for cleanup

      if (now - cached.timestamp > ttl * 2) {
        // Keep stale entries for 2x TTL
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.debug(`Cache cleanup: removed ${keysToDelete.length} stale entries`);
    }
  }

  // Public API for cache management
  clearCache(): void {
    this.cache.clear();
    console.log('HTTP cache cleared');
  }

  clearCacheForUrl(url: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(url)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    console.log(`Cleared cache entries for URL: ${url}`);
  }

  clearCacheForPattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    console.log(`Cleared cache entries matching pattern: ${pattern}`);
  }

  getCacheInfo(): {
    size: number;
    entries: Array<{ key: string; timestamp: number; age: number; etag?: string }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, cached]) => ({
      key,
      timestamp: cached.timestamp,
      age: now - cached.timestamp,
      etag: cached.etag,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // Cache warming
  warmCache(requests: HttpRequest<any>[]): void {
    console.log(`Warming cache for ${requests.length} requests`);
    // This would typically be used with an HTTP client to pre-fetch data
    // Implementation depends on how you want to handle cache warming
  }

  // Cache statistics
  getCacheStats(): {
    totalEntries: number;
    totalSize: number; // Estimated
    oldestEntry: number;
    newestEntry: number;
    averageAge: number;
  } {
    if (this.cache.size === 0) {
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: 0,
        newestEntry: 0,
        averageAge: 0,
      };
    }

    const now = Date.now();
    const timestamps = Array.from(this.cache.values()).map((cached) => cached.timestamp);
    const ages = timestamps.map((timestamp) => now - timestamp);

    return {
      totalEntries: this.cache.size,
      totalSize: this.estimateCacheSize(),
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps),
      averageAge: ages.reduce((sum, age) => sum + age, 0) / ages.length,
    };
  }

  private estimateCacheSize(): number {
    // Rough estimation of cache size in bytes
    let totalSize = 0;

    for (const [key, cached] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(cached.response.body || {}).length * 2;
      totalSize += 100; // Estimated overhead
    }

    return totalSize;
  }
}
