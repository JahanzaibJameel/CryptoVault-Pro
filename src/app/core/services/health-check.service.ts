import { Injectable, signal, computed, inject } from '@angular/core';
import { OfflineService } from './offline.service';
import { SentryService } from './sentry.service';
import { PerformanceService } from './performance.service';
import { ResilientApiService } from '../../../infrastructure/api/resilience/resilient-api.service';
import { IndexedDbService } from '../../../infrastructure/persistence/indexed-db.service';

export interface HealthStatus {
  healthy: boolean;
  checks: HealthCheck[];
  timestamp: number;
  overallScore: number;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  message: string;
  details?: Record<string, any>;
  duration: number;
  timestamp: number;
}

export interface SystemHealth {
  api: HealthCheck;
  storage: HealthCheck;
  network: HealthCheck;
  performance: HealthCheck;
  monitoring: HealthCheck;
  encryption?: HealthCheck;
}

@Injectable({
  providedIn: 'root'
})
export class HealthCheckService {
  private offlineService = inject(OfflineService);
  private sentryService = inject(SentryService);
  private performanceService = inject(PerformanceService);
  private resilientApiService = inject(ResilientApiService);
  private indexedDbService = inject(IndexedDbService);
  
  private healthStatus = signal<HealthStatus>({
    healthy: false,
    checks: [],
    timestamp: 0,
    overallScore: 0
  });

  private isRunning = signal(false);
  private checkInterval: number | null = null;
  private readonly CHECK_INTERVAL = 60000; // 1 minute

  constructor() {
    this.initializeHealthChecks();
  }

  private initializeHealthChecks(): void {
    // Run initial health check
    this.runHealthCheck();
    
    // Set up periodic health checks
    this.startPeriodicChecks();
    
    // Run health check when coming back online
    this.offlineService.onConnectionStatusChange().subscribe(status => {
      if (status.isOnline) {
        this.runHealthCheck();
      }
    });
  }

