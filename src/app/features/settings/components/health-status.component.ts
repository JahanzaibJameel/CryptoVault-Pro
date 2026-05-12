import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { CardComponent } from '../../../shared/design-system/card/card.component';
import { ButtonComponent } from '../../../shared/design-system/button/button.component';
import { SkeletonComponent } from '../../../shared/design-system/skeleton/skeleton.component';
import { ResilientApiService } from '../../../../infrastructure/api/resilience/resilient-api.service';
import { OfflineService } from '../../../../app/core/services/offline.service';
import { PerformanceService } from '../../../../app/core/services/performance.service';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'checking';
  message: string;
  lastChecked: Date;
  responseTime?: number;
}

interface SystemHealth {
  api: HealthCheck;
  circuitBreaker: HealthCheck;
  cache: HealthCheck;
  offlineService: HealthCheck;
  performance: HealthCheck;
  indexedDB: HealthCheck;
}

@Component({
  selector: 'app-health-status',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    SkeletonComponent
  ],
  template: `
    <div class="health-status">
      <ui-card variant="elevated" size="lg">
        <div slot="header">
          <div class="health-header">
            <h2>System Health Status</h2>
            <div class="health-overview">
              <span class="overall-status" [class]="overallStatusClass()">
                {{ overallStatusText() }}
              </span>
              <ui-button 
                variant="ghost" 
                size="sm" 
                (click)="refreshHealthChecks()"
                [loading]="isChecking()"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l2.35 2.35z"/>
                </svg>
                Refresh
              </ui-button>
            </div>
          </div>
        </div>
        
        <div class="health-content">
          @if (isChecking()) {
            <div class="health-loading">
              <ui-skeleton variant="rectangular" size="md" width="100%" height="200px" />
            </div>
          } @else {
            <div class="health-checks">
              <!-- API Health -->
              <div class="health-item" [class]="getHealthClass(systemHealth().api)">
                <div class="health-item-header">
                  <div class="health-indicator" [class]="systemHealth().api.status"></div>
                  <div class="health-info">
                    <h3>API Connectivity</h3>
                    <p class="health-message">{{ systemHealth().api.message }}</p>
                    @if (systemHealth().api.responseTime) {
                      <p class="health-details">Response time: {{ systemHealth().api.responseTime }}ms</p>
                    }
                  </div>
                </div>
                <div class="health-meta">
                  <span class="last-checked">Last checked: {{ formatTime(systemHealth().api.lastChecked) }}</span>
                </div>
              </div>

              <!-- Circuit Breaker -->
              <div class="health-item" [class]="getHealthClass(systemHealth().circuitBreaker)">
                <div class="health-item-header">
                  <div class="health-indicator" [class]="systemHealth().circuitBreaker.status"></div>
                  <div class="health-info">
                    <h3>Circuit Breaker</h3>
                    <p class="health-message">{{ systemHealth().circuitBreaker.message }}</p>
                  </div>
                </div>
                <div class="health-meta">
                  <span class="last-checked">Last checked: {{ formatTime(systemHealth().circuitBreaker.lastChecked) }}</span>
                </div>
              </div>

              <!-- Cache -->
              <div class="health-item" [class]="getHealthClass(systemHealth().cache)">
                <div class="health-item-header">
                  <div class="health-indicator" [class]="systemHealth().cache.status"></div>
                  <div class="health-info">
                    <h3>Cache System</h3>
                    <p class="health-message">{{ systemHealth().cache.message }}</p>
                  </div>
                </div>
                <div class="health-meta">
                  <span class="last-checked">Last checked: {{ formatTime(systemHealth().cache.lastChecked) }}</span>
                </div>
              </div>

              <!-- Offline Service -->
              <div class="health-item" [class]="getHealthClass(systemHealth().offlineService)">
                <div class="health-item-header">
                  <div class="health-indicator" [class]="systemHealth().offlineService.status"></div>
                  <div class="health-info">
                    <h3>Offline Service</h3>
                    <p class="health-message">{{ systemHealth().offlineService.message }}</p>
                  </div>
                </div>
                <div class="health-meta">
                  <span class="last-checked">Last checked: {{ formatTime(systemHealth().offlineService.lastChecked) }}</span>
                </div>
              </div>

              <!-- Performance -->
              <div class="health-item" [class]="getHealthClass(systemHealth().performance)">
                <div class="health-item-header">
                  <div class="health-indicator" [class]="systemHealth().performance.status"></div>
                  <div class="health-info">
                    <h3>Performance Metrics</h3>
                    <p class="health-message">{{ systemHealth().performance.message }}</p>
                  </div>
                </div>
                <div class="health-meta">
                  <span class="last-checked">Last checked: {{ formatTime(systemHealth().performance.lastChecked) }}</span>
                </div>
              </div>

              <!-- IndexedDB -->
              <div class="health-item" [class]="getHealthClass(systemHealth().indexedDB)">
                <div class="health-item-header">
                  <div class="health-indicator" [class]="systemHealth().indexedDB.status"></div>
                  <div class="health-info">
                    <h3>IndexedDB Storage</h3>
                    <p class="health-message">{{ systemHealth().indexedDB.message }}</p>
                  </div>
                </div>
                <div class="health-meta">
                  <span class="last-checked">Last checked: {{ formatTime(systemHealth().indexedDB.lastChecked) }}</span>
                </div>
              </div>
            </div>
          }

          <!-- Health Summary -->
          <div class="health-summary">
            <h3>System Summary</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">Overall Status</span>
                <span class="summary-value" [class]="overallStatusClass()">
                  {{ overallStatusText() }}
                </span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Healthy Services</span>
                <span class="summary-value healthy">{{ healthyServicesCount() }}/{{ totalServicesCount() }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Issues Detected</span>
                <span class="summary-value" [class]="issuesCount() > 0 ? 'warning' : 'healthy'">
                  {{ issuesCount() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ui-card>
    </div>
  `,
  styles: [`
    .health-status {
      padding: var(--spacing-6);
      max-width: 800px;
      margin: 0 auto;
    }

    .health-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-4);
    }

    .health-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .health-overview {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
    }

    .overall-status {
      padding: var(--spacing-2) var(--spacing-3);
      border-radius: var(--radius-md);
      font-weight: 500;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .overall-status.healthy {
      background: rgba(0, 227, 150, 0.1);
      color: var(--color-success);
      border: 1px solid rgba(0, 227, 150, 0.3);
    }

    .overall-status.warning {
      background: rgba(255, 189, 0, 0.1);
      color: var(--color-warning);
      border: 1px solid rgba(255, 189, 0, 0.3);
    }

    .overall-status.error {
      background: rgba(255, 77, 106, 0.1);
      color: var(--color-danger);
      border: 1px solid rgba(255, 77, 106, 0.3);
    }

    .health-content {
      padding: var(--spacing-6) 0;
    }

    .health-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }

    .health-checks {
      display: grid;
      gap: var(--spacing-4);
    }

    .health-item {
      padding: var(--spacing-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-bg-secondary);
      transition: all var(--transition-normal);
    }

    .health-item.healthy {
      border-color: var(--color-success);
      background: rgba(0, 227, 150, 0.05);
    }

    .health-item.warning {
      border-color: var(--color-warning);
      background: rgba(255, 189, 0, 0.05);
    }

    .health-item.error {
      border-color: var(--color-danger);
      background: rgba(255, 77, 106, 0.05);
    }

    .health-item-header {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-3);
      margin-bottom: var(--spacing-3);
    }

    .health-indicator {
      width: 12px;
      height: 12px;
      border-radius: var(--radius-full);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .health-indicator.healthy {
      background: var(--color-success);
      box-shadow: 0 0 8px rgba(0, 227, 150, 0.3);
    }

    .health-indicator.warning {
      background: var(--color-warning);
      box-shadow: 0 0 8px rgba(255, 189, 0, 0.3);
    }

    .health-indicator.error {
      background: var(--color-danger);
      box-shadow: 0 0 8px rgba(255, 77, 106, 0.3);
    }

    .health-indicator.checking {
      background: var(--color-text-secondary);
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .health-info {
      flex: 1;
    }

    .health-info h3 {
      margin: 0 0 var(--spacing-1) 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .health-message {
      margin: 0 0 var(--spacing-2) 0;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      line-height: 1.4;
    }

    .health-details {
      font-size: 0.75rem;
      color: var(--color-text-hint);
      margin: 0;
    }

    .health-meta {
      margin-top: var(--spacing-3);
      padding-top: var(--spacing-3);
      border-top: 1px solid var(--color-border-light);
    }

    .last-checked {
      font-size: 0.75rem;
      color: var(--color-text-hint);
    }

    .health-summary {
      margin-top: var(--spacing-6);
      padding: var(--spacing-4);
      background: var(--color-bg-glass);
      border: 1px solid var(--color-border-glass);
      border-radius: var(--radius-lg);
    }

    .health-summary h3 {
      margin: 0 0 var(--spacing-4) 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-4);
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-3);
      background: var(--color-bg-primary);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-light);
    }

    .summary-label {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .summary-value {
      font-size: 0.875rem;
      font-weight: 600;
      padding: var(--spacing-1) var(--spacing-2);
      border-radius: var(--radius-sm);
    }

    .summary-value.healthy {
      background: rgba(0, 227, 150, 0.1);
      color: var(--color-success);
    }

    .summary-value.warning {
      background: rgba(255, 189, 0, 0.1);
      color: var(--color-warning);
    }

    .summary-value.error {
      background: rgba(255, 77, 106, 0.1);
      color: var(--color-danger);
    }

    @media (max-width: 768px) {
      .health-status {
        padding: var(--spacing-4);
      }

      .health-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-3);
      }

      .health-overview {
        width: 100%;
        justify-content: space-between;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HealthStatusComponent implements OnInit {
  private apiService = inject(ResilientApiService);
  private offlineService = inject(OfflineService);
  private performanceService = inject(PerformanceService);

  isChecking = signal(false);
  systemHealth = signal<SystemHealth>({
    api: { name: 'API', status: 'checking', message: 'Checking...', lastChecked: new Date() },
    circuitBreaker: { name: 'Circuit Breaker', status: 'checking', message: 'Checking...', lastChecked: new Date() },
    cache: { name: 'Cache', status: 'checking', message: 'Checking...', lastChecked: new Date() },
    offlineService: { name: 'Offline Service', status: 'checking', message: 'Checking...', lastChecked: new Date() },
    performance: { name: 'Performance', status: 'checking', message: 'Checking...', lastChecked: new Date() },
    indexedDB: { name: 'IndexedDB', status: 'checking', message: 'Checking...', lastChecked: new Date() }
  });

  overallStatus = computed(() => {
    const health = this.systemHealth();
    const statuses = Object.values(health).map(h => h.status);
    
    if (statuses.every(s => s === 'healthy')) return 'healthy';
    if (statuses.some(s => s === 'error')) return 'error';
    if (statuses.some(s => s === 'warning')) return 'warning';
    return 'checking';
  });

  overallStatusText = computed(() => {
    const status = this.overallStatus();
    switch (status) {
      case 'healthy': return 'All Systems Operational';
      case 'warning': return 'Some Issues Detected';
      case 'error': return 'Critical Issues';
      default: return 'Checking...';
    }
  });

  healthyServicesCount = computed(() => {
    const health = this.systemHealth();
    return Object.values(health).filter(h => h.status === 'healthy').length;
  });

  totalServicesCount = computed(() => {
    return Object.keys(this.systemHealth()).length;
  });

  issuesCount = computed(() => {
    const health = this.systemHealth();
    return Object.values(health).filter(h => h.status === 'warning' || h.status === 'error').length;
  });

  ngOnInit(): void {
    this.refreshHealthChecks();
  }

  async refreshHealthChecks(): Promise<void> {
    this.isChecking.set(true);
    
    try {
      await Promise.all([
        this.checkApiHealth(),
        this.checkCircuitBreakerHealth(),
        this.checkCacheHealth(),
        this.checkOfflineServiceHealth(),
        this.checkPerformanceHealth(),
        this.checkIndexedDBHealth()
      ]);
    } finally {
      this.isChecking.set(false);
    }
  }

  private async checkApiHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Make a simple API call to check connectivity
      await firstValueFrom(this.apiService.get('/api/ping', { useCache: false }));
      
      const responseTime = Date.now() - startTime;
      
      this.systemHealth.update(health => ({
        ...health,
        api: {
          name: 'API',
          status: responseTime < 1000 ? 'healthy' : 'warning',
          message: responseTime < 1000 
            ? 'API responding normally' 
            : `Slow response: ${responseTime}ms`,
          lastChecked: new Date(),
          responseTime
        }
      }));
    } catch (error) {
      this.systemHealth.update(health => ({
        ...health,
        api: {
          name: 'API',
          status: 'error',
          message: 'API connection failed',
          lastChecked: new Date(),
          responseTime: Date.now() - startTime
        }
      }));
    }
  }

  private checkCircuitBreakerHealth(): void {
    const stats = this.apiService.getCircuitBreakerStats();
    
    this.systemHealth.update(health => ({
      ...health,
      circuitBreaker: {
        name: 'Circuit Breaker',
        status: stats.state === 'CLOSED' ? 'healthy' : 'warning',
        message: `Circuit breaker is ${stats.state.toLowerCase()} (${stats.failureCount} failures)`,
        lastChecked: new Date()
      }
    }));
  }

  private checkCacheHealth(): void {
    const cacheSize = this.apiService.getCacheSize();
    
    this.systemHealth.update(health => ({
      ...health,
      cache: {
        name: 'Cache',
        status: cacheSize >= 0 ? 'healthy' : 'error',
        message: `Cache contains ${cacheSize} entries`,
        lastChecked: new Date()
      }
    }));
  }

  private checkOfflineServiceHealth(): void {
    const connectionStatus = this.offlineService.getConnectionStatus();
    
    this.systemHealth.update(health => ({
      ...health,
      offlineService: {
        name: 'Offline Service',
        status: connectionStatus === 'online' ? 'healthy' : 'warning',
        message: `Connection status: ${connectionStatus}`,
        lastChecked: new Date()
      }
    }));
  }

  private checkPerformanceHealth(): void {
    const performanceHealth = this.performanceService.checkHealth();
    
    this.systemHealth.update(health => ({
      ...health,
      performance: {
        name: 'Performance',
        status: performanceHealth.healthy ? 'healthy' : 'warning',
        message: performanceHealth.healthy 
          ? 'Performance monitoring active' 
          : 'Performance monitoring issues detected',
        lastChecked: new Date()
      }
    }));
  }

  private async checkIndexedDBHealth(): Promise<void> {
    try {
      // Check IndexedDB availability and basic operations
      const testDB = await this.openTestDatabase();
      if (testDB) {
        await testDB.close();
      }
      
      this.systemHealth.update(health => ({
        ...health,
        indexedDB: {
          name: 'IndexedDB',
          status: 'healthy',
          message: 'IndexedDB operational',
          lastChecked: new Date()
        }
      }));
    } catch (error) {
      this.systemHealth.update(health => ({
        ...health,
        indexedDB: {
          name: 'IndexedDB',
          status: 'error',
          message: 'IndexedDB access failed',
          lastChecked: new Date()
        }
      }));
    }
  }

  private async openTestDatabase(): Promise<IDBDatabase | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open('health-check-test', 1);
      
      request.onerror = () => resolve(null);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('test')) {
          db.createObjectStore('test');
        }
      };
    });
  }

  getHealthClass(healthCheck: HealthCheck): string {
    return healthCheck.status;
  }

  overallStatusClass(): string {
    return this.overallStatus();
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString();
  }
}
