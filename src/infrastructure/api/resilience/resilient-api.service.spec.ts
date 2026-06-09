import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { ResilientApiService } from './resilient-api.service';
import { CircuitBreakerState } from './circuit-breaker.state';

describe('ResilientApiService', () => {
  let service: ResilientApiService;
  let httpMock: HttpTestingController;
  let circuitBreaker: CircuitBreakerState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ResilientApiService, CircuitBreakerState],
    });

    service = TestBed.inject(ResilientApiService);
    httpMock = TestBed.inject(HttpTestingController);
    circuitBreaker = TestBed.inject(CircuitBreakerState);
  });

  afterEach(() => {
    httpMock.verify();
  });

  async function failRequest(url: string): Promise<void> {
    const requestPromise = firstValueFrom(service.get(url));
    const request = httpMock.expectOne(url);
    request.flush('Bad request', { status: 400, statusText: 'Bad Request' });
    await expect(requestPromise).rejects.toThrow();
  }

  describe('circuit breaker', () => {
    it('should open circuit after 5 failures', async () => {
      for (let i = 0; i < 5; i++) {
        await failRequest('/test-endpoint');
      }

      expect(circuitBreaker.isOpen()).toBe(true);
    });

    it('should close circuit after recovery timeout', async () => {
      jest.useFakeTimers();

      for (let i = 0; i < 5; i++) {
        await failRequest('/test-endpoint');
      }

      expect(circuitBreaker.isOpen()).toBe(true);

      jest.advanceTimersByTime(30000);

      const resultPromise = firstValueFrom(service.get('/test-endpoint'));
      const successRequest = httpMock.expectOne('/test-endpoint');
      successRequest.flush({ data: 'success' });

      await expect(resultPromise).resolves.toEqual({ data: 'success' });
      jest.useRealTimers();
    });
  });

  describe('retry logic', () => {
    it('should retry on network errors', async () => {
      jest.useFakeTimers();

      const mockData = { data: 'success' };
      const resultPromise = firstValueFrom(service.get('/retry-endpoint'));

      const firstRequest = httpMock.expectOne('/retry-endpoint');
      firstRequest.error(new ErrorEvent('Network error'), { status: 0 });

      await jest.advanceTimersByTimeAsync(2000);

      const secondRequest = httpMock.expectOne('/retry-endpoint');
      secondRequest.flush(mockData);

      await expect(resultPromise).resolves.toEqual(mockData);
      jest.useRealTimers();
    });

    it('should not retry on 4xx errors', async () => {
      const resultPromise = firstValueFrom(service.get('/client-error'));

      const request = httpMock.expectOne('/client-error');
      request.flush('Bad request', { status: 400, statusText: 'Bad Request' });

      await expect(resultPromise).rejects.toThrow();
      httpMock.expectNone('/client-error');
    });
  });

  describe('caching', () => {
    it('should cache successful responses', async () => {
      const mockData = { data: 'cached' };

      const firstResultPromise = firstValueFrom(service.get('/cached-endpoint'));
      const firstRequest = httpMock.expectOne('/cached-endpoint');
      firstRequest.flush(mockData);

      await expect(firstResultPromise).resolves.toEqual(mockData);

      const secondResult = await firstValueFrom(service.get('/cached-endpoint'));
      expect(secondResult).toEqual(mockData);
      httpMock.expectNone('/cached-endpoint');
    });

    it('should serve stale cache on circuit open', async () => {
      const mockData = { data: 'stale' };

      const cacheResultPromise = firstValueFrom(service.get('/stale-endpoint'));
      const cacheRequest = httpMock.expectOne('/stale-endpoint');
      cacheRequest.flush(mockData);
      await cacheResultPromise;

      for (let i = 0; i < 5; i++) {
        await failRequest('/fail-endpoint');
      }

      const staleResult = await firstValueFrom(service.get('/stale-endpoint'));
      expect(staleResult).toEqual(mockData);
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      const mockData = { data: 'test' };

      const firstResultPromise = firstValueFrom(service.get('/clear-test'));
      const firstRequest = httpMock.expectOne('/clear-test');
      firstRequest.flush(mockData);
      await firstResultPromise;

      service.clearCache();

      const secondResultPromise = firstValueFrom(service.get('/clear-test'));
      const secondRequest = httpMock.expectOne('/clear-test');
      secondRequest.flush(mockData);
      await secondResultPromise;
    });

    it('should get cache size', () => {
      const initialSize = service.getCacheSize();
      expect(typeof initialSize).toBe('number');
      expect(initialSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe('circuit breaker stats', () => {
    it('should provide circuit breaker statistics', () => {
      const stats = service.getCircuitBreakerStats();

      expect(stats).toHaveProperty('state');
      expect(stats).toHaveProperty('failureCount');
      expect(stats).toHaveProperty('lastFailureTime');
      expect(stats).toHaveProperty('successCount');
    });
  });

  describe('error handling', () => {
    it('should handle timeout errors', async () => {
      jest.useFakeTimers();

      const resultPromise = firstValueFrom(service.get('/timeout-endpoint'));

      for (let attempt = 0; attempt < 4; attempt++) {
        const request = httpMock.expectOne('/timeout-endpoint');
        request.error(new ErrorEvent('Timeout'), { status: 0 });
        if (attempt < 3) {
          await jest.advanceTimersByTimeAsync(10000);
        }
      }

      await expect(resultPromise).rejects.toThrow();
      jest.useRealTimers();
    });

    it('should handle rate limiting', async () => {
      const resultPromise = firstValueFrom(service.get('/rate-limited'));

      const request = httpMock.expectOne('/rate-limited');
      request.flush('Too Many Requests', {
        status: 429,
        statusText: 'Too Many Requests',
        headers: { 'Retry-After': '60' },
      });

      await expect(resultPromise).rejects.toThrow();
    });
  });
});
