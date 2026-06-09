import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, timer, of, Subject } from 'rxjs';
import { retry, tap, catchError, shareReplay, takeUntil } from 'rxjs/operators';
import { CircuitBreakerState } from './circuit-breaker.state';

@Injectable({
  providedIn: 'root'
})
export class ResilientApiService {
  private http = inject(HttpClient);
  private circuitBreaker = inject(CircuitBreakerState);
  private cache = new Map<string, { data: any; timestamp: number; etag?: string }>();
  private readonly CACHE_DURATION = 30_000; // 30 seconds
  private pendingRequests = new Map<string, Observable<any>>();

  
  get<T>(url: string, options?: { useCache?: boolean; cacheKey?: string }): Observable<T> {
    const cacheKey = options?.cacheKey || url;
    const useCache = options?.useCache ?? true;

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey) as Observable<T>;
    }

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

    // Create the request observable with deduplication and caching
    const request$ = this.http.get<T>(url).pipe(
      retry({
        count: 3,
        delay: (error: any, retryCount: number) => {
          // Only retry on network errors or 5xx server errors
          if (error.status >= 500 || error.status === 0) {
            return timer(1000 * Math.pow(2, retryCount));
          }
          throw error;
        }
      }),
      tap((data: any) => {
        this.circuitBreaker.recordSuccess();
        
        // Cache the response
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          etag: this.extractEtag(data)
        });
        
        // Remove from pending requests when complete
        this.pendingRequests.delete(cacheKey);
      }),
      catchError((error: any) => {
        this.circuitBreaker.recordFailure();
        
        // Remove from pending requests on error
        this.pendingRequests.delete(cacheKey);
        
        // Try to serve stale cache on failure
        const cached = this.serveFromCache<T>(cacheKey);
        if (cached) {
          return cached;
        }
        
        return throwError(() => {
          const userMessage = this.getUserFriendlyErrorMessage(error);
          return new Error(userMessage);
        });
      }),
      // Share the request to prevent duplicates and replay last value
      shareReplay(1, this.CACHE_DURATION)
    );

    // Store the pending request
    this.pendingRequests.set(cacheKey, request$);
    
    return request$;
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
        return throwError(() => {
        const userMessage = this.getUserFriendlyErrorMessage(error);
        return new Error(userMessage);
      });
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
        return throwError(() => {
        const userMessage = this.getUserFriendlyErrorMessage(error);
        return new Error(userMessage);
      });
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
        return throwError(() => {
        const userMessage = this.getUserFriendlyErrorMessage(error);
        return new Error(userMessage);
      });
      })
    );
  }

  private getUserFriendlyErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'No internet connection. Please check your network connection and try again.';
    }
    
    if (error.status >= 500) {
      return 'Server is temporarily unavailable. Please try again in a few moments.';
    }
    
    if (error.status === 429) {
      return 'Too many requests. Please wait a moment before trying again.';
    }
    
    if (error.status === 404) {
      return 'The requested data was not found. Please refresh and try again.';
    }
    
    if (error.status >= 400 && error.status < 500) {
      return 'There was a problem with your request. Please check your input and try again.';
    }
    
    // Network related errors
    if (error.message?.includes('NetworkError') || error.message?.includes('ERR_NETWORK')) {
      return 'Network connection lost. Showing cached data. Please check your internet connection.';
    }
    
    // Timeout errors
    if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
      return 'Request timed out. The server is taking too long to respond. Please try again.';
    }
    
    // Default fallback
    return 'Something went wrong. Please try again or contact support if the problem persists.';
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

  getCircuitBreakerStats(): {
    failureCount: number;
    lastFailureTime: number;
    state: string;
    successCount: number;
  } {
    return {
      failureCount: this.circuitBreaker.getFailureCount(),
      lastFailureTime: this.circuitBreaker.getLastFailureTime(),
      state: this.circuitBreaker.getState(),
      successCount: this.circuitBreaker.getSuccessCount(),
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
