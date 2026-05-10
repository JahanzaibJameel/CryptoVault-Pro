import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ResilientApiService } from './resilient-api.service';
import { CircuitBreakerState } from './circuit-breaker.state';

describe('ResilientApiService', () => {
  let service: ResilientApiService;
  let httpMock: HttpTestingController;
  let circuitBreaker: CircuitBreakerState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ResilientApiService, CircuitBreakerState]
    });
    
    service = TestBed.inject(ResilientApiService);
    httpMock = TestBed.inject(HttpTestingController);
    circuitBreaker = TestBed.inject(CircuitBreakerState);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('circuit breaker', () => {
    it('should open circuit after 5 failures', async () => {
      // Simulate 5 consecutive failures
      for (let i = 0; i < 5; i++) {
        try {
          await service.get('/test-endpoint');
        } catch (error) {
          // Expected to fail
        }
      }

        const req = httpMock.expectOne('/test-endpoint');
        req.error(new ErrorEvent('Network error'));
      }

      expect(circuitBreaker.isOpen()).toBe(true);
    });

    it('should close circuit after recovery timeout', async () => {
      // Open circuit first
      for (let i = 0; i < 5; i++) {
        try {
          await service.get('/test-endpoint');
        } catch (error) {
          // Expected to fail
        }
        const req = httpMock.expectOne('/test-endpoint');
        req.error(new ErrorEvent('Network error'));
      }

      expect(circuitBreaker.isOpen()).toBe(true);

      // Wait for recovery timeout (mocked)
      jest.advanceTimersByTime(30000);

      // Next request should work
      const successReq = httpMock.expectOne('/test-endpoint');
      successReq.flush({ data: 'success' });

      const result = await service.get('/test-endpoint');
      expect(result).toEqual({ data: 'success' });
    });
  });

  describe('retry logic', () => {
    it('should retry on network errors', async () => {
      const mockData = { data: 'success' };

      service.get('/retry-endpoint').subscribe({
        next: (data) => expect(data).toEqual(mockData),
        error: () => fail('Should not error after retries')
      });

      // First request fails
      const req1 = httpMock.expectOne('/retry-endpoint');
      req1.error(new ErrorEvent('Network error'));

      // Second request succeeds
      const req2 = httpMock.expectOne('/retry-endpoint');
      req2.flush(mockData);
    });

    it('should not retry on 4xx errors', async () => {
      service.get('/client-error').subscribe({
        next: () => fail('Should not succeed'),
        error: (error) => expect(error.status).toBe(400)
      });

      const req = httpMock.expectOne('/client-error');
      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });

      // Should only make one request (no retry)
      httpMock.expectNone('/client-error');
    });
  });

  describe('caching', () => {
    it('should cache successful responses', async () => {
      const mockData = { data: 'cached' };

      // First request
      const req1 = httpMock.expectOne('/cached-endpoint');
      req1.flush(mockData);

      const result1 = await service.get('/cached-endpoint');
      expect(result1).toEqual(mockData);

      // Second request should use cache
      const result2 = await service.get('/cached-endpoint');
      expect(result2).toEqual(mockData);

      // Should only make one HTTP request
      httpMock.expectNone('/cached-endpoint');
    });

    it('should serve stale cache on circuit open', async () => {
      const mockData = { data: 'stale' };

      // First request to populate cache
      const req1 = httpMock.expectOne('/stale-endpoint');
      req1.flush(mockData);

      await service.get('/stale-endpoint');

      // Open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await service.get('/fail-endpoint');
        } catch (error) {
          // Expected to fail
        }
        const req = httpMock.expectOne('/fail-endpoint');
        req.error(new ErrorEvent('Network error'));
      }

      // Should serve stale data
      const result = await service.get('/stale-endpoint');
      expect(result).toEqual(mockData);
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      const mockData = { data: 'test' };

      // Populate cache
      const req1 = httpMock.expectOne('/clear-test');
      req1.flush(mockData);

      await service.get('/clear-test');

      // Clear cache
      service.clearCache();

      // Next request should make HTTP call
      const req2 = httpMock.expectOne('/clear-test');
      req2.flush(mockData);

      await service.get('/clear-test');
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
      service.get('/timeout-endpoint').subscribe({
        next: () => fail('Should not succeed'),
        error: (error) => {
          expect(error).toBeDefined();
          expect(error.timeout).toBe(true);
        }
      });

      const req = httpMock.expectOne('/timeout-endpoint');
      req.error(new ErrorEvent('Timeout'));
    });

    it('should handle rate limiting', async () => {
      service.get('/rate-limited').subscribe({
        next: () => fail('Should not succeed'),
        error: (error) => {
          expect(error.status).toBe(429);
          expect(error.rateLimited).toBe(true);
        }
      });

      const req = httpMock.expectOne('/rate-limited');
      req.flush('Too Many Requests', { 
        status: 429, 
        statusText: 'Too Many Requests',
        headers: { 'Retry-After': '60' }
      });
    });
  });
});
