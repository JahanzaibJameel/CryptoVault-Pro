import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineSimulatorControls } from '../interceptors/offline-simulator.interceptor';
import { ResilientApiService } from '../../../infrastructure/api/resilience/resilient-api.service';
import { NotificationService } from '../services/notification.service';
import { ButtonComponent } from '../../shared/design-system/button/button.component';
import { CardComponent } from '../../shared/design-system/card/card.component';

@Component({
  selector: 'app-failure-toggle',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    CardComponent
  ],
  template: `
    <div class="debug-panel" [class.expanded]="expanded()">
      <button 
        class="debug-toggle" 
        (click)="toggleExpanded()"
        [attr.aria-label]="expanded() ? 'Hide debug panel' : 'Show debug panel'"
      >
        <span class="debug-icon">🔧</span>
        <span class="debug-text">Debug</span>
      </button>

      <div class="debug-content" [class.visible]="expanded()">
        <ui-card variant="elevated" size="md">
          <div slot="header">
            <h3>Connection Simulator</h3>
            <span class="debug-status" [class]="getConnectionStatusClass()">
              {{ getConnectionStatusText() }}
            </span>
          </div>
          <div class="debug-controls">
            <!-- Connection Controls -->
            <div class="control-group">
              <h4>Connection Status</h4>
              <div class="button-group">
                <ui-button 
                  [variant]="simulatorState().offline ? 'danger' : 'secondary'"
                  size="sm"
                  (click)="toggleOffline()"
                >
                  {{ simulatorState().offline ? 'Go Online' : 'Go Offline' }}
                </ui-button>
                <ui-button 
                  variant="ghost"
                  size="sm"
                  (click)="resetConnection()"
                >
                  Reset
                </ui-button>
              </div>
            </div>

            <!-- Latency Controls -->
            <div class="control-group">
              <h4>Latency (ms)</h4>
              <div class="slider-control">
                <input 
                  type="range" 
                  min="0" 
                  max="5000" 
                  step="100"
                  [value]="simulatorState().latency"
                  (input)="updateLatency($any($event.target).value)"
                  class="latency-slider"
                />
                <span class="slider-value">{{ simulatorState().latency }}ms</span>
              </div>
              <div class="preset-buttons">
                <ui-button 
                  variant="ghost"
                  size="xs"
                  (click)="setLatency(0)"
                >
                  None
                </ui-button>
                <ui-button 
                  variant="ghost"
                  size="xs"
                  (click)="setLatency(500)"
                >
                  500ms
                </ui-button>
                <ui-button 
                  variant="ghost"
                  size="xs"
                  (click)="setLatency(2000)"
                >
                  2s
                </ui-button>
                <ui-button 
                  variant="ghost"
                  size="xs"
                  (click)="setLatency(5000)"
                >
                  5s
                </ui-button>
              </div>
            </div>

            <!-- Failure Rate Controls -->
            <div class="control-group">
              <h4>Failure Rate</h4>
              <div class="slider-control">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  [value]="simulatorState().failureRate * 100"
                  (input)="updateFailureRate($any($event.target).value)"
                  class="failure-slider"
                />
                <span class="slider-value">{{ (simulatorState().failureRate * 100).toFixed(0) }}%</span>
              </div>
              <div class="preset-buttons">
                <ui-button 
                  variant="ghost"
                  size="xs"
                  (click)="setFailureRate(0)"
                >
                  None
                </ui-button>
                <ui-button 
                  variant="ghost"
                  size="xs"
                  (click)="setFailureRate(0.1)"
                >
                  10%
                </ui-button>
                <ui-button 
                  variant="ghost"
                  size="xs"
                  (click)="setFailureRate(0.3)"
                >
                  30%
                </ui-button>
                <ui-button 
                  variant="ghost"
                  size="xs"
                  (click)="setFailureRate(0.5)"
                >
                  50%
                </ui-button>
              </div>
            </div>

            <!-- Preset Scenarios -->
            <div class="control-group">
              <h4>Presets</h4>
              <div class="preset-grid">
                <ui-button 
                  variant="secondary"
                  size="sm"
                  (click)="applyPreset('perfect')"
                >
                  Perfect Connection
                </ui-button>
                <ui-button 
                  variant="warning"
                  size="sm"
                  (click)="applyPreset('slow')"
                >
                  Slow Connection
                </ui-button>
                <ui-button 
                  variant="danger"
                  size="sm"
                  (click)="applyPreset('unreliable')"
                >
                  Unreliable
                </ui-button>
                <ui-button 
                  variant="danger"
                  size="sm"
                  (click)="applyPreset('terrible')"
                >
                  Terrible
                </ui-button>
              </div>
            </div>

            <!-- Cache Controls -->
            <div class="control-group">
              <h4>Cache Management</h4>
              <div class="cache-stats">
                <div class="stat-item">
                  <span class="stat-label">Cache Size</span>
                  <span class="stat-value">{{ cacheStats().size }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Circuit Breaker</span>
                  <span class="stat-value" [class]="getCircuitBreakerClass()">
                    {{ circuitBreakerStats().state }}
                  </span>
                </div>
              </div>
              <div class="cache-actions">
                <ui-button 
                  variant="ghost"
                  size="sm"
                  (click)="clearCache()"
                >
                  Clear Cache
                </ui-button>
                <ui-button 
                  variant="ghost"
                  size="sm"
                  (click)="resetCircuitBreaker()"
                >
                  Reset Circuit
                </ui-button>
              </div>
            </div>

            <!-- Data Management -->
            <div class="control-group">
              <h4>Data Management</h4>
              <div class="data-actions">
                <ui-button 
                  variant="warning"
                  size="sm"
                  (click)="clearStorage()"
                >
                  Clear All Storage
                </ui-button>
                <ui-button 
                  variant="ghost"
                  size="sm"
                  (click)="exportDebugInfo()"
                >
                  Export Debug Info
                </ui-button>
              </div>
            </div>
          </div>
        </ui-card>

        <!-- Status Indicator -->
        <div class="status-indicator" [class]="getStatusIndicatorClass()">
          <div class="status-dot"></div>
          <span class="status-text">{{ getStatusText() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .debug-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: var(--font-family-primary);
    }

    .debug-toggle {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: var(--color-gray-900);
      color: var(--color-white);
      border: none;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: var(--shadow-lg);
    }

    .debug-toggle:hover {
      background-color: var(--color-gray-800);
      transform: translateY(-2px);
    }

    .debug-icon {
      font-size: var(--font-size-base);
    }

    .debug-text {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
    }

    .debug-panel.expanded .debug-toggle {
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }

    .debug-content {
      position: absolute;
      bottom: 100%;
      right: 0;
      width: 400px;
      max-height: 80vh;
      overflow-y: auto;
      background-color: var(--color-background-paper);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      box-shadow: var(--shadow-xl);
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: all 0.3s ease;
    }

    .debug-content.visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .debug-controls {
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .control-group h4 {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .button-group {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .slider-control {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .latency-slider,
    .failure-slider {
      flex: 1;
      height: 6px;
      border-radius: var(--radius-sm);
      background: var(--color-gray-200);
      outline: none;
      -webkit-appearance: none;
    }

    .latency-slider::-webkit-slider-thumb,
    .failure-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--color-primary-500);
      cursor: pointer;
      box-shadow: var(--shadow-sm);
    }

    .latency-slider::-moz-range-thumb,
    .failure-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--color-primary-500);
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      border: none;
    }

    .slider-value {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      min-width: 60px;
      text-align: center;
    }

    .preset-buttons {
      display: flex;
      gap: var(--spacing-xs);
      flex-wrap: wrap;
    }

    .preset-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-sm);
    }

    .cache-stats {
      display: flex;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-md);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .stat-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .cache-actions,
    .data-actions {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .debug-status {
      font-size: var(--font-size-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-sm);
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
    }

    .debug-status.online {
      background-color: var(--color-success-100);
      color: var(--color-success-700);
    }

    .debug-status.offline {
      background-color: var(--color-danger-100);
      color: var(--color-danger-700);
    }

    .debug-status.slow {
      background-color: var(--color-warning-100);
      color: var(--color-warning-700);
    }

    .status-indicator {
      position: absolute;
      top: var(--spacing-sm);
      left: var(--spacing-sm);
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-md);
      background-color: var(--color-gray-100);
      font-size: var(--font-size-xs);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--color-success-500);
      animation: pulse 2s infinite;
    }

    .status-indicator.slow .status-dot {
      background-color: var(--color-warning-500);
    }

    .status-indicator.offline .status-dot {
      background-color: var(--color-danger-500);
      animation: none;
    }

    .status-text {
      font-weight: var(--font-weight-medium);
      color: var(--color-text-secondary);
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    .circuit-breaker-class.open {
      color: var(--color-danger-500);
    }

    .circuit-breaker-class.closed {
      color: var(--color-success-500);
    }

    .circuit-breaker-class.half-open {
      color: var(--color-warning-500);
    }

    /* Dark theme */
    [data-theme="dark"] .debug-toggle {
      background-color: var(--color-gray-700);
    }

    [data-theme="dark"] .debug-toggle:hover {
      background-color: var(--color-gray-600);
    }

    [data-theme="dark"] .debug-content {
      background-color: var(--color-background-elevated);
      border-color: var(--color-border-dark);
    }

    [data-theme="dark"] .latency-slider,
    [data-theme="dark"] .failure-slider {
      background: var(--color-gray-700);
    }

    [data-theme="dark"] .status-indicator {
      background-color: var(--color-gray-800);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .debug-panel {
        bottom: 10px;
        right: 10px;
        left: 10px;
      }

      .debug-content {
        width: 100%;
        max-width: 400px;
        max-height: 60vh;
      }

      .preset-grid {
        grid-template-columns: 1fr;
      }

      .cache-stats {
        flex-direction: column;
        gap: var(--spacing-md);
      }
    }
  `]
})
export class FailureToggleComponent {
  private resilientApi = inject(ResilientApiService);
  private notificationService = inject(NotificationService);