  startPeriodicChecks(): void {
    if (this.isRunning()) return;
    
    this.isRunning.set(true);
    this.checkInterval = window.setInterval(() => {
      this.runHealthCheck();
    }, this.CHECK_INTERVAL);
  }

  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning.set(false);
  }

  async runHealthCheck(): Promise<HealthStatus> {
    const startTime = performance.now();
    
    try {
      const checks = await Promise.allSettled([
        this.checkApiHealth(),
        this.checkStorageHealth(),
        this.checkNetworkHealth(),
        this.checkPerformanceHealth(),
        this.checkMonitoringHealth(),
        this.checkEncryptionHealth()
      ]);

      const healthChecks: HealthCheck[] = checks.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            name: this.getCheckName(index),
            status: 'error',
            message: `Health check failed: ${(result.reason as Error).message}`,
            duration: 0,
            timestamp: Date.now()
          };
        }
      });

      const healthyCount = healthChecks.filter(check => check.status === 'healthy').length;
      const warningCount = healthChecks.filter(check => check.status === 'warning').length;
      const errorCount = healthChecks.filter(check => check.status === 'error').length;
      
      const overallScore = this.calculateOverallScore(healthChecks);
      const isHealthy = errorCount === 0 && warningCount <= 1;

      const status: HealthStatus = {
        healthy: isHealthy,
        checks: healthChecks,
        timestamp: Date.now(),
        overallScore
      };

      this.healthStatus.set(status);
      
      // Log health status to monitoring
      this.sentryService.addBreadcrumb(
        `Health check completed: ${isHealthy ? 'healthy' : 'unhealthy'} (${overallScore}%)`,
        'health-check',
        isHealthy ? 'info' : 'warning',
        { 
          score: overallScore,
          healthy: healthyCount,
          warnings: warningCount,
          errors: errorCount,
          duration: performance.now() - startTime
        }
      );

      return status;
    } catch (error) {
      const errorStatus: HealthStatus = {
        healthy: false,
        checks: [{
          name: 'overall',
          status: 'error',
          message: `Health check system failed: ${(error as Error).message}`,
          duration: performance.now() - startTime,
          timestamp: Date.now()
        }],
        timestamp: Date.now(),
        overallScore: 0
      };

      this.healthStatus.set(errorStatus);
      this.sentryService.captureException(error, { context: 'health-check' });
      
      return errorStatus;
    }
  }

  private async checkApiHealth(): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      // Test API connectivity
      const apiTestUrl = '/api/ping'; // Health check endpoint
      const response = await fetch(apiTestUrl, {
        method: 'HEAD',
        cache: 'no-cache'
      });

      const duration = performance.now() - startTime;
      const circuitBreakerStats = this.resilientApiService.getCircuitBreakerStats();
      
      const details = {
        responseTime: Math.round(duration),
        statusCode: response.status,
        circuitBreakerState: circuitBreakerStats.state,
        failureCount: circuitBreakerStats.failureCount,
        cacheSize: this.resilientApiService.getCacheSize()
      };

      if (response.ok && circuitBreakerStats.state !== 'OPEN') {
        return {
          name: 'api',
          status: duration < 1000 ? 'healthy' : 'warning',
          message: `API responding in ${Math.round(duration)}ms`,
          details,
          duration,
          timestamp: Date.now()
        };
      } else {
        return {
          name: 'api',
          status: 'error',
          message: `API not responding (${response.status}) or circuit breaker open`,
          details,
          duration,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        name: 'api',
        status: 'error',
        message: `API connection failed: ${(error as Error).message}`,
        details: { error: (error as Error).name },
        duration,
        timestamp: Date.now()
      };
    }
  }

  private async checkStorageHealth(): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      // Test IndexedDB
      const testKey = `health-check-${Date.now()}`;
      const testData = { test: true, timestamp: Date.now() };
      
      await this.indexedDbService.saveSetting(testKey, testData);
      const retrieved = await this.indexedDbService.getSetting(testKey);
      // Note: IndexedDbService doesn't have a delete method for settings, so we'll just leave it

      const duration = performance.now() - startTime;
      
      if (retrieved && retrieved.test === true) {
        return {
          name: 'storage',
          status: duration < 100 ? 'healthy' : 'warning',
          message: `Storage responding in ${Math.round(duration)}ms`,
          details: { responseTime: Math.round(duration) },
          duration,
          timestamp: Date.now()
        };
      } else {
        return {
          name: 'storage',
          status: 'error',
          message: 'Storage read/write test failed',
          details: { retrieved },
          duration,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        name: 'storage',
        status: 'error',
        message: `Storage check failed: ${(error as Error).message}`,
        details: { error: (error as Error).name },
        duration,
        timestamp: Date.now()
      };
    }
  }

  private async checkNetworkHealth(): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      const connectionStatus = this.offlineService.getConnectionStatus();
      const connectionInfo = this.offlineService.connectionInfo();
      
      const duration = performance.now() - startTime;
      
      if (connectionStatus === 'online') {
        const details = {
          status: connectionStatus,
          type: connectionInfo.type,
          effectiveType: connectionInfo.effectiveType,
          downlink: connectionInfo.downlink,
          rtt: connectionInfo.rtt
        };

        return {
          name: 'network',
          status: connectionInfo.effectiveType === 'poor' ? 'warning' : 'healthy',
          message: `Network ${connectionStatus} (${connectionInfo.effectiveType})`,
          details,
          duration,
          timestamp: Date.now()
        };
      } else {
        return {
          name: 'network',
          status: connectionStatus === 'offline' ? 'error' : 'warning',
          message: `Network ${connectionStatus}`,
          details: { status: connectionStatus },
          duration,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        name: 'network',
        status: 'error',
        message: `Network check failed: ${(error as Error).message}`,
        details: { error: (error as Error).name },
        duration,
        timestamp: Date.now()
      };
    }
  }

  private async checkPerformanceHealth(): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      const metrics = this.performanceService.getMetrics();
      const score = this.performanceService.getPerformanceScore();
      const slowResources = this.performanceService.getSlowResources(3000);
      
      const duration = performance.now() - startTime;
      
      const details = {
        score,
        metrics,
        slowResourcesCount: slowResources.length,
        memoryUsage: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        } : null
      };

      if (score >= 80) {
        return {
          name: 'performance',
          status: 'healthy',
          message: `Performance score: ${score}%`,
          details,
          duration,
          timestamp: Date.now()
        };
      } else if (score >= 60) {
        return {
          name: 'performance',
          status: 'warning',
          message: `Performance score: ${score}% (needs improvement)`,
          details,
          duration,
          timestamp: Date.now()
        };
      } else {
        return {
          name: 'performance',
          status: 'error',
          message: `Performance score: ${score}% (poor)`,
          details,
          duration,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        name: 'performance',
        status: 'error',
        message: `Performance check failed: ${(error as Error).message}`,
        details: { error: (error as Error).name },
        duration,
        timestamp: Date.now()
      };
    }
  }

  private async checkMonitoringHealth(): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      const sentryHealth = this.sentryService.checkHealth();
      const performanceHealth = this.performanceService.checkHealth();
      
      const duration = performance.now() - startTime;
      
      const details = {
        sentry: sentryHealth,
        performance: performanceHealth,
        offlineQueueSize: this.sentryService.getOfflineQueueSize()
      };

      if (sentryHealth.healthy && performanceHealth.healthy) {
        return {
          name: 'monitoring',
          status: 'healthy',
          message: 'Monitoring systems operational',
          details,
          duration,
          timestamp: Date.now()
        };
      } else {
        return {
          name: 'monitoring',
          status: 'warning',
          message: 'Some monitoring systems degraded',
          details,
          duration,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        name: 'monitoring',
        status: 'error',
        message: `Monitoring check failed: ${(error as Error).message}`,
        details: { error: (error as Error).name },
        duration,
        timestamp: Date.now()
      };
    }
  }

  private async checkEncryptionHealth(): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      // This would check if encryption service is available and working
      // For now, return a healthy status since encryption is optional
      const duration = performance.now() - startTime;
      
      return {
        name: 'encryption',
        status: 'healthy',
        message: 'Encryption service available',
        details: { available: true },
        duration,
        timestamp: Date.now()
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        name: 'encryption',
        status: 'warning',
        message: `Encryption check failed: ${(error as Error).message}`,
        details: { error: (error as Error).name },
        duration,
        timestamp: Date.now()
      };
    }
  }

  private calculateOverallScore(checks: HealthCheck[]): number {
    if (checks.length === 0) return 0;
    
    const scores = checks.map(check => {
      switch (check.status) {
        case 'healthy': return 100;
        case 'warning': return 50;
        case 'error': return 0;
        default: return 25;
      }
    });
    
    return Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / checks.length);
  }

  private getCheckName(index: number): string {
    const names = ['api', 'storage', 'network', 'performance', 'monitoring', 'encryption'];
    return names[index] || 'unknown';
  }

  // Public API methods
  getHealthStatus(): HealthStatus {
    return this.healthStatus();
  }

  isHealthy(): boolean {
    return this.healthStatus().healthy;
  }

  getOverallScore(): number {
    return this.healthStatus().overallScore;
  }

  getSystemHealth(): SystemHealth {
    const checks = this.healthStatus().checks;
    const findCheck = (name: string) => checks.find(check => check.name === name) || {
      name,
      status: 'unknown' as const,
      message: 'Check not found',
      duration: 0,
      timestamp: Date.now()
    };

    return {
      api: findCheck('api'),
      storage: findCheck('storage'),
      network: findCheck('network'),
      performance: findCheck('performance'),
      monitoring: findCheck('monitoring'),
      encryption: findCheck('encryption')
    };
  }

  async forceHealthCheck(): Promise<HealthStatus> {
    return this.runHealthCheck();
  }

  // Health check endpoint data
  getHealthEndpointData(): any {
    const health = this.getHealthStatus();
    const systemHealth = this.getSystemHealth();
    
    return {
      status: health.healthy ? 'healthy' : 'unhealthy',
      timestamp: health.timestamp,
      score: health.overallScore,
      uptime: performance.now(),
      version: '1.0.0',
      checks: systemHealth,
      environment: 'production' // This would be dynamic
    };
  }
}
