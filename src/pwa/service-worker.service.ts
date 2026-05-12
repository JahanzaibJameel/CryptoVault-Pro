import { Injectable, signal, computed, inject } from '@angular/core';
import { LoggerService } from '../app/core/services/logger.service';

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  renotify?: boolean;
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
  timestamp?: number;
}

export interface BackgroundSyncData {
  tag: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceWorkerService {
  private loggerService = inject(LoggerService);
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  // Signals for reactive state
  private isSupported = signal(false);
  private isOnline = signal(navigator.onLine);
  private pushPermission = signal<'default' | 'granted' | 'denied'>('default');
  private backgroundSyncSupported = signal(false);
  private notificationPermission = signal<'default' | 'granted' | 'denied'>('default');

  // Computed properties
  public swStatus = computed(() => ({
    supported: this.isSupported(),
    registered: !!this.registration,
    active: !!this.registration?.active,
    controlling: !!navigator.serviceWorker?.controller,
    online: this.isOnline(),
    pushEnabled: this.pushPermission() === 'granted',
    notificationEnabled: this.notificationPermission() === 'granted',
    backgroundSyncEnabled: this.backgroundSyncSupported()
  }));

  constructor() {
    this.initializeServiceWorker();
    this.setupEventListeners();
    this.checkCapabilities();
  }

  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'all'
        });

        this.registration.addEventListener('updatefound', this.handleUpdateFound);
        this.registration.addEventListener('updated', this.handleUpdate);
        this.registration.addEventListener('controllerchange', this.handleControllerChange);

        this.isSupported.set(true);
        this.loggerService.info('Service Worker registered successfully', {
          scope: this.registration.scope,
          updateViaCache: 'all'
        });

        // Check for updates
        this.checkForUpdates();
      } catch (error) {
        this.loggerService.error('Failed to register Service Worker', error);
      }
    } else {
      this.loggerService.warn('Service Worker not supported');
    }
  }

  private setupEventListeners(): void {
    // Network status monitoring
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.loggerService.info('Network status: online');
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      this.loggerService.info('Network status: offline');
    });

    // Page visibility for background sync
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.registration?.active) {
        this.loggerService.debug('Page hidden, background sync available');
      }
    });
  }

  private checkCapabilities(): void {
    // Check push notification support
    if ('PushManager' in window) {
      navigator.serviceWorker?.ready?.then(registration => {
        registration.pushManager?.getSubscription().then(subscription => {
          this.pushPermission.set(subscription ? 'granted' : 'default');
        });
      });
    }

    // Check notification permission
    if ('Notification' in window) {
      this.notificationPermission.set(Notification.permission as any);
    }

    // Check background sync support
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      this.backgroundSyncSupported.set(true);
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      if (!this.registration) {
        throw new Error('Service Worker not registered');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        this.pushPermission.set('denied');
        throw new Error('Push notification permission denied');
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: await this.getVAPIDPublicKey()
      });

      this.subscription = subscription;
      this.pushPermission.set('granted');

      this.loggerService.info('Push subscription created', {
        endpoint: subscription.endpoint,
        keys: subscription.toJSON()?.keys
      });

      return subscription;
    } catch (error) {
      this.loggerService.error('Failed to subscribe to push notifications', error);
      throw error;
    }
  }

  async unsubscribeFromPush(): Promise<void> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        this.subscription = null;
        this.pushPermission.set('default');

        this.loggerService.info('Unsubscribed from push notifications');
      }
    } catch (error) {
      this.loggerService.error('Failed to unsubscribe from push notifications', error);
      throw error;
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    try {
      const permission = await Notification.requestPermission();
      this.notificationPermission.set(permission as any);
      return permission as NotificationPermission;
    } catch (error) {
      this.loggerService.error('Failed to request notification permission', error);
      throw error;
    }
  }

  async showLocalNotification(notification: PushNotification): Promise<Notification> {
    try {
      const permission = await this.requestNotificationPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const notificationInstance = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/assets/icons/icon-192x192.png',
        badge: notification.badge,
        // image: notification.image, // Removed as not supported in NotificationOptions
        data: notification.data,
        tag: notification.tag,
        requireInteraction: notification.requireInteraction,
        silent: notification.silent,
        // vibrate: notification.vibrate, // Removed as not supported in NotificationOptions
        // renotify: notification.renotify, // Removed as not supported in NotificationOptions
        dir: notification.dir,
        lang: notification.lang,
        // actions: notification.actions // Removed as not supported in NotificationOptions
      });

      this.loggerService.info('Local notification shown', {
        title: notification.title,
        tag: notification.tag
      });

      return notificationInstance;
    } catch (error) {
      this.loggerService.error('Failed to show local notification', error);
      throw error;
    }
  }

  async registerBackgroundSync(tag: string, syncData: BackgroundSyncData): Promise<void> {
    try {
      if (!(this.registration as any)?.sync) {
        throw new Error('Background sync not supported');
      }

      const registration = await (this.registration as any).sync.register(tag, {
        tag,
        url: syncData.url,
        method: syncData.method || 'GET',
        headers: syncData.headers,
        body: syncData.body
      });

      this.loggerService.info('Background sync registered', {
        tag,
        url: syncData.url,
        method: syncData.method
      });

      return registration;
    } catch (error) {
      this.loggerService.error('Failed to register background sync', error);
      throw error;
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    return this.subscription;
  }

  private async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      this.loggerService.info('Service Worker update checked');
    } catch (error) {
      this.loggerService.error('Failed to check for Service Worker updates', error);
    }
  }

  private async getVAPIDPublicKey(): Promise<string> {
    // In production, this would fetch from your server
    // For demo purposes, returning a mock key
    return 'BMvKDQ_xJ8cJ0kOYrD2sOo0s2r3t4K3w9cXqY';
  }

  // Cache management
  async clearCache(): Promise<void> {
    if (this.registration?.active) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );

      this.loggerService.info('All caches cleared', { cacheNames });
    }
  }

  async preloadCriticalAssets(): Promise<void> {
    if (!this.registration?.active) return;

    try {
      const cache = await caches.open('precache-v1');
      const criticalAssets = [
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/assets/icons/icon-192x192.png',
        '/assets/icons/icon-512x512.png'
      ];

      await Promise.all(
        criticalAssets.map(asset => 
          cache.add(new Request(asset, { cache: 'force-cache' }))
        )
      );

      this.loggerService.info('Critical assets precached', { assets: criticalAssets.length });
    } catch (error) {
      this.loggerService.error('Failed to preload critical assets', error);
    }
  }

  // Performance monitoring
  getPerformanceMetrics(): {
    registrationTime: number | null;
    updateAvailable: boolean;
    cacheSize: number | null;
  } {
    return {
      registrationTime: (this.registration as any)?.installationTime || null,
      updateAvailable: !!this.registration?.waiting,
      cacheSize: null // Would need to implement cache size calculation
    };
  }

  // Update management
  async forceUpdate(): Promise<void> {
    if (!this.registration?.waiting) {
      this.loggerService.warn('No update available to force');
      return;
    }

    try {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      this.loggerService.info('Forced Service Worker update');
    } catch (error) {
      this.loggerService.error('Failed to force Service Worker update', error);
    }
  }

  private handleUpdateFound = (event: Event): void => {
    this.loggerService.info('Service Worker update found', {
      installing: !!(event as any).isInstalling,
      waiting: !!(event as any).isWaiting
    });
  };

  private handleUpdate = (event: Event): void => {
    this.loggerService.info('Service Worker updated', {
      wasWaiting: !!(event as any).wasWaiting,
      wasInstalling: !!(event as any).wasInstalling
    });

    // Show update notification to user
    this.showUpdateNotification();
  };

  private handleControllerChange = (event: Event): void => {
    this.loggerService.info('Service Worker controller changed', {
      isActive: !!(event as any).isActive
    });
  };

  private async showUpdateNotification(): Promise<void> {
    try {
      await this.showLocalNotification({
        title: 'CryptoVault Pro Update Available',
        body: 'A new version of CryptoVault Pro is available. Click to update.',
        icon: '/assets/icons/update.png',
        tag: 'app-update',
        requireInteraction: true,
        actions: [
          {
            action: 'update',
            title: 'Update Now',
            icon: '/assets/icons/download.png'
          },
          {
            action: 'dismiss',
            title: 'Later',
            icon: '/assets/icons/dismiss.png'
          }
        ]
      });
    } catch (error) {
      this.loggerService.error('Failed to show update notification', error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.registration) {
      this.registration.removeEventListener('updatefound', this.handleUpdateFound);
      this.registration.removeEventListener('updated', this.handleUpdate);
      this.registration.removeEventListener('controllerchange', this.handleControllerChange);
    }
  }
}