  // Signals
  public expanded = signal(false);
  simulatorState = computed(() => OfflineSimulatorControls.getState());
  cacheStats = computed(() => ({ size: this.resilientApi.getCacheSize() }));
  circuitBreakerStats = computed(() => this.resilientApi.getCircuitBreakerStats());

  toggleExpanded(): void {
    this.expanded.set(!this.expanded());
  }

  // Connection controls
  toggleOffline(): void {
    OfflineSimulatorControls.setOffline(!this.simulatorState().offline);
    this.notificationService.info(
      'Connection Status',
      this.simulatorState().offline ? 'Offline mode enabled' : 'Online mode restored'
    );
  }

  resetConnection(): void {
    OfflineSimulatorControls.reset();
    this.notificationService.success('Connection Reset', 'All simulations disabled');
  }

  updateLatency(value: number): void {
    OfflineSimulatorControls.setLatency(value);
  }

  setLatency(ms: number): void {
    OfflineSimulatorControls.setLatency(ms);
  }

  updateFailureRate(value: number): void {
    OfflineSimulatorControls.setFailureRate(value / 100);
  }

  setFailureRate(rate: number): void {
    OfflineSimulatorControls.setFailureRate(rate);
  }

  // Presets
  applyPreset(preset: 'perfect' | 'slow' | 'unreliable' | 'terrible'): void {
    switch (preset) {
      case 'perfect':
        OfflineSimulatorControls.setLatency(0);
        OfflineSimulatorControls.setFailureRate(0);
        OfflineSimulatorControls.setOffline(false);
        break;
      case 'slow':
        OfflineSimulatorControls.enableSlowConnection();
        break;
      case 'unreliable':
        OfflineSimulatorControls.enableUnreliableConnection();
        break;
      case 'terrible':
        OfflineSimulatorControls.enableTerribleConnection();
        break;
    }

    this.notificationService.info('Preset Applied', `Applied ${preset} connection preset`);
  }

