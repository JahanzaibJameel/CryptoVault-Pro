import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

interface CacheEntry {
  response: HttpResponse<unknown>;
  timestamp: number;
  etag?: string;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHEABLE_METHODS = ['GET', 'HEAD'];
const CACHEABLE_STATUS_CODES = [200, 203, 300, 301, 302, 304, 307];

function getCacheKey(req: HttpRequest<unknown>): string {
  return `${req.method}:${req.url}`;
}

function isCacheable(req: HttpRequest<unknown>): boolean {
  if (req.headers.get('Cache-Control') === 'no-cache') return false;
  if (req.url.includes('cache_bust') || req.url.includes('_t=')) return false;
  return CACHEABLE_METHODS.includes(req.method);
}

function isCacheableResponse(response: HttpResponse<unknown>): boolean {
  return CACHEABLE_STATUS_CODES.includes(response.status);
}

function getCacheTTL(req: HttpRequest<unknown>): number {
  const cacheControl = req.headers.get('Cache-Control');
  if (cacheControl) {
    const match = cacheControl.match(/max-age=(\d+)/);
    if (match) return parseInt(match[1], 10) * 1000;
  }

  if (req.url.includes('/api/v3/coins/markets')) return 30 * 1000;
  if (req.url.includes('/api/v3/simple/price')) return 10 * 1000;

  return DEFAULT_CACHE_TTL;
}

function getFromCache(req: HttpRequest<unknown>): HttpResponse<unknown> | null {
  const key = getCacheKey(req);
  const cached = cache.get(key);
  if (!cached) return null;

  const ttl = getCacheTTL(req);
  if (Date.now() - cached.timestamp < ttl) {
    return cached.response.clone({
      headers: cached.response.headers.set('X-Cache', 'HIT'),
    });
  }

  return null;
}

function getStaleFromCache(req: HttpRequest<unknown>): HttpResponse<unknown> | null {
  const key = getCacheKey(req);
  const cached = cache.get(key);
  if (!cached) return null;

  return cached.response.clone({
    headers: cached.response.headers
      .set('X-Cache', 'STALE')
      .set('X-Cache-Age', `${Date.now() - cached.timestamp}`),
  });
}

function putInCache(req: HttpRequest<unknown>, response: HttpResponse<unknown>): void {
  if (response.headers.get('Cache-Control')?.includes('no-store')) return;

  const key = getCacheKey(req);
  cache.set(key, {
    response: response.clone({
      headers: response.headers.set('X-Cache', 'MISS'),
    }),
    timestamp: Date.now(),
    etag: response.headers.get('ETag') || undefined,
  });

  cleanupCache();
}

function cleanupCache(): void {
  const now = Date.now();
  for (const [key, cached] of cache.entries()) {
    if (now - cached.timestamp > DEFAULT_CACHE_TTL * 2) {
      cache.delete(key);
    }
  }
}

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isCacheable(req)) {
    return next(req);
  }

  const cachedResponse = getFromCache(req);
  if (cachedResponse) {
    return of(cachedResponse);
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && isCacheableResponse(event)) {
        putInCache(req, event);
      }
    }),
    catchError((error) => {
      const staleResponse = getStaleFromCache(req);
      if (staleResponse) {
        console.warn(`Serving stale cache for ${req.url} due to network error`);
        return of(staleResponse);
      }
      return throwError(() => error);
    })
  );
};
