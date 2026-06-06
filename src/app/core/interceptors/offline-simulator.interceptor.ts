import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, materialize, dematerialize, delay } from 'rxjs/operators';

// Global state for the simulator
let offline = false;
let latency = 0;
let failureRate = 0;
const offlineUrls: Set<string> = new Set();

export const offlineSimulatorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  // Check if this URL should be forced offline
  if (offlineUrls.has(req.url)) {
    return createOfflineResponse(req);
  }

  // If offline mode is enabled, simulate offline for all requests
  if (offline) {
    return createOfflineResponse(req);
  }

  // Simulate latency if configured
  if (latency > 0) {
    return timer(latency).pipe(mergeMap(() => handleRequestWithFailureRate(req, next)));
  }

  // Handle with failure rate simulation
  return handleRequestWithFailureRate(req, next);
};

function handleRequestWithFailureRate(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  // Simulate random failures based on failure rate
  if (failureRate > 0 && Math.random() < failureRate) {
    return createFailureResponse(req);
  }

  return next(req);
}

function createOfflineResponse(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
  return throwError(
    () =>
      new HttpErrorResponse({
        status: 0,
        statusText: 'Offline',
        url: req.url,
        error: {
          message: 'Simulated offline mode',
          simulated: true,
          type: 'offline',
        },
      }),
  ).pipe(
    materialize(),
    delay(100), // Small delay to simulate network latency
    dematerialize(),
  );
}

function createFailureResponse(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
  const errors = [
    { status: 500, statusText: 'Internal Server Error', message: 'Simulated server error' },
    { status: 503, statusText: 'Service Unavailable', message: 'Simulated service unavailable' },
    { status: 504, statusText: 'Gateway Timeout', message: 'Simulated gateway timeout' },
    { status: 429, statusText: 'Too Many Requests', message: 'Simulated rate limit exceeded' },
  ];

  const randomError = errors[Math.floor(Math.random() * errors.length)];

  return throwError(
    () =>
      new HttpErrorResponse({
        status: randomError.status,
        statusText: randomError.statusText,
        url: req.url,
        error: {
          message: randomError.message,
          simulated: true,
          type: 'failure',
        },
      }),
  );
}

// Public API for controlling the simulator
export const OfflineSimulatorControls = {
  setOffline(offlineState: boolean): void {
    offline = offlineState;
  },

  setLatency(latencyMs: number): void {
    latency = Math.max(0, latencyMs);
  },

  setFailureRate(rate: number): void {
    failureRate = Math.max(0, Math.min(1, rate));
  },

  addOfflineUrl(url: string): void {
    offlineUrls.add(url);
  },

  removeOfflineUrl(url: string): void {
    offlineUrls.delete(url);
  },

  clearOfflineUrls(): void {
    offlineUrls.clear();
  },

  // Get current simulator state
  getState(): {
    offline: boolean;
    latency: number;
    failureRate: number;
    offlineUrls: string[];
  } {
    return {
      offline,
      latency,
      failureRate,
      offlineUrls: Array.from(offlineUrls),
    };
  },

  // Reset all simulator settings
  reset(): void {
    offline = false;
    latency = 0;
    failureRate = 0;
    offlineUrls.clear();
  },

  // Preset configurations
  enableSlowConnection(): void {
    this.setLatency(2000); // 2 second delay
    this.setFailureRate(0.1); // 10% failure rate
  },

  enableUnreliableConnection(): void {
    this.setLatency(500); // 500ms delay
    this.setFailureRate(0.3); // 30% failure rate
  },

  enableTerribleConnection(): void {
    this.setLatency(5000); // 5 second delay
    this.setFailureRate(0.5); // 50% failure rate
  },

  disable(): void {
    this.reset();
  },
};
