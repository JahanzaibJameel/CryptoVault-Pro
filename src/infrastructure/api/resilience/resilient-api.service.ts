import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { retry, tap, catchError } from 'rxjs/operators';
import { CircuitBreakerState } from './circuit-breaker.state';

@Injectable({
  providedIn: 'root'
})
export class ResilientApiService {
  private http = inject(HttpClient);
  private circuitBreaker = new CircuitBreakerState();
  private cache = new Map<string, { data: any; timestamp: number; etag?: string }>();
  private readonly CACHE_DURATION = 30_000; // 30 seconds

  get<T>(url: string, options?: { useCache?: boolean; cacheKey?: string }): Observable<T> {
    const cacheKey = options?.cacheKey || url;
    const useCache = options?.useCache ?? true;

    if (this.circuitBreaker.isOpen()) {
      const cached = this.serveFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
      return throwError(() => new Error('Circuit breaker is open and no cached data available'));
    }

    if (useCache) {
      const cached = this.serveFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    return this.http.get<T>(url).pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => {
          // Only retry on network errors or 5xx server errors
          if (error.status >= 500 || error.status === 0) {
            return timer(1000 * Math.pow(2, retryCount)); // Exponential backoff: 1s, 2s, 4s
          }
          throw error; // Don't retry on 4xx client errors
        }
      }),
      tap(data => {
        this.circuitBreaker.recordSuccess();
        this.cache.set(cacheKey, { 
          data, 
          timestamp: Date.now(),
          etag: this.extractEtag(data)
        });
      }),
      catchError(error => {
        this.circuitBreaker.recordFailure();
        
        // Try to serve stale cache on failure
        const cached = this.serveFromCache<T>(cacheKey);
        if (cached) {
          return cached;
        }
        
        return throwError(() => error);
      })
    );
  }

  post<T>(url: string, body: any, options?: { bypassCache?: boolean }): Observable<T> {
    if (this.circuitBreaker.isOpen()) {
      return throwError(() => new Error('Circuit breaker is open'));
    }

    return this.http.post<T>(url, body).pipe(
      retry({
        count: 2,
        delay: (error, retryCount) => {
          if (error.status >= 500 || error.status === 0) {
            return timer(1000 * Math.pow(2, retryCount));
          }
          throw error;
        }
      }),
      tap(data => {
        this.circuitBreaker.recordSuccess();
        
        // Invalidate relevant cache entries for POST requests
        if (!options?.bypassCache) {
          this.invalidateRelatedCache(url);
        }
      }),
      catchError(error => {
        this.circuitBreaker.recordFailure();
        return throwError(() => error);
      })
    );
  }

  put<T>(url: string, body: any): Observable<T> {
    if (this.circuitBreaker.isOpen()) {
      return throwError(() => new Error('Circuit breaker is open'));
    }

    return this.http.put<T>(url, body).pipe(
      retry({
        count: 2,
        delay: (error, retryCount) => {
          if (error.status >= 500 || error.status === 0) {
            return timer(1000 * Math.pow(2, retryCount));
          }
          throw error;
        }
      }),
      tap(() => {
        this.circuitBreaker.recordSuccess();
        this.invalidateRelatedCache(url);
      }),
      catchError(error => {
        this.circuitBreaker.recordFailure();
        return throwError(() => error);
      })
    );
  }

  delete<T>(url: string): Observable<T> {
    if (this.circuitBreaker.isOpen()) {
      return throwError(() => new Error('Circuit breaker is open'));
    }

    return this.http.delete<T>(url).pipe(
      retry({
        count: 2,
        delay: (error, retryCount) => {
          if (error.status >= 500 || error.status === 0) {
            return timer(1000 * Math.pow(2, retryCount));
          }
          throw error;
        }
      }),
      tap(() => {
        this.circuitBreaker.recordSuccess();
        this.invalidateRelatedCache(url);
      }),
      catchError(error => {
        this.circuitBreaker.recordFailure();
        return throwError(() => error);
      })
    );
  }

  // Cache management methods
  clearCache(): void {
    this.cache.clear();
  }

  clearCachePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCircuitBreakerState(): string {
    return this.circuitBreaker.getState();
  }

  getCircuitBreakerStats(): { failureCount: number; lastFailureTime: number; state: string } {
    return {
      failureCount: this.circuitBreaker.getFailureCount(),
      lastFailureTime: this.circuitBreaker.getLastFailureTime(),
      state: this.circuitBreaker.getState()
    };
  }

  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  private serveFromCache<T>(cacheKey: string): Observable<T> | null {
    const entry = this.cache.get(cacheKey);
    if (entry && (Date.now() - entry.timestamp) < this.CACHE_DURATION) {
      return of(entry.data as T);
    }
    return null;
  }

  private invalidateRelatedCache(url: string): void {
    // Invalidate cache entries that might be affected by this URL
    const baseUrl = url.split('?')[0];
    
    for (const key of this.cache.keys()) {
      if (key.includes(baseUrl) || baseUrl.includes(key)) {
        this.cache.delete(key);
      }
    }
  }

  private extractEtag(data: any): string | undefined {
    // Try to extract ETag from response headers if available
    // This is a simplified version - in a real implementation,
    // you'd get this from the HTTP response headers
    return undefined;
  }
}
