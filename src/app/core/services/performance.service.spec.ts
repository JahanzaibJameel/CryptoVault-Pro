import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerformanceService, WebVital, PerformanceMetrics, ResourceTiming } from './performance.service';
import { SentryService } from './sentry.service';

describe('PerformanceService', () => {
  let service: PerformanceService;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSentryService: jasmine.SpyObj<SentryService>;
  let mockPerformanceObserver: jasmine.SpyObj<PerformanceObserver>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['events']);
    const sentrySpy = jasmine.createSpyObj('SentryService', ['addBreadcrumb', 'captureMessage', 'trackPerformance']);
    
    TestBed.configureTestingModule({
      providers: [
        PerformanceService,
        { provide: Router, useValue: routerSpy },
        { provide: SentryService, useValue: sentrySpy }
      ]
    });

    service = TestBed.inject(PerformanceService);
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockSentryService = TestBed.inject(SentryService) as jasmine.SpyObj<SentryService>;

    // Mock PerformanceObserver
    mockPerformanceObserver = jasmine.createSpyObj('PerformanceObserver', ['observe', 'disconnect']);
    spyOn(window, 'PerformanceObserver').and.returnValue(mockPerformanceObserver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with default metrics', () => {
      const metrics = service.getMetrics();
      expect(metrics).toEqual({});
    });

    it('should not start tracking automatically in development', () => {
      spyOn(service as any, 'isPerformanceAPIAvailable').and.returnValue(true);
      spyOn(service as any, 'startTracking');
      service = TestBed.inject(PerformanceService);
      expect((service as any).startTracking).not.toHaveBeenCalled();
    });
  });

  describe('Performance API Availability', () => {
    it('should detect when Performance API is available', () => {
      spyOnProperty(window, 'PerformanceObserver').and.returnValue(jasmine.createSpyObj('PerformanceObserver', ['observe']));
      spyOnProperty(window, 'performance').and.returnValue({
        navigation: {}
      });
      
      const result = (service as any).isPerformanceAPIAvailable();
      expect(result).toBeTrue();
    });

    it('should detect when Performance API is not available', () => {
      delete (window as any).PerformanceObserver;
      const result = (service as any).isPerformanceAPIAvailable();
      expect(result).toBeFalse();
    });
  });

  describe('Tracking Control', () => {
    beforeEach(() => {
      spyOn(service as any, 'isPerformanceAPIAvailable').and.returnValue(true);
    });

    it('should start tracking when called', () => {
      service.startTracking();
      expect((service as any).isTracking()).toBeTrue();
      expect(mockPerformanceObserver.observe).toHaveBeenCalledTimes(3); // vitals, resources, navigation
    });

    it('should stop tracking when called', () => {
      service.startTracking();
      service.stopTracking();
      expect((service as any).isTracking()).toBeFalse();
      expect(mockPerformanceObserver.disconnect).toHaveBeenCalled();
    });

    it('should not start tracking if already tracking', () => {
      service.startTracking();
      spyOn(service as any, 'setupVitalsObserver');
      service.startTracking();
      expect((service as any).setupVitalsObserver).toHaveBeenCalledTimes(1);
    });
  });

  describe('Web Vitals Processing', () => {
    beforeEach(() => {
      service.startTracking();
    });

    it('should process LCP entries correctly', () => {
      const mockEntry = {
        entryType: 'largest-contentful-paint',
        startTime: 2500,
        renderTime: 2500
      };

      (service as any).processVitalEntry(mockEntry);
      const metrics = service.getMetrics();
      
      expect(metrics.LCP).toBeDefined();
      expect(metrics.LCP!.value).toBe(2500);
      expect(metrics.LCP!.name).toBe('LCP');
      expect(mockSentryService.trackPerformance).toHaveBeenCalledWith('LCP', 2500);
    });

    it('should process CLS entries correctly', () => {
      const mockEntry = {
        entryType: 'layout-shift',
        value: 0.1,
        hadRecentInput: false
      };

      (service as any).processVitalEntry(mockEntry);
      const metrics = service.getMetrics();
      
      expect(metrics.CLS).toBeDefined();
      expect(metrics.CLS!.value).toBe(0.1);
      expect(metrics.CLS!.delta).toBe(0.1);
    });

    it('should accumulate CLS values correctly', () => {
      const mockEntry1 = {
        entryType: 'layout-shift',
        value: 0.05,
        hadRecentInput: false
      };

      const mockEntry2 = {
        entryType: 'layout-shift',
        value: 0.03,
        hadRecentInput: false
      };

      (service as any).processVitalEntry(mockEntry1);
      (service as any).processVitalEntry(mockEntry2);
      const metrics = service.getMetrics();
      
      expect(metrics.CLS!.value).toBe(0.08);
    });

    it('should ignore CLS entries with recent input', () => {
      const mockEntry = {
        entryType: 'layout-shift',
        value: 0.1,
        hadRecentInput: true
      };

      (service as any).processVitalEntry(mockEntry);
      const metrics = service.getMetrics();
      
      expect(metrics.CLS).toBeUndefined();
    });

    it('should process INP entries correctly', () => {
      const mockEntry = {
        entryType: 'first-input',
        duration: 150,
        processingStart: 100,
        processingEnd: 250
      };

      (service as any).processVitalEntry(mockEntry);
      const metrics = service.getMetrics();
      
      expect(metrics.INP).toBeDefined();
      expect(metrics.INP!.value).toBe(150);
      expect(mockSentryService.trackPerformance).toHaveBeenCalledWith('INP', 150);
    });

    it('should process FCP entries correctly', () => {
      const mockEntry = {
        entryType: 'paint',
        name: 'first-contentful-paint',
        startTime: 1800
      };

      (service as any).processVitalEntry(mockEntry);
      const metrics = service.getMetrics();
      
      expect(metrics.FCP).toBeDefined();
      expect(metrics.FCP!.value).toBe(1800);
      expect(mockSentryService.trackPerformance).toHaveBeenCalledWith('FCP', 1800);
    });
  });

  describe('Resource Timing', () => {
    beforeEach(() => {
      service.startTracking();
    });

    it('should process resource entries correctly', () => {
      const mockEntry = {
        name: 'https://example.com/script.js',
        initiatorType: 'script',
        transferSize: 1024,
        decodedBodySize: 1024,
        requestStart: 100,
        responseEnd: 200
      };

      (service as any).processResourceEntry(mockEntry);
      const timings = service.getResourceTimings();
      
      expect(timings).toHaveLength(1);
      expect(timings[0].name).toBe('https://example.com/script.js');
      expect(timings[0].type).toBe('script');
      expect(timings[0].duration).toBe(100);
      expect(timings[0].size).toBe(1024);
      expect(timings[0].cached).toBeFalse();
    });

    it('should detect cached resources', () => {
      const mockEntry = {
        name: 'https://example.com/cached.js',
        initiatorType: 'script',
        transferSize: 0,
        decodedBodySize: 1024,
        requestStart: 100,
        responseEnd: 200
      };

      (service as any).processResourceEntry(mockEntry);
      const timings = service.getResourceTimings();
      
      expect(timings[0].cached).toBeTrue();
    });

    it('should limit resource timings to 100 entries', () => {
      spyOn(service as any, 'resourceTimings').and.returnValue({
        length: 100,
        slice: jasmine.createSpy('slice').and.returnValue([]),
        update: jasmine.createSpy('update')
      });

      const mockEntry = {
        name: 'https://example.com/script.js',
        initiatorType: 'script',
        transferSize: 1024,
        decodedBodySize: 1024,
        requestStart: 100,
        responseEnd: 200
      };

      (service as any).processResourceEntry(mockEntry);
      expect((service as any).resourceTimings().slice).toHaveBeenCalledWith(-100);
    });

    it('should report slow resources to Sentry', () => {
      const mockEntry = {
        name: 'https://example.com/slow.js',
        initiatorType: 'script',
        transferSize: 1024,
        decodedBodySize: 1024,
        requestStart: 100,
        responseEnd: 4000 // 3.9 seconds
      };

      (service as any).processResourceEntry(mockEntry);
      
      expect(mockSentryService.captureMessage).toHaveBeenCalledWith(
        'Slow resource: https://example.com/slow.js took 3900ms',
        'warning',
        jasmine.any(Object)
      );
    });
  });

  describe('Performance Score', () => {
    it('should calculate perfect score for good metrics', () => {
      const mockMetrics: PerformanceMetrics = {
        LCP: { name: 'LCP', value: 2000, rating: 'good', delta: 0, id: '1', navigationType: 'navigate' },
        CLS: { name: 'CLS', value: 0.05, rating: 'good', delta: 0, id: '2', navigationType: 'navigate' },
        INP: { name: 'INP', value: 150, rating: 'good', delta: 0, id: '3', navigationType: 'navigate' }
      };

      spyOn(service, 'getMetrics').and.returnValue(mockMetrics);
      const score = service.getPerformanceScore();
      expect(score).toBe(100);
    });

    it('should penalize needs-improvement metrics', () => {
      const mockMetrics: PerformanceMetrics = {
        LCP: { name: 'LCP', value: 3000, rating: 'needs-improvement', delta: 0, id: '1', navigationType: 'navigate' },
        CLS: { name: 'CLS', value: 0.05, rating: 'good', delta: 0, id: '2', navigationType: 'navigate' }
      };

      spyOn(service, 'getMetrics').and.returnValue(mockMetrics);
      const score = service.getPerformanceScore();
      expect(score).toBe(90); // 100 - 10 for one needs-improvement
    });

    it('should penalize poor metrics heavily', () => {
      const mockMetrics: PerformanceMetrics = {
        LCP: { name: 'LCP', value: 5000, rating: 'poor', delta: 0, id: '1', navigationType: 'navigate' },
        CLS: { name: 'CLS', value: 0.05, rating: 'good', delta: 0, id: '2', navigationType: 'navigate' }
      };

      spyOn(service, 'getMetrics').and.returnValue(mockMetrics);
      const score = service.getPerformanceScore();
      expect(score).toBe(75); // 100 - 25 for one poor
    });

    it('should return 100 when no metrics available', () => {
      spyOn(service, 'getMetrics').and.returnValue({});
      const score = service.getPerformanceScore();
      expect(score).toBe(100);
    });
  });

  describe('Utility Methods', () => {
    it('should get slow resources correctly', () => {
      const mockTimings: ResourceTiming[] = [
        { name: 'fast.js', type: 'script', duration: 1000, size: 1024, cached: false },
        { name: 'slow.js', type: 'script', duration: 4000, size: 1024, cached: false },
        { name: 'medium.js', type: 'script', duration: 2000, size: 1024, cached: false }
      ];

      spyOn(service, 'getResourceTimings').and.returnValue(mockTimings);
      const slowResources = service.getSlowResources(3000);
      
      expect(slowResources).toHaveLength(1);
      expect(slowResources[0].name).toBe('slow.js');
    });

    it('should get largest resources correctly', () => {
      const mockTimings: ResourceTiming[] = [
        { name: 'small.js', type: 'script', duration: 1000, size: 1024, cached: false },
        { name: 'large.js', type: 'script', duration: 2000, size: 5120, cached: false },
        { name: 'medium.js', type: 'script', duration: 1500, size: 2048, cached: false }
      ];

      spyOn(service, 'getResourceTimings').and.returnValue(mockTimings);
      const largestResources = service.getLargestResources(2);
      
      expect(largestResources).toHaveLength(2);
      expect(largestResources[0].name).toBe('large.js');
      expect(largestResources[1].name).toBe('medium.js');
    });
  });

  describe('Manual Timing Methods', () => {
    it('should create and end timer correctly', () => {
      spyOn(performance, 'now').and.returnValues(0, 100);
      const endTimer = service.startTimer('test-operation');
      
      expect(typeof endTimer).toBe('function');
      
      const duration = endTimer();
      expect(duration).toBe(100);
      expect(mockSentryService.addBreadcrumb).toHaveBeenCalledWith(
        'Timer: test-operation completed',
        'timer',
        'info',
        { name: 'test-operation', duration: 100 }
      );
    });

    it('should measure function execution time', () => {
      spyOn(performance, 'now').and.returnValues(0, 150);
      const testFunction = () => 'test-result';
      
      const result = service.measureFunction('test-function', testFunction);
      
      expect(result).toBe('test-result');
      expect(mockSentryService.addBreadcrumb).toHaveBeenCalledWith(
        'Timer: test-function completed',
        'timer',
        'info',
        { name: 'test-function', duration: 150 }
      );
    });

    it('should measure async function execution time', async () => {
      spyOn(performance, 'now').and.returnValues(0, 200);
      const testFunction = async () => 'async-result';
      
      const result = await service.measureAsyncFunction('async-function', testFunction);
      
      expect(result).toBe('async-result');
      expect(mockSentryService.addBreadcrumb).toHaveBeenCalledWith(
        'Timer: async-function completed',
        'timer',
        'info',
        { name: 'async-function', duration: 200 }
      );
    });

    it('should handle function errors and still record timing', () => {
      spyOn(performance, 'now').and.returnValues(0, 100);
      const testFunction = () => {
        throw new Error('Test error');
      };
      
      expect(() => service.measureFunction('error-function', testFunction)).toThrow('Test error');
      expect(mockSentryService.addBreadcrumb).toHaveBeenCalledWith(
        'Timer: error-function completed',
        'timer',
        'info',
        { name: 'error-function', duration: 100 }
      );
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when all checks pass', () => {
      service.startTracking();
      const health = service.checkHealth();
      
      expect(health.healthy).toBeTrue();
      expect(health.checks.tracking_enabled).toBeTrue();
      expect(health.checks.vitals_observer).toBeTrue();
      expect(health.checks.resource_observer).toBeTrue();
      expect(health.checks.performance_api_available).toBeTrue();
    });

    it('should return unhealthy status when tracking is disabled', () => {
      const health = service.checkHealth();
      
      expect(health.healthy).toBeFalse();
      expect(health.checks.tracking_enabled).toBeFalse();
    });
  });

  describe('Metrics Export', () => {
    it('should export metrics as JSON string', () => {
      const mockMetrics: PerformanceMetrics = {
        LCP: { name: 'LCP', value: 2000, rating: 'good', delta: 0, id: '1', navigationType: 'navigate' }
      };

      spyOn(service, 'getMetrics').and.returnValue(mockMetrics);
      spyOn(service, 'getResourceTimings').and.returnValue([]);
      spyOn(service, 'getPerformanceScore').and.returnValue(95);
      spyOn(Date, 'now').and.returnValue(1234567890);

      const exported = service.exportMetrics();
      const parsed = JSON.parse(exported);

      expect(parsed.metrics).toEqual(mockMetrics);
      expect(parsed.resourceTimings).toEqual([]);
      expect(parsed.score).toBe(95);
      expect(parsed.timestamp).toBe(1234567890);
    });
  });

  describe('Metrics Clear', () => {
    it('should clear all metrics', () => {
      service.startTracking();
      service.clearMetrics();
      
      const metrics = service.getMetrics();
      const timings = service.getResourceTimings();
      
      expect(metrics).toEqual({});
      expect(timings).toEqual([]);
      expect(mockSentryService.addBreadcrumb).toHaveBeenCalledWith(
        'Performance metrics cleared',
        'performance',
        'info'
      );
    });
  });

  describe('Rating System', () => {
    it('should rate LCP correctly', () => {
      expect((service as any).getRating('LCP', 2000)).toBe('good');
      expect((service as any).getRating('LCP', 3000)).toBe('needs-improvement');
      expect((service as any).getRating('LCP', 5000)).toBe('poor');
    });

    it('should rate CLS correctly', () => {
      expect((service as any).getRating('CLS', 0.05)).toBe('good');
      expect((service as any).getRating('CLS', 0.15)).toBe('needs-improvement');
      expect((service as any).getRating('CLS', 0.3)).toBe('poor');
    });

    it('should rate INP correctly', () => {
      expect((service as any).getRating('INP', 150)).toBe('good');
      expect((service as any).getRating('INP', 300)).toBe('needs-improvement');
      expect((service as any).getRating('INP', 600)).toBe('poor');
    });
  });
});
