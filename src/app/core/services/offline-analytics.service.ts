import { Injectable, signal, inject } from '@angular/core';
import { SyncService } from './sync.service';
import { IndexedDbService } from '../../../infrastructure/persistence/indexed-db.service';
import { LoggerService } from './logger.service';

export interface AnalyticsEvent {
  id: string;
  type: string;
  category: string;
  action: string;
  data?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  synced: boolean;
}

export interface UserSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  pageViews: number;
  events: number;
  startUrl: string;
  endUrl?: string;
  deviceInfo: Record<string, any>;
}

export interface AnalyticsSummary {
  totalEvents: number;
  totalSessions: number;
  averageSessionDuration: number;
  topPages: Array<{ url: string; views: number }>;
  topEvents: Array<{ type: string; count: number }>;
  recentActivity: AnalyticsEvent[];
}

@Injectable({
  providedIn: 'root'
})
export class OfflineAnalyticsService {
  private syncService = inject(SyncService);
  private indexedDbService = inject(IndexedDbService);
  private loggerService = inject(LoggerService);
  
  private events = signal<AnalyticsEvent[]>([]);
  private currentSession = signal<UserSession | null>(null);
  private isInitialized = signal(false);

  constructor() {
    this.initializeAnalytics();
  }

  private async initializeAnalytics(): Promise<void> {
    try {
      // Load stored events
      await this.loadStoredEvents();
      
      // Start current session
      this.startSession();
      
      // Track page views
      this.setupPageViewTracking();
      
      // Setup periodic cleanup
      this.setupPeriodicCleanup();
      
      this.isInitialized.set(true);
      this.loggerService.info('Analytics service initialized', {
        storedEvents: this.events().length
      }, 'analytics');
      
    } catch (error) {
      this.loggerService.error('Failed to initialize analytics', error, 'analytics');
    }
  }

  private async loadStoredEvents(): Promise<void> {
    try {
      const storedEvents = await this.indexedDbService.getSetting('analytics-events');
      if (storedEvents) {
        this.events.set(storedEvents);
      }
    } catch (error) {
      this.loggerService.warn('Failed to load stored events', error, 'analytics');
    }
  }

  private async saveEvents(): Promise<void> {
    try {
      await this.indexedDbService.saveSetting('analytics-events', this.events());
    } catch (error) {
      this.loggerService.error('Failed to save events', error, 'analytics');
    }
  }

  private startSession(): void {
    const sessionId = this.generateSessionId();
    const session: UserSession = {
      id: sessionId,
      startTime: Date.now(),
      pageViews: 0,
      events: 0,
      startUrl: window.location.pathname,
      deviceInfo: this.getDeviceInfo()
    };

    this.currentSession.set(session);
    this.loggerService.info('Session started', { sessionId }, 'analytics');
  }

  private setupPageViewTracking(): void {
    // Track initial page view
    this.trackPageView(window.location.pathname);
    
    // Listen for navigation changes (simplified - in real app would use router events)
    let lastUrl = window.location.pathname;
    setInterval(() => {
      const currentUrl = window.location.pathname;
      if (currentUrl !== lastUrl) {
        this.trackPageView(currentUrl);
        lastUrl = currentUrl;
      }
    }, 1000);
  }

  private setupPeriodicCleanup(): void {
    // Clean up old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
  }