  // Cache management
  clearCache(): void {
    this.resilientApi.clearCache();
    this.notificationService.success('Cache Cleared', 'HTTP cache has been cleared');
  }

  resetCircuitBreaker(): void {
    this.resilientApi.resetCircuitBreaker();
    this.notificationService.success('Circuit Reset', 'Circuit breaker has been reset');
  }

  // Data management
  clearStorage(): void {
    if (confirm('Are you sure you want to clear all local storage? This action cannot be undone.')) {
      try {
        localStorage.clear();
        indexedDB.deleteDatabase('crypto-vault-db');
        this.notificationService.success('Storage Cleared', 'All local data has been cleared');
        
        // Reload page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        this.notificationService.error('Clear Failed', 'Failed to clear storage');
      }
    }
  }

  exportDebugInfo(): void {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      simulatorState: this.simulatorState(),
      cacheStats: this.cacheStats(),
      circuitBreakerStats: this.circuitBreakerStats(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-info-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.notificationService.success('Debug Exported', 'Debug information has been exported');
  }

  // Utility methods
  getConnectionStatusClass(): string {
    const state = this.simulatorState();
    if (state.offline) return 'offline';
    if (state.latency > 1000 || state.failureRate > 0.1) return 'slow';
    return 'online';
  }

  getConnectionStatusText(): string {
    const state = this.simulatorState();
    if (state.offline) return 'OFFLINE';
    if (state.latency > 1000 || state.failureRate > 0.1) return 'SLOW';
    return 'ONLINE';
  }

  getStatusIndicatorClass(): string {
    const status = this.getConnectionStatusClass();
    return status === 'offline' ? 'offline' : status === 'slow' ? 'slow' : '';
  }

  getStatusText(): string {
    return this.getConnectionStatusText();
  }

  getCircuitBreakerClass(): string {
    const state = this.circuitBreakerStats().state;
    return `circuit-breaker-class ${state}`;
  }
}
