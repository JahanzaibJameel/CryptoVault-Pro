import { Injectable, signal, computed } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
  timestamp: number;
  read: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  position: NotificationPosition;
  maxVisible: number;
  defaultDuration: number;
  enableSounds: boolean;
  enableBrowserNotifications: boolean;
  showProgress: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = signal<Notification[]>([]);
  private settings = signal<NotificationSettings>({
    enabled: true,
    position: 'top-right',
    maxVisible: 5,
    defaultDuration: 5000,
    enableSounds: true,
    enableBrowserNotifications: true,
    showProgress: true
  });

  private notificationSubject = new Subject<Notification>();
  private clearSubject = new Subject<string>();
  private clearAllSubject = new Subject<void>();

  // Computed properties
  public visibleNotifications = computed(() => 
    this.notifications()
      .filter(n => !n.read)
      .slice(0, this.settings().maxVisible)
  );

  public unreadCount = computed(() => 
    this.notifications().filter(n => !n.read).length
  );

  public hasUnread = computed(() => this.unreadCount() > 0);

  // Observable streams
  public notification$ = this.notificationSubject.asObservable();
  public clear$ = this.clearSubject.asObservable();
  public clearAll$ = this.clearAllSubject.asObservable();

  constructor() {
    this.initializeBrowserNotifications();
  }

  private initializeBrowserNotifications(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      // Request permission on user interaction
      document.addEventListener('click', () => {
        this.requestBrowserNotificationPermission();
      }, { once: true });
    }
  }

  private async requestBrowserNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.warn('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  // Public API methods
  public show(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string {
    if (!this.settings().enabled) return '';

    const id = this.generateId();
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      read: false,
      duration: notification.duration ?? this.settings().defaultDuration
    };

    // Add to notifications list
    this.notifications.update(current => [...current, fullNotification]);

    // Emit notification event
    this.notificationSubject.next(fullNotification);

    // Show browser notification if enabled
    if (this.settings().enableBrowserNotifications) {
      this.showBrowserNotification(fullNotification);
    }

    // Play sound if enabled
    if (this.settings().enableSounds) {
      this.playNotificationSound(fullNotification.type);
    }

    // Auto-dismiss if not persistent
    if (!fullNotification.persistent && fullNotification.duration && fullNotification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, fullNotification.duration);
    }

    return id;
  }

  public success(title: string, message?: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'success',
      title,
      message,
      ...options
    });
  }

  public error(title: string, message?: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'error',
      title,
      message,
      persistent: true,
      duration: 0,
      ...options
    });
  }

  public warning(title: string, message?: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'warning',
      title,
      message,
      ...options
    });
  }

  public info(title: string, message?: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'info',
      title,
      message,
      ...options
    });
  }

  public dismiss(id: string): void {
    this.notifications.update(current => 
      current.map(n => n.id === id ? { ...n, read: true } : n)
    );
    this.clearSubject.next(id);
  }

  public dismissAll(): void {
    this.notifications.update(current => 
      current.map(n => ({ ...n, read: true }))
    );
    this.clearAllSubject.next();
  }

  public markAsRead(id: string): void {
    this.notifications.update(current => 
      current.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  public markAllAsRead(): void {
    this.notifications.update(current => 
      current.map(n => ({ ...n, read: true }))
    );
  }

  public remove(id: string): void {
    this.notifications.update(current => current.filter(n => n.id !== id));
  }

  public clear(): void {
    this.notifications.set([]);
  }

  // Settings management
  public updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings.update(current => ({ ...current, ...newSettings }));
  }

  public getSettings(): NotificationSettings {
    return this.settings();
  }

  // Notification history
  public getHistory(): Notification[] {
    return this.notifications().sort((a, b) => b.timestamp - a.timestamp);
  }

  public getUnread(): Notification[] {
    return this.notifications().filter(n => !n.read);
  }

  public getByType(type: NotificationType): Notification[] {
    return this.notifications().filter(n => n.type === type);
  }

  // Private helper methods
  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: this.getIconForType(notification.type),
        badge: '/assets/icons/badge.png',
        tag: notification.id,
        requireInteraction: notification.persistent,
        silent: !this.settings().enableSounds
      });

      if (notification.action) {
        browserNotification.onclick = () => {
          notification.action?.handler();
          browserNotification.close();
        };
      }

      // Auto-close browser notification
      if (!notification.persistent && notification.duration && notification.duration > 0) {
        setTimeout(() => {
          browserNotification.close();
        }, notification.duration);
      }
    } catch (error) {
      console.warn('Failed to show browser notification:', error);
    }
  }

  private getIconForType(type: NotificationType): string {
    const icons = {
      success: '/assets/icons/success.png',
      error: '/assets/icons/error.png',
      warning: '/assets/icons/warning.png',
      info: '/assets/icons/info.png'
    };
    return icons[type] || icons.info;
  }

  private playNotificationSound(type: NotificationType): void {
    if (!this.settings().enableSounds) return;

    try {
      const audio = new Audio();
      audio.src = this.getSoundForType(type);
      audio.volume = 0.3;
      audio.play().catch(error => {
        // Silently fail if audio playback is blocked
        console.debug('Audio playback failed:', error);
      });
    } catch (error) {
      console.debug('Failed to play notification sound:', error);
    }
  }

  private getSoundForType(type: NotificationType): string {
    const sounds = {
      success: '/assets/sounds/success.mp3',
      error: '/assets/sounds/error.mp3',
      warning: '/assets/sounds/warning.mp3',
      info: '/assets/sounds/info.mp3'
    };
    return sounds[type] || sounds.info;
  }

  // Batch operations
  public showBatch(notifications: Omit<Notification, 'id' | 'timestamp' | 'read'>[]): string[] {
    return notifications.map(notification => this.show(notification));
  }

  public dismissByType(type: NotificationType): void {
    this.notifications.update(current => 
      current.map(n => n.type === type ? { ...n, read: true } : n)
    );
  }

  public dismissOlderThan(ageMs: number): void {
    const cutoff = Date.now() - ageMs;
    this.notifications.update(current => 
      current.map(n => n.timestamp < cutoff ? { ...n, read: true } : n)
    );
  }

  // Statistics
  public getStats(): {
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    averageAge: number;
  } {
    const notifications = this.notifications();
    const now = Date.now();
    
    const byType = {
      success: notifications.filter(n => n.type === 'success').length,
      error: notifications.filter(n => n.type === 'error').length,
      warning: notifications.filter(n => n.type === 'warning').length,
      info: notifications.filter(n => n.type === 'info').length
    };

    const averageAge = notifications.length > 0
      ? notifications.reduce((sum, n) => sum + (now - n.timestamp), 0) / notifications.length
      : 0;

    return {
      total: notifications.length,
      unread: this.unreadCount(),
      byType,
      averageAge
    };
  }
}
