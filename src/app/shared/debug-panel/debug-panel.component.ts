import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../design-system/button/button.component';
import { CardComponent } from '../design-system/card/card.component';
import { ResilientApiService } from '../../../infrastructure/api/resilience/resilient-api.service';
import { IndexedDbService } from '../../../infrastructure/persistence/indexed-db.service';

@Component({
  selector: 'app-debug-panel',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    CardComponent
  ],
  template: `
    <div class="debug-panel" *ngIf="!isProduction()">
      <ui-card variant="elevated" size="md" class="debug-card">
        <div slot="header">
          <h4>🔧 Debug Controls</h4>
          <ui-button variant="ghost" size="sm" (click)="togglePanel()">
            {{ isExpanded() ? '▼' : '▲' }}
          </ui-button>
        </div>
        
        @if (isExpanded()) {
          <div class="debug-content">
            <div class="debug-section">
              <h5>Network Simulation</h5>
              <div class="button-group">
                <button 
                  (click)="toggleApiOffline()"
                  class="debug-btn"
                  [class]="{ 'offline': apiOffline() }"
                >
                  {{ apiOffline() ? '🌐 Go Online' : '🚫 Go Offline' }}
                </button>
                <button 
                  (click)="triggerCircuitBreaker()"
                  class="debug-btn danger"
                >
                  ⚡ Open Circuit Breaker
                </button>
                <button 
                  (click)="throttleNetwork()"
                  class="debug-btn warning"
                >
                  🐌 Throttle Network
                </button>
              </div>
            </div>

            <div class="debug-section">
              <h5>Storage Management</h5>
              <div class="button-group">
                <button 
                  (click)="clearStorage()"
                  class="debug-btn"
                >
                  🗑️ Clear IndexedDB
                </button>
                <button 
                  (click)="exportData()"
                  class="debug-btn"
                >
                  📤 Export Data
                </button>
                <button 
                  (click)="fillTestData()"
                  class="debug-btn"
                >
                  📝 Fill Test Data
                </button>
              </div>
            </div>

            <div class="debug-section">
              <h5>Cache Statistics</h5>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">Cache Size</span>
                  <span class="stat-value">{{ cacheStats().size }} items</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Circuit State</span>
                  <span class="stat-value" [class]="getCircuitClass()">{{ getCircuitState() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Failure Count</span>
                  <span class="stat-value">{{ circuitStats().failureCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Network Status</span>
                  <span class="stat-value" [class]="getNetworkClass()">{{ getNetworkStatus() }}</span>
                </div>
              </div>
            </div>

            <div class="debug-section">
              <h5>Performance</h5>
              <div class="button-group">
                <button 
                  (click)="simulateSlowNetwork()"
                  class="debug-btn"
                >
                  🐢 Simulate Slow Network
                </button>
                <button 
                  (click)="simulateErrors()"
                  class="debug-btn danger"
                >
                  ❌ Simulate API Errors
                </button>
              </div>
            </div>
          </div>
        }
      </ui-card>
    </div>
  `,
  styleUrl: './debug-panel.component.scss'
})
export class DebugPanelComponent {
  private resilientApi = inject(ResilientApiService);
  private indexedDb = inject(IndexedDbService);

  isProduction = signal(false);
  isExpanded = signal(true);
  apiOffline = signal(false);
  networkThrottled = signal(false);
  errorSimulation = signal(false);

  cacheStats = computed(() => ({
    size: this.resilientApi.getCacheSize()
  }));

  circuitStats = computed(() => this.resilientApi.getCircuitBreakerStats());

  constructor() {
    this.isProduction.set(this.checkProduction());
  }

  togglePanel(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  toggleApiOffline(): void {
    this.apiOffline.set(!this.apiOffline());
    // In real implementation, this would toggle an interceptor
    console.log('API Offline:', this.apiOffline());
  }

  triggerCircuitBreaker(): void {
    this.resilientApi.resetCircuitBreaker();
    console.log('Circuit breaker reset');
  }

  throttleNetwork(): void {
    this.networkThrottled.set(!this.networkThrottled());
    console.log('Network throttled:', this.networkThrottled());
  }

  clearStorage(): void {
    if (confirm('Are you sure you want to clear all local data?')) {
      this.indexedDb.clearAllData();
      console.log('IndexedDB cleared');
    }
  }

  async exportData(): Promise<void> {
    try {
      const data = await this.indexedDb.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crypto-vault-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      console.log('Data exported successfully');
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  }

  async fillTestData(): Promise<void> {
    try {
      // Add some test transactions
      const testTransactions = [
        {
          id: 'test-1',
          coinId: 'bitcoin',
          type: 'buy' as const,
          amount: 1,
          price: 35000,
          date: Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days ago
        },
        {
          id: 'test-2',
          coinId: 'ethereum',
          type: 'buy' as const,
          amount: 10,
          price: 2000,
          date: Date.now() - 3 * 24 * 60 * 60 * 1000 // 3 days ago
        }
      ];

      await this.indexedDb.saveTransactions(testTransactions);
      console.log('Test data filled successfully');
    } catch (error) {
      console.error('Failed to fill test data:', error);
    }
  }

  simulateSlowNetwork(): void {
    console.log('Simulating slow network...');
    // In real implementation, this would add delays to API calls
  }

  simulateErrors(): void {
    this.errorSimulation.set(!this.errorSimulation());
    console.log('Error simulation:', this.errorSimulation());
  }

  getCircuitState(): string {
    return this.circuitStats().state;
  }

  getCircuitClass(): string {
    const state = this.getCircuitState();
    return state === 'open' ? 'danger' : state === 'half-open' ? 'warning' : 'success';
  }

  getNetworkStatus(): string {
    if (this.apiOffline()) return 'Offline';
    if (this.networkThrottled()) return 'Throttled';
    if (this.errorSimulation()) return 'Error Simulation';
    return 'Online';
  }

  getNetworkClass(): string {
    const status = this.getNetworkStatus();
    switch (status) {
      case 'Offline': return 'danger';
      case 'Throttled': return 'warning';
      case 'Error Simulation': return 'danger';
      default: return 'success';
    }
  }

  private checkProduction(): boolean {
    return location.hostname === 'crypto-vault-pro.netlify.app' || 
           location.hostname.includes('vercel.app') ||
           location.hostname.includes('netlify.app');
  }
}