  private getDeviceInfo(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink
      } : null
    };
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  trackEvent(category: string, action: string, data?: Record<string, any>): void {
    if (!this.isInitialized()) return;
    
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      type: 'custom',
      category,
      action,
      data,
      timestamp: Date.now(),
      sessionId: this.currentSession()?.id || 'unknown',
      synced: false
    };

    this.addEvent(event);
    
    // Update session event count
    this.currentSession.update(session => 
      session ? { ...session, events: session.events + 1 } : null
    );
  }

  trackPageView(url: string): void {
    if (!this.isInitialized()) return;
    
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      type: 'page_view',
      category: 'navigation',
      action: 'view',
      data: { url },
      timestamp: Date.now(),
      sessionId: this.currentSession()?.id || 'unknown',
      synced: false
    };

    this.addEvent(event);
    
    // Update session page view count and end URL
    this.currentSession.update(session => 
      session ? { 
        ...session, 
        pageViews: session.pageViews + 1,
        endUrl: url
      } : null
    );
  }

  trackUserAction(action: string, details?: Record<string, any>): void {
    this.trackEvent('user', action, details);
  }

  trackApiCall(endpoint: string, method: string, statusCode: number, duration: number): void {
    this.trackEvent('api', method, {
      endpoint,
      statusCode,
      duration,
      success: statusCode < 400
    });
  }

  trackError(error: Error, context?: string): void {
    this.trackEvent('error', 'occurred', {
      message: error.message,
      stack: error.stack,
      context
    });
  }

  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.trackEvent('performance', metric, {
      value,
      unit,
      timestamp: Date.now()
    });
  }

  trackFeatureUsage(feature: string, details?: Record<string, any>): void {
    this.trackEvent('feature', 'used', { feature, ...details });
  }

  private addEvent(event: AnalyticsEvent): void {
    this.events.update(current => [...current, event]);
    this.saveEvents();
    
    // Queue for sync if online
    this.syncService.trackOfflineEvent('analytics_event', event);
    
    // Mark as synced after queuing
    event.synced = true;
  }

  // Session management
  endSession(): void {
    const session = this.currentSession();
    if (!session) return;

    const endedSession: UserSession = {
      ...session,
      endTime: Date.now(),
      duration: Date.now() - session.startTime,
      endUrl: window.location.pathname
    };

    this.currentSession.set(null);
    
    // Store session data
    this.storeSession(endedSession);
    
    this.loggerService.info('Session ended', {
      sessionId: endedSession.id,
      duration: endedSession.duration,
      pageViews: endedSession.pageViews,
      events: endedSession.events
    }, 'analytics');
  }

  private async storeSession(session: UserSession): Promise<void> {
    try {
      const existingSessions = await this.indexedDbService.getSetting('analytics-sessions') || [];
      existingSessions.push(session);
      
      // Keep only last 100 sessions
      if (existingSessions.length > 100) {
        existingSessions.splice(0, existingSessions.length - 100);
      }
      
      await this.indexedDbService.saveSetting('analytics-sessions', existingSessions);
    } catch (error) {
      this.loggerService.error('Failed to store session', error, 'analytics');
    }
  }

  // Analytics and reporting
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const allEvents = this.events();
    const sessions = await this.getStoredSessions();
    
    // Calculate summary
    const totalEvents = allEvents.length;
    const totalSessions = sessions.length;
    
    const averageSessionDuration = sessions.length > 0
      ? sessions.reduce((sum, session) => sum + (session.duration || 0), 0) / sessions.length
      : 0;

    // Top pages
    const pageViews = allEvents.filter(event => event.type === 'page_view');
    const pageCounts: Record<string, number> = {};
    pageViews.forEach(event => {
      const url = event.data?.['url'] || 'unknown';
      pageCounts[url] = (pageCounts[url] || 0) + 1;
    });
    const topPages = Object.entries(pageCounts)
      .map(([url, views]) => ({ url, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Top events
    const eventCounts: Record<string, number> = {};
    allEvents.forEach(event => {
      const key = `${event.category}:${event.action}`;
      eventCounts[key] = (eventCounts[key] || 0) + 1;
    });
    const topEvents = Object.entries(eventCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent activity
    const recentActivity = allEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    return {
      totalEvents,
      totalSessions,
      averageSessionDuration,
      topPages,
      topEvents,
      recentActivity
    };
  }

  private async getStoredSessions(): Promise<UserSession[]> {
    try {
      return await this.indexedDbService.getSetting('analytics-sessions') || [];
    } catch (error) {
      this.loggerService.warn('Failed to get stored sessions', error, 'analytics');
      return [];
    }
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession();
  }

  getEvents(): AnalyticsEvent[] {
    return this.events();
  }

  getEventsByType(type: string): AnalyticsEvent[] {
    return this.events().filter(event => event.type === type);
  }

  getEventsByCategory(category: string): AnalyticsEvent[] {
    return this.events().filter(event => event.category === category);
  }

  // Data management
  async exportAnalyticsData(): Promise<string> {
    const summary = await this.getAnalyticsSummary();
    const sessions = await this.getStoredSessions();
    
    const exportData = {
      summary,
      sessions,
      events: this.events(),
      currentSession: this.currentSession(),
      exportedAt: Date.now(),
      version: '1.0.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  async clearAnalyticsData(): Promise<void> {
    this.events.set([]);
    await this.saveEvents();
    
    // Clear stored sessions
    await this.indexedDbService.saveSetting('analytics-sessions', []);
    
    this.loggerService.info('Analytics data cleared', {}, 'analytics');
  }

  private async cleanupOldData(): Promise<void> {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const cutoff = Date.now() - maxAge;
    
    // Clean old events
    const filteredEvents = this.events().filter(event => event.timestamp > cutoff);
    this.events.set(filteredEvents);
    await this.saveEvents();
    
    // Clean old sessions
    const sessions = await this.getStoredSessions();
    const filteredSessions = sessions.filter(session => session.startTime > cutoff);
    await this.indexedDbService.saveSetting('analytics-sessions', filteredSessions);
    
    this.loggerService.info('Old analytics data cleaned up', {
      removedEvents: this.events().length - filteredEvents.length,
      removedSessions: sessions.length - filteredSessions.length
    }, 'analytics');
  }

  // Health check
  checkHealth(): { healthy: boolean; checks: Record<string, boolean> } {
    const checks = {
      initialized: this.isInitialized(),
      has_current_session: !!this.currentSession(),
      events_stored: this.events().length >= 0,
      sync_service_available: !!this.syncService
    };

    return {
      healthy: Object.values(checks).every(check => check),
      checks
    };
  }

  // Lifecycle
  destroy(): void {
    this.endSession();
    this.isInitialized.set(false);
  }
}
