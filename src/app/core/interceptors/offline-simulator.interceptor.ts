import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer, of } from 'rxjs';
import { mergeMap, materialize, dematerialize } from 'rxjs/operators';

@Injectable()
export class OfflineSimulatorInterceptor implements HttpInterceptor {
  private offline = false;
  private latency = 0;
  private failureRate = 0;
  private offlineUrls: Set<string> = new Set();

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Check if this URL should be forced offline
    if (this.offlineUrls.has(req.url)) {
      return this.createOfflineResponse(req);
    }

    // If offline mode is enabled, simulate offline for all requests
    if (this.offline) {
      return this.createOfflineResponse(req);
    }

    // Simulate latency if configured
    if (this.latency > 0) {
      return timer(this.latency).pipe(
        mergeMap(() => this.handleRequestWithFailureRate(req, next))
      );
    }

    // Handle with failure rate simulation
    return this.handleRequestWithFailureRate(req, next);
  }

  private handleRequestWithFailureRate(
    req: HttpRequest<any>, 
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Simulate random failures based on failure rate
    if (this.failureRate > 0 && Math.random() < this.failureRate) {
      return this.createFailureResponse(req);
    }

    return next.handle(req);
  }

  private createOfflineResponse(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    return of(new HttpErrorResponse({
      status: 0,
      statusText: 'Offline',
      url: req.url,
      error: {
        message: 'Simulated offline mode',
        simulated: true,
        type: 'offline'
      }
    })).pipe(
      materialize(),
      delay(100), // Small delay to simulate network latency
      dematerialize()
    );
  }

  private createFailureResponse(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    const errors = [
      { status: 500, statusText: 'Internal Server Error', message: 'Simulated server error' },
      { status: 503, statusText: 'Service Unavailable', message: 'Simulated service unavailable' },
      { status: 504, statusText: 'Gateway Timeout', message: 'Simulated gateway timeout' },
      { status: 429, statusText: 'Too Many Requests', message: 'Simulated rate limit exceeded' }
    ];

    const randomError = errors[Math.floor(Math.random() * errors.length)];

    return of(new HttpErrorResponse({
      status: randomError.status,
      statusText: randomError.statusText,
      url: req.url,
      error: {
        message: randomError.message,
        simulated: true,
        type: 'failure'
      }
    }));
  }

  // Public API for controlling the simulator
  setOffline(offline: boolean): void {
    this.offline = offline;
    console.log(`Offline simulator: ${offline ? 'ENABLED' : 'DISABLED'}`);
  }

  setLatency(latencyMs: number): void {
    this.latency = Math.max(0, latencyMs);
    console.log(`Latency simulator: ${this.latency}ms`);
  }

  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate));
    console.log(`Failure rate simulator: ${(this.failureRate * 100).toFixed(1)}%`);
  }

  addOfflineUrl(url: string): void {
    this.offlineUrls.add(url);
    console.log(`Added URL to offline list: ${url}`);
  }

  removeOfflineUrl(url: string): void {
    this.offlineUrls.delete(url);
    console.log(`Removed URL from offline list: ${url}`);
  }

  clearOfflineUrls(): void {
    this.offlineUrls.clear();
    console.log('Cleared offline URL list');
  }

  // Get current simulator state
  getState(): {
    offline: boolean;
    latency: number;
    failureRate: number;
    offlineUrls: string[];
  } {
    return {
      offline: this.offline,
      latency: this.latency,
      failureRate: this.failureRate,
      offlineUrls: Array.from(this.offlineUrls)
    };
  }

  // Reset all simulator settings
  reset(): void {
    this.offline = false;
    this.latency = 0;
    this.failureRate = 0;
    this.offlineUrls.clear();
    console.log('Offline simulator reset to defaults');
  }

  // Preset configurations
  enableSlowConnection(): void {
    this.setLatency(2000); // 2 second delay
    this.setFailureRate(0.1); // 10% failure rate
    console.log('Enabled slow connection preset');
  }

  enableUnreliableConnection(): void {
    this.setLatency(500); // 500ms delay
    this.setFailureRate(0.3); // 30% failure rate
    console.log('Enabled unreliable connection preset');
  }

  enableTerribleConnection(): void {
    this.setLatency(5000); // 5 second delay
    this.setFailureRate(0.5); // 50% failure rate
    console.log('Enabled terrible connection preset');
  }

  disable(): void {
    this.reset();
    console.log('Disabled all connection simulations');
  }
}

// Helper function for delay
function delay<T>(delayMs: number): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) => 
    new Observable(observer => {
      const timer = setTimeout(() => {
        source.subscribe(observer);
      }, delayMs);
      
      return () => clearTimeout(timer);
    });
}
