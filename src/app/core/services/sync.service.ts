import { Injectable, signal, computed, inject } from '@angular/core';
import { OfflineService } from './offline.service';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';
import { IndexedDbService } from '../../../infrastructure/persistence/indexed-db.service';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'transaction' | 'watchlist' | 'setting' | 'analytics';
  data: any;
  timestamp: number;
  retryCount: number;
  lastRetry: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  error?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncTime: number;
  syncInProgress: boolean;
}

export interface ConflictResolution {
  strategy: 'last-write-wins' | 'manual' | 'merge';
  resolution?: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private offlineService = inject(OfflineService);
  private loggerService = inject(LoggerService);
  private notificationService = inject(NotificationService);
  private indexedDbService = inject(IndexedDbService);
  
  private syncQueue = signal<SyncOperation[]>([]);
  private syncStatus = signal<SyncStatus>({
    isOnline: false,
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
    lastSyncTime: 0,
    syncInProgress: false
  });
  
  private syncInterval: number | null = null;
  private backgroundSyncSupported = false;
  private isProcessing = signal(false);
  
  // Conflict resolution strategy
  private conflictStrategy: ConflictResolution['strategy'] = 'last-write-wins';

  constructor() {
    this.initializeSync();
  }

  private async initializeSync(): Promise<void> {
    // Check for Background Sync API support
    this.backgroundSyncSupported = 'serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as any);
    
    // Load sync queue from storage
    await this.loadSyncQueue();
    
    // Set up online/offline event listeners
    this.setupNetworkListeners();
    
    // Start periodic sync checks
    this.startPeriodicSync();
    
    // Register background sync if supported
    if (this.backgroundSyncSupported) {
      this.registerBackgroundSync();
    }
    
    this.loggerService.info('Sync service initialized', {
      backgroundSyncSupported: this.backgroundSyncSupported,
      queueSize: this.syncQueue().length
    }, 'sync');
  }

  private setupNetworkListeners(): void {
    this.offlineService.onConnectionStatusChange().subscribe(status => {
      this.syncStatus.update(current => ({
        ...current,
        isOnline: status.isOnline
      }));
      
      if (status.isOnline && this.syncQueue().length > 0) {
        this.loggerService.info('Connection restored, starting sync', {
          pendingOperations: this.syncQueue().length
        }, 'sync');
        
        // Start sync after a short delay to ensure stable connection
        setTimeout(() => this.startSync(), 1000);
      }
    });
  }

  private startPeriodicSync(): void {
    // Check for pending operations every 30 seconds when online
    this.syncInterval = window.setInterval(() => {
      if (this.syncStatus().isOnline && !this.isProcessing() && this.syncQueue().length > 0) {
        this.startSync();
      }
    }, 30000);
  }

