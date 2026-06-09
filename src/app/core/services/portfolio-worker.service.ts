import { Injectable, signal, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { createPortfolioWorker } from './portfolio-worker.factory';

export type WorkerMessageType = 'metrics' | 'volatility' | 'diversification' | 'risk-analysis' | 'performance';

export interface WorkerMessage {
  type: WorkerMessageType;
  data: any;
  id: string;
}

export interface WorkerResponse {
  type: string;
  result: any;
  calculationTime: number;
  timestamp: number;
  id: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioWorkerService {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    startTime: number;
  }>();
  
  private isWorkerReady = signal(false);
  private workerError = signal<string | null>(null);
  private loggerService = inject(LoggerService);

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker(): void {
    try {
      this.worker = createPortfolioWorker();

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (error) => {
        this.loggerService.error('Portfolio worker error', error, 'portfolio-worker');
        this.workerError.set(error.message);
        
        // Reject all pending requests
        this.pendingRequests.forEach(({ reject }) => {
          reject(new Error('Worker error: ' + error.message));
        });
        this.pendingRequests.clear();
      };

      this.worker.onmessageerror = (error) => {
        this.loggerService.error('Portfolio worker message error', error, 'portfolio-worker');
        this.workerError.set('Message handling error');
      };

      this.isWorkerReady.set(true);
      this.loggerService.info('Portfolio worker initialized', {}, 'portfolio-worker');

    } catch (error) {
      this.loggerService.error('Failed to initialize portfolio worker', error, 'portfolio-worker');
      this.workerError.set('Failed to initialize worker');
    }
  }

  private handleWorkerMessage(response: WorkerResponse): void {
    const request = this.pendingRequests.get(response.id);
    
    if (!request) {
      this.loggerService.warn('Received response for unknown request', { id: response.id }, 'portfolio-worker');
      return;
    }

    const calculationTime = response.calculationTime || 0;
    const totalTime = performance.now() - request.startTime;

    this.loggerService.info('Worker calculation completed', {
      type: response.type,
      calculationTime,
      totalTime,
      id: response.id
    }, 'portfolio-worker');

    if (response.error) {
      request.reject(new Error(response.error));
    } else {
      request.resolve(response.result);
    }

    this.pendingRequests.delete(response.id);
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendRequest<T>(type: WorkerMessageType, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker || !this.isWorkerReady()) {
        reject(new Error('Worker not available'));
        return;
      }

      const id = this.generateRequestId();
      const startTime = performance.now();

      // Store the request resolver
      this.pendingRequests.set(id, { resolve, reject, startTime });

      // Send the message to worker
      const message: WorkerMessage = {
        type,
        data,
        id
      };

      this.worker.postMessage(message);

      // Set a timeout for the request (30 seconds)
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Worker request timeout'));
        }
      }, 30000);
    });
  }

  // Public API methods
  async calculatePortfolioMetrics(data: { holdings: any[]; currentPrices: Record<string, number> }): Promise<any> {
    return this.sendRequest('metrics', data);
  }

  async calculateVolatilityAnalysis(data: { holdings: any[]; priceHistory: Record<string, number[]> }): Promise<any> {
    return this.sendRequest('volatility', data);
  }

  async calculateDiversificationMetrics(data: { holdings: any[]; sectorData?: Record<string, string> }): Promise<any> {
    return this.sendRequest('diversification', data);
  }

  async calculateRiskAnalysis(data: { holdings: any[]; priceHistory: Record<string, number[]> }): Promise<any> {
    return this.sendRequest('risk-analysis', data);
  }

  async calculatePerformanceMetrics(data: { 
    holdings: any[]; 
    priceHistory: Record<string, number[]>; 
    benchmarkHistory?: number[] 
  }): Promise<any> {
    return this.sendRequest('performance', data);
  }

  // Batch calculations
  async calculateAllMetrics(data: {
    holdings: any[];
    currentPrices: Record<string, number>;
    priceHistory: Record<string, number[]>;
    sectorData?: Record<string, string>;
    benchmarkHistory?: number[];
  }): Promise<{
    metrics: any;
    volatility: any;
    diversification: any;
    risk: any;
    performance: any;
  }> {
    const startTime = performance.now();

    try {
      // Run all calculations in parallel
      const [
        metrics,
        volatility,
        diversification,
        risk,
        performanceMetrics
      ] = await Promise.all([
        this.calculatePortfolioMetrics({
          holdings: data.holdings,
          currentPrices: data.currentPrices
        }),
        this.calculateVolatilityAnalysis({
          holdings: data.holdings,
          priceHistory: data.priceHistory
        }),
        this.calculateDiversificationMetrics({
          holdings: data.holdings,
          sectorData: data.sectorData
        }),
        this.calculateRiskAnalysis({
          holdings: data.holdings,
          priceHistory: data.priceHistory
        }),
        this.calculatePerformanceMetrics({
          holdings: data.holdings,
          priceHistory: data.priceHistory,
          benchmarkHistory: data.benchmarkHistory
        })
      ]);

      const totalTime = performance.now() - startTime;
      
      this.loggerService.info('All portfolio metrics calculated', {
        totalTime,
        calculations: 5
      }, 'portfolio-worker');

      return {
        metrics,
        volatility,
        diversification,
        risk,
        performance: performanceMetrics,
      };

    } catch (error) {
      this.loggerService.error('Failed to calculate portfolio metrics', error, 'portfolio-worker');
      throw error;
    }
  }

  // Worker status and health
  isReady(): boolean {
    return this.isWorkerReady();
  }

  hasError(): boolean {
    return this.workerError() !== null;
  }

  getError(): string | null {
    return this.workerError();
  }

  getPendingRequestsCount(): number {
    return this.pendingRequests.size;
  }

  // Performance monitoring
  async benchmarkCalculation(data: any, iterations = 10): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    workerTime: number;
    mainThreadTime: number;
    speedup: number;
  }> {
    const workerTimes: number[] = [];
    const mainThreadTimes: number[] = [];

    // Benchmark worker
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await this.calculatePortfolioMetrics(data);
      workerTimes.push(performance.now() - start);
    }

    // Benchmark main thread (simplified calculation)
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      // Simple calculation on main thread
      const result = data.holdings.reduce((sum: number, holding: any) => {
        const price = data.currentPrices[holding.coinId] || 0;
        return sum + (holding.amount * price);
      }, 0);
      mainThreadTimes.push(performance.now() - start);
    }

    const avgWorkerTime = workerTimes.reduce((sum, time) => sum + time, 0) / workerTimes.length;
    const avgMainThreadTime = mainThreadTimes.reduce((sum, time) => sum + time, 0) / mainThreadTimes.length;
    const speedup =
      avgWorkerTime > 0 ? avgMainThreadTime / avgWorkerTime : avgMainThreadTime > 0 ? Infinity : 1;

    return {
      averageTime: avgWorkerTime,
      minTime: Math.min(...workerTimes),
      maxTime: Math.max(...workerTimes),
      workerTime: avgWorkerTime,
      mainThreadTime: avgMainThreadTime,
      speedup
    };
  }

  // Cleanup
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Reject all pending requests
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error('Worker destroyed'));
    });
    this.pendingRequests.clear();
    
    this.isWorkerReady.set(false);
    this.loggerService.info('Portfolio worker destroyed', {}, 'portfolio-worker');
  }

  // Restart worker
  restart(): void {
    this.destroy();
    this.initializeWorker();
  }

  // Health check
  checkHealth(): { healthy: boolean; checks: Record<string, boolean> } {
    const checks = {
      worker_ready: this.isReady(),
      no_errors: !this.hasError(),
      pending_requests_limited: this.getPendingRequestsCount() < 10
    };

    return {
      healthy: Object.values(checks).every(check => check),
      checks
    };
  }
}
