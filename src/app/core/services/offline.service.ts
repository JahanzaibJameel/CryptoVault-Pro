import { Injectable, signal, computed } from '@angular/core';
import { fromEvent, merge, of } from 'rxjs';
import { map, distinctUntilChanged, startWith } from 'rxjs/operators';

interface NetworkConnection {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (event: string, listener: () => void) => void;
  removeEventListener?: (event: string, listener: () => void) => void;
}

export type ConnectionStatus = 'online' | 'offline' | 'slow';
export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor';

@Injectable({
  providedIn: 'root',
})
export class OfflineService {
  private isOnline = signal(navigator.onLine);
  private connectionType = signal('unknown');
  private effectiveType = signal<ConnectionQuality>('good');
  private downlink = signal(0);
  private rtt = signal(0);
  private saveData = signal(false);

  // Computed properties
  public connectionStatus = computed((): ConnectionStatus => {
    if (!this.isOnline()) return 'offline';
    if (this.effectiveType() === 'poor' || this.downlink() < 0.5) return 'slow';
    return 'online';
  });

  public isSlowConnection = computed(() => this.connectionStatus() === 'slow');

  public shouldUseOfflineMode = computed(
    () => this.connectionStatus() === 'offline' || this.isSlowConnection(),
  );

  public connectionInfo = computed(() => ({
    status: this.connectionStatus(),
    type: this.connectionType(),
    effectiveType: this.effectiveType(),
    downlink: this.downlink(),
    rtt: this.rtt(),
    saveData: this.saveData(),
    isOnline: this.isOnline(),
    isSlow: this.isSlowConnection(),
    shouldUseOfflineMode: this.shouldUseOfflineMode(),
  }));

  constructor() {
    this.initializeConnectionMonitoring();
    this.setupNetworkListeners();
  }

  private initializeConnectionMonitoring(): void {
    // Check for Network Information API support
    if ('connection' in navigator) {
      const connection = (navigator as unknown as { connection: NetworkConnection }).connection;

      this.updateConnectionInfo(connection);

      // Listen for connection changes
      fromEvent(connection as EventTarget, 'change').subscribe(() => {
        this.updateConnectionInfo(connection);
      });
    }
  }

  private updateConnectionInfo(connection: NetworkConnection): void {
    if (!connection) return;

    this.connectionType.set(connection.type || 'unknown');
    this.effectiveType.set(this.mapEffectiveType(connection.effectiveType || 'unknown'));
    this.downlink.set(connection.downlink || 0);
    this.rtt.set(connection.rtt || 0);
    this.saveData.set(connection.saveData || false);
  }

  private mapEffectiveType(effectiveType: string): ConnectionQuality {
    switch (effectiveType) {
      case '4g':
        return 'excellent';
      case '3g':
        return 'good';
      case '2g':
        return 'fair';
      case 'slow-2g':
        return 'poor';
      default:
        return 'good';
    }
  }

  private setupNetworkListeners(): void {
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    merge(online$, offline$, of(navigator.onLine))
      .pipe(startWith(navigator.onLine), distinctUntilChanged())
      .subscribe((isOnline) => {
        this.isOnline.set(isOnline);
        this.notifyConnectionChange();
      });
  }

  private notifyConnectionChange(): void {
    const status = this.connectionStatus();

    // Dispatch custom event for other components to listen to
    window.dispatchEvent(
      new CustomEvent('connection-status-change', {
        detail: this.connectionInfo(),
      }),
    );

    // Show browser notification if supported and permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const message =
        status === 'offline'
          ? 'You are now offline. Some features may be limited.'
          : status === 'slow'
            ? 'Connection is slow. Using offline mode for better performance.'
            : 'You are back online.';

      new Notification('Connection Status', {
        body: message,
      });
    }
  }

  // Public API methods
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus();
  }

  public isCurrentlyOnline(): boolean {
    return this.isOnline();
  }

  public getConnectionQuality(): ConnectionQuality {
    return this.effectiveType();
  }

  public getDownlinkSpeed(): number {
    return this.downlink();
  }

  public getRTT(): number {
    return this.rtt();
  }

  public isDataSaverMode(): boolean {
    return this.saveData();
  }

  // Connection testing
  public async testConnection(url = 'https://api.coingecko.com/api/v3/ping'): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  public async measureConnectionSpeed(): Promise<{ downloadSpeed: number; uploadSpeed: number }> {
    const testData = new ArrayBuffer(1024 * 1024); // 1MB test data

    try {
      // Measure download speed
      const downloadStart = performance.now();
      const response = await fetch('https://httpbin.org/bytes/1048576', {
        method: 'GET',
        cache: 'no-cache',
      });
      await response.arrayBuffer();
      const downloadEnd = performance.now();

      const downloadTime = (downloadEnd - downloadStart) / 1000; // seconds
      const downloadSpeed = (1024 * 1024 * 8) / downloadTime; // bits per second

      // Measure upload speed (simplified)
      const uploadStart = performance.now();
      await fetch('https://httpbin.org/post', {
        method: 'POST',
        body: testData,
        cache: 'no-cache',
      });
      const uploadEnd = performance.now();

      const uploadTime = (uploadEnd - uploadStart) / 1000; // seconds
      const uploadSpeed = (1024 * 1024 * 8) / uploadTime; // bits per second

      return {
        downloadSpeed: downloadSpeed / 1000000, // Mbps
        uploadSpeed: uploadSpeed / 1000000, // Mbps
      };
    } catch {
      return {
        downloadSpeed: 0,
        uploadSpeed: 0,
      };
    }
  }

  // Request notification permission
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  // Observable for connection status changes
  public onConnectionStatusChange() {
    return fromEvent(window, 'connection-status-change').pipe(
      map((event: Event) => (event as CustomEvent).detail),
    );
  }

  // Utility methods
  public shouldRetryRequest(failureCount: number, maxRetries = 3): boolean {
    if (failureCount >= maxRetries) return false;

    // Don't retry if offline
    if (!this.isOnline()) return false;

    // Limit retries on slow connections
    if (this.isSlowConnection() && failureCount >= 1) return false;

    return true;
  }

  public getRetryDelay(failureCount: number, baseDelay = 1000): number {
    // Exponential backoff with jitter
    const delay = baseDelay * Math.pow(2, failureCount);
    const jitter = Math.random() * 0.1 * delay;

    // Cap at 30 seconds
    return Math.min(delay + jitter, 30000);
  }

  public shouldUseCache(): boolean {
    return this.shouldUseOfflineMode();
  }

  public getCacheMaxAge(): number {
    const status = this.connectionStatus();

    switch (status) {
      case 'offline':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'slow':
        return 60 * 60 * 1000; // 1 hour
      default:
        return 5 * 60 * 1000; // 5 minutes
    }
  }
}