  private async registerBackgroundSync(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        // Register for background sync
        await (registration as any).sync.register('crypto-vault-sync');
        this.loggerService.info('Background sync registered', {}, 'sync');
      }
    } catch (error) {
      this.loggerService.warn('Failed to register background sync', error, 'sync');
    }
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const savedQueue = await this.indexedDbService.getSetting('sync-queue');
      if (savedQueue) {
        this.syncQueue.set(savedQueue);
        this.updateSyncStatus();
      }
    } catch (error) {
      this.loggerService.error('Failed to load sync queue', error, 'sync');
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await this.indexedDbService.setSetting('sync-queue', this.syncQueue());
    } catch (error) {
      this.loggerService.error('Failed to save sync queue', error, 'sync');
    }
  }

  // Public API methods
  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'lastRetry' | 'status'>): Promise<string> {
    const syncOperation: SyncOperation = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: Date.now(),
      retryCount: 0,
      lastRetry: 0,
      status: 'pending'
    };

    this.syncQueue.update(current => [...current, syncOperation]);
    await this.saveSyncQueue();
    this.updateSyncStatus();

    this.loggerService.info('Operation queued for sync', {
      operationId: syncOperation.id,
      type: operation.type,
      entity: operation.entity
    }, 'sync');

    // Try to sync immediately if online
    if (this.syncStatus().isOnline && !this.isProcessing()) {
      setTimeout(() => this.startSync(), 100);
    }

    return syncOperation.id;
  }

  async startSync(): Promise<void> {
    if (this.isProcessing() || !this.syncStatus().isOnline) {
      return;
    }

    this.isProcessing.set(true);
    this.syncStatus.update(current => ({
      ...current,
      isSyncing: true,
      syncInProgress: true
    }));

    try {
      const pendingOperations = this.syncQueue().filter(op => op.status === 'pending' || op.status === 'failed');
      
      if (pendingOperations.length === 0) {
        this.loggerService.info('No operations to sync', {}, 'sync');
        return;
      }

      this.loggerService.info('Starting sync process', {
        operationsCount: pendingOperations.length
      }, 'sync');

      // Process operations in order
      for (const operation of pendingOperations) {
        await this.processOperation(operation);
        
        // Small delay between operations to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.syncStatus.update(current => ({
        ...current,
        lastSyncTime: Date.now()
      }));

      this.notificationService.success('Sync Complete', `Successfully synced ${pendingOperations.length} operations`);
      
    } catch (error) {
      this.loggerService.error('Sync process failed', error, 'sync');
      this.notificationService.error('Sync Failed', 'Some operations could not be synced');
    } finally {
      this.isProcessing.set(false);
      this.syncStatus.update(current => ({
        ...current,
        isSyncing: false,
        syncInProgress: false
      }));
    }
  }

  private async processOperation(operation: SyncOperation): Promise<void> {
    // Update operation status to syncing
    this.updateOperationStatus(operation.id, 'syncing');

    try {
      await this.executeOperation(operation);
      
      // Operation successful - remove from queue
      this.removeOperation(operation.id);
      
      this.loggerService.info('Operation synced successfully', {
        operationId: operation.id,
        type: operation.type,
        entity: operation.entity
      }, 'sync');
      
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Update operation with error info
      this.updateOperation(operation.id, {
        status: 'failed',
        error: errorMessage,
        retryCount: operation.retryCount + 1,
        lastRetry: Date.now()
      });

      this.loggerService.error('Operation sync failed', {
        operationId: operation.id,
        error: errorMessage,
        retryCount: operation.retryCount + 1
      }, 'sync');

      // Check if we should retry
      if (this.shouldRetry(operation)) {
        this.scheduleRetry(operation);
      } else {
        this.loggerService.error('Operation failed permanently', {
          operationId: operation.id,
          retryCount: operation.retryCount
        }, 'sync');
      }
    }
  }

  private async executeOperation(operation: SyncOperation): Promise<void> {
    // This would make the actual API call to sync the operation
    // For now, we'll simulate it with a timeout and random success/failure
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Simulate 90% success rate
    if (Math.random() > 0.1) {
      // Success - in real app, this would be the API call
      return;
    } else {
      // Failure
      throw new Error('Simulated API failure');
    }
  }

  private shouldRetry(operation: SyncOperation): boolean {
    const maxRetries = 3;
    const retryDelay = this.getRetryDelay(operation.retryCount);
    const timeSinceLastRetry = Date.now() - operation.lastRetry;
    
    return operation.retryCount < maxRetries && timeSinceLastRetry >= retryDelay;
  }

  private getRetryDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.pow(2, retryCount) * 1000;
  }

  private scheduleRetry(operation: SyncOperation): void {
    const retryDelay = this.getRetryDelay(operation.retryCount);
    
    setTimeout(() => {
      if (this.syncStatus().isOnline && !this.isProcessing()) {
        this.processOperation(operation);
      }
    }, retryDelay);
  }

  private updateOperationStatus(operationId: string, status: SyncOperation['status']): void {
    this.syncQueue.update(current => 
      current.map(op => 
        op.id === operationId ? { ...op, status } : op
      )
    );
    this.saveSyncQueue();
    this.updateSyncStatus();
  }

  private updateOperation(operationId: string, updates: Partial<SyncOperation>): void {
    this.syncQueue.update(current => 
      current.map(op => 
        op.id === operationId ? { ...op, ...updates } : op
      )
    );
    this.saveSyncQueue();
    this.updateSyncStatus();
  }

  private removeOperation(operationId: string): void {
    this.syncQueue.update(current => current.filter(op => op.id !== operationId));
    this.saveSyncQueue();
    this.updateSyncStatus();
  }

  private updateSyncStatus(): void {
    const queue = this.syncQueue();
    const pendingCount = queue.filter(op => op.status === 'pending').length;
    const failedCount = queue.filter(op => op.status === 'failed').length;
    
    this.syncStatus.update(current => ({
      ...current,
      pendingCount,
      failedCount
    }));
  }

  private generateOperationId(): string {
    return `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Conflict resolution methods
  async resolveConflict(operationId: string, resolution: any): Promise<void> {
    const operation = this.syncQueue().find(op => op.id === operationId);
    if (!operation) {
      throw new Error('Operation not found');
    }

    // Apply the resolution
    operation.data = resolution;
    operation.status = 'pending';
    operation.retryCount = 0;
    operation.lastRetry = 0;
    operation.error = undefined;

    this.updateOperation(operationId, operation);
    
    this.loggerService.info('Conflict resolved', {
      operationId,
      resolution
    }, 'sync');

    // Try to sync again
    if (this.syncStatus().isOnline && !this.isProcessing()) {
      setTimeout(() => this.startSync(), 100);
    }
  }

  setConflictStrategy(strategy: ConflictResolution['strategy']): void {
    this.conflictStrategy = strategy;
    this.loggerService.info('Conflict strategy changed', { strategy }, 'sync');
  }

  // Analytics methods
  async trackOfflineEvent(event: string, data?: any): Promise<void> {
    const analyticsOperation = {
      type: 'create' as const,
      entity: 'analytics' as const,
      data: {
        event,
        data,
        timestamp: Date.now(),
        sessionId: this.getSessionId()
      }
    };

    await this.queueOperation(analyticsOperation);
  }

  private getSessionId(): string {
    // Get or create session ID from localStorage
    let sessionId = localStorage.getItem('session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('session-id', sessionId);
    }
    return sessionId;
  }

  // Public getters
  getSyncStatus(): SyncStatus {
    return this.syncStatus();
  }

  getSyncQueue(): SyncOperation[] {
    return this.syncQueue();
  }

  getPendingOperations(): SyncOperation[] {
    return this.syncQueue().filter(op => op.status === 'pending');
  }

  getFailedOperations(): SyncOperation[] {
    return this.syncQueue().filter(op => op.status === 'failed');
  }

  isProcessingSync(): boolean {
    return this.isProcessing();
  }

  // Manual sync controls
  async retryFailedOperations(): Promise<void> {
    const failedOperations = this.getFailedOperations();
    
    for (const operation of failedOperations) {
      this.updateOperation(operation.id, {
        status: 'pending',
        retryCount: 0,
        lastRetry: 0,
        error: undefined
      });
    }
    
    await this.startSync();
  }

  async clearFailedOperations(): Promise<void> {
    const failedOperationIds = this.getFailedOperations().map(op => op.id);
    
    for (const id of failedOperationIds) {
      this.removeOperation(id);
    }
    
    this.loggerService.info('Cleared failed operations', {
      count: failedOperationIds.length
    }, 'sync');
  }

  async clearAllOperations(): Promise<void> {
    this.syncQueue.set([]);
    await this.saveSyncQueue();
    this.updateSyncStatus();
    
    this.loggerService.info('Cleared all sync operations', {}, 'sync');
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}
