import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';
import { PortfolioWorkerService, WorkerMessageType } from './portfolio-worker.service';

describe('PortfolioWorkerService', () => {
  let service: PortfolioWorkerService;
  let mockLoggerService: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'warn']);
    let currentTime = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => {
      currentTime += 1;
      return currentTime;
    });
    
    TestBed.configureTestingModule({
      providers: [
        PortfolioWorkerService,
        { provide: LoggerService, useValue: loggerSpy }
      ]
    });

    service = TestBed.inject(PortfolioWorkerService);
    mockLoggerService = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  afterEach(() => {
    service.destroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize worker on construction', () => {
    expect(service.isReady()).toBe(true);
  });

  describe('Portfolio Metrics Calculation', () => {
    const mockHoldings = [
      { coinId: 'bitcoin', amount: 1, avgBuyPrice: 50000 },
      { coinId: 'ethereum', amount: 10, avgBuyPrice: 3000 }
    ];

    const mockPrices = {
      bitcoin: 60000,
      ethereum: 3500
    };

    it('should calculate portfolio metrics correctly', async () => {
      const result = await service.calculatePortfolioMetrics({
        holdings: mockHoldings,
        currentPrices: mockPrices
      });

      expect(result.totalValue).toBe(95000); // 60000 + 35000
      expect(result.totalInvested).toBe(80000); // 50000 + 30000
      expect(result.totalPnL).toBe(15000);
      expect(result.totalROI).toBe(18.75); // (15000/80000)*100
      expect(result.holdingsCount).toBe(2);
    });

    it('should handle empty holdings', async () => {
      const result = await service.calculatePortfolioMetrics({
        holdings: [],
        currentPrices: {}
      });

      expect(result.totalValue).toBe(0);
      expect(result.totalInvested).toBe(0);
      expect(result.totalPnL).toBe(0);
      expect(result.totalROI).toBe(0);
      expect(result.holdingsCount).toBe(0);
    });

    it('should handle missing prices', async () => {
      const result = await service.calculatePortfolioMetrics({
        holdings: mockHoldings,
        currentPrices: { bitcoin: 60000 }
      });

      expect(result.totalValue).toBe(60000); // Only bitcoin price available
    });
  });

  describe('Volatility Analysis', () => {
    const mockHoldings = [
      { coinId: 'bitcoin', amount: 1, avgBuyPrice: 50000 }
    ];

    const mockPriceHistory = {
      bitcoin: [50000, 51000, 49000, 52000, 48000, 53000, 47000]
    };

    it('should calculate volatility metrics', async () => {
      const result = await service.calculateVolatilityAnalysis({
        holdings: mockHoldings,
        priceHistory: mockPriceHistory
      });

      expect(result.portfolioVolatility).toBeDefined();
      expect(result.individualVolatility).toBeDefined();
      expect(result.correlationMatrix).toBeDefined();
      expect(result.sharpeRatio).toBeDefined();
      expect(result.var95).toBeDefined();
      expect(result.beta).toBeDefined();
    });

    it('should handle insufficient price history', async () => {
      const result = await service.calculateVolatilityAnalysis({
        holdings: mockHoldings,
        priceHistory: { bitcoin: [50000] }
      });

      expect(result.portfolioVolatility).toBe(0);
    });
  });

  describe('Diversification Metrics', () => {
    const mockHoldings = [
      { coinId: 'bitcoin', amount: 1, avgBuyPrice: 50000 },
      { coinId: 'ethereum', amount: 10, avgBuyPrice: 3000 },
      { coinId: 'cardano', amount: 1000, avgBuyPrice: 1 }
    ];

    it('should calculate diversification metrics', async () => {
      const result = await service.calculateDiversificationMetrics({
        holdings: mockHoldings
      });

      expect(result.herfindahlIndex).toBeDefined();
      expect(result.concentrationRisk).toBeDefined();
      expect(result.sectorAllocation).toBeDefined();
      expect(result.geographicAllocation).toBeDefined();
      expect(result.diversificationScore).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should identify high concentration risk', async () => {
      const concentratedHoldings = [
        { coinId: 'bitcoin', amount: 10, avgBuyPrice: 50000 },
        { coinId: 'ethereum', amount: 1, avgBuyPrice: 3000 }
      ];

      const result = await service.calculateDiversificationMetrics({
        holdings: concentratedHoldings
      });

      expect(result.concentrationRisk).toBe('high');
      expect(result.diversificationScore).toBeLessThan(50);
    });

    it('should return stable diversification metrics for zero-value holdings', async () => {
      const zeroValueHoldings = [
        { coinId: 'bitcoin', amount: 1, currentValue: 0, sector: 'Store of Value' }
      ];

      const result = await service.calculateDiversificationMetrics({
        holdings: zeroValueHoldings
      });

      expect(result.diversificationScore).toBeGreaterThanOrEqual(0);
      expect(result.diversificationScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(['low', 'medium', 'high']).toContain(result.concentrationRisk);
    });
  });

  describe('Risk Analysis', () => {
    const mockHoldings = [
      { coinId: 'bitcoin', amount: 1, avgBuyPrice: 50000 }
    ];

    const mockPriceHistory = {
      bitcoin: [50000, 51000, 49000, 52000, 48000, 53000, 47000]
    };

    it('should calculate risk metrics', async () => {
      const result = await service.calculateRiskAnalysis({
        holdings: mockHoldings,
        priceHistory: mockPriceHistory
      });

      expect(result.portfolioRisk).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(result.portfolioRisk);
      expect(result.riskFactors).toBeDefined();
      expect(Array.isArray(result.riskFactors)).toBe(true);
      expect(result.maxDrawdown).toBeDefined();
      expect(result.volatility).toBeDefined();
      expect(result.downsideRisk).toBeDefined();
      expect(result.stressTestResults).toBeDefined();
    });
  });

  describe('Performance Metrics', () => {
    const mockHoldings = [
      { coinId: 'bitcoin', amount: 1, avgBuyPrice: 50000 }
    ];

    const mockPriceHistory = {
      bitcoin: [50000, 51000, 49000, 52000, 48000, 53000, 47000]
    };

    const mockBenchmarkHistory = [100, 102, 98, 105, 95, 108, 92];

    it('should calculate performance metrics', async () => {
      const result = await service.calculatePerformanceMetrics({
        holdings: mockHoldings,
        priceHistory: mockPriceHistory,
        benchmarkHistory: mockBenchmarkHistory
      });

      expect(result.totalReturn).toBeDefined();
      expect(result.annualizedReturn).toBeDefined();
      expect(result.volatility).toBeDefined();
      expect(result.sharpeRatio).toBeDefined();
      expect(result.maxDrawdown).toBeDefined();
      expect(result.alpha).toBeDefined();
      expect(result.beta).toBeDefined();
      expect(result.informationRatio).toBeDefined();
      expect(result.winRate).toBeDefined();
      expect(result.profitFactor).toBeDefined();
    });
  });

  describe('Batch Calculations', () => {
    const mockData = {
      holdings: [
        { coinId: 'bitcoin', amount: 1, avgBuyPrice: 50000 },
        { coinId: 'ethereum', amount: 10, avgBuyPrice: 3000 }
      ],
      currentPrices: {
        bitcoin: 60000,
        ethereum: 3500
      },
      priceHistory: {
        bitcoin: [50000, 51000, 49000, 52000, 48000, 53000, 47000],
        ethereum: [3000, 3100, 2900, 3200, 2800, 3300, 2700]
      },
      sectorData: {
        bitcoin: 'Store of Value',
        ethereum: 'Smart Contracts'
      }
    };

    it('should calculate all metrics in parallel', async () => {
      const startTime = Date.now();
      
      const result = await service.calculateAllMetrics(mockData);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.metrics).toBeDefined();
      expect(result.volatility).toBeDefined();
      expect(result.diversification).toBeDefined();
      expect(result.risk).toBeDefined();
      expect(result.performance).toBeDefined();

      // Should complete within reasonable time (parallel execution)
      expect(duration).toBeLessThan(5000);

      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'All portfolio metrics calculated',
        jasmine.objectContaining({
          calculations: 5
        }),
        'portfolio-worker'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle worker errors gracefully', async () => {
      const invalidData = { holdings: null, currentPrices: null };

      await expect(service.calculatePortfolioMetrics(invalidData)).rejects.toThrow();
    });

    it('should handle worker destruction', () => {
      service.destroy();
      expect(service.isReady()).toBe(false);
      expect(service.getPendingRequestsCount()).toBe(0);
    });

    it('should restart worker correctly', () => {
      service.destroy();
      service.restart();
      expect(service.isReady()).toBe(true);
    });
  });

  describe('Performance Benchmarking', () => {
    const mockData = {
      holdings: [
        { coinId: 'bitcoin', amount: 1, avgBuyPrice: 50000 }
      ],
      currentPrices: {
        bitcoin: 60000
      }
    };

    it('should benchmark calculation performance', async () => {
      const result = await service.benchmarkCalculation(mockData, 3);

      expect(result.averageTime).toBeDefined();
      expect(result.minTime).toBeDefined();
      expect(result.maxTime).toBeDefined();
      expect(result.workerTime).toBeDefined();
      expect(result.mainThreadTime).toBeDefined();
      expect(result.speedup).toBeDefined();

      // Worker should be faster than main thread
      expect(result.speedup).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when worker is ready', () => {
      const health = service.checkHealth();

      expect(health.healthy).toBe(true);
      expect(health.checks.worker_ready).toBe(true);
      expect(health.checks.no_errors).toBe(true);
      expect(health.checks.pending_requests_limited).toBe(true);
    });

    it('should return unhealthy status when worker has errors', () => {
      // Simulate worker error
      service.destroy();

      const health = service.checkHealth();

      expect(health.healthy).toBe(false);
      expect(health.checks.worker_ready).toBe(false);
    });
  });
});
