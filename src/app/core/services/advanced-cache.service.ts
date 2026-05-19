import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { IndexedDbService } from '../../../infrastructure/persistence/indexed-db.service';
import { LoggerService } from './logger.service';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  tags?: string[];
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  oldestEntry: number;
  newestEntry: number;
}

export enum CachePriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface CacheConfig {
  maxSize: number; // in bytes
  maxEntries: number;
  defaultTTL: number; // in seconds
  cleanupInterval: number; // in seconds
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdvancedCacheService {
  private indexedDb = inject(IndexedDbService);
  private loggerService = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

  private cache = signal<Map<string, CacheEntry<any>>>(new Map());
  private cleanupIntervalId: number | null = null;
  private stats = signal<CacheStats>({
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    evictionCount: 0,
    oldestEntry: 0,
    newestEntry: 0
  });

  private config: CacheConfig = {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxEntries: 1000,
    defaultTTL: 3600, // 1 hour
    cleanupInterval: 300, // 5 minutes
    compressionEnabled: true,
    encryptionEnabled: true
  };

  private hitCount = 0;
  private missCount = 0;

  constructor() {
    this.initializeCache();
    this.startCleanupInterval();
  }

  private async initializeCache(): Promise<void> {
    try {
      const cachedData = await this.indexedDb.getAll('cache' as any) as Record<string, any>;
      const now = Date.now();

      for (const [key, entry] of Object.entries(cachedData)) {
        if (entry.expiresAt > now) {
          await this.indexedDb.delete('cache' as any, key);
        } else {
          this.cache().set(key, entry);
          this.updateStats();
        }
      }

      this.loggerService.info('Advanced cache initialized', {
        entriesLoaded: this.cache().size,
        config: this.config
      });
    } catch (error) {
      this.loggerService.error('Failed to initialize cache', error);
    }
  }

  private startCleanupInterval(): void {
    this.cleanupIntervalId = window.setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval * 1000);
    
    // Clean up interval on service destruction
    this.destroyRef.onDestroy(() => {
      if (this.cleanupIntervalId) {
        clearInterval(this.cleanupIntervalId);
        this.loggerService.debug('Cache cleanup interval cleared');
      }
    });
  }

  async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      priority?: CachePriority;
      tags?: string[];
      compress?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const ttl = options.ttl || this.config.defaultTTL;
      const priority = options.priority || CachePriority.NORMAL;
      const shouldCompress = options.compress ?? this.config.compressionEnabled;
      const shouldEncrypt = this.config.encryptionEnabled;

      let processedData = data;
      let size = this.calculateSize(data);

      if (shouldCompress) {
        processedData = await this.compress(data);
        size = this.calculateSize(processedData);
      }

      if (shouldEncrypt) {
        processedData = await this.encrypt(processedData);
        size = this.calculateSize(processedData);
      }

      const entry: CacheEntry<T> = {
        data: processedData,
        timestamp: Date.now(),
        expiresAt: Date.now() + (ttl * 1000),
        accessCount: 0,
        lastAccessed: Date.now(),
        size,
        tags: options.tags
      };

      this.cache().set(key, entry);
      await this.indexedDb.set('cache' as any, key, entry);

      this.loggerService.debug('Cache entry added', {
        key,
        size,
        ttl,
        priority,
        tags: options.tags
      });

    } catch (error) {
      this.loggerService.error('Failed to set cache entry', { key, error });
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.cache().get(key);
      
      if (!entry) {
        const dbEntry = await this.indexedDb.get('cache' as any, key) as any;
        if (dbEntry) {
          this.cache().set(key, dbEntry);
        }
      }

      const cachedEntry = this.cache().get(key);
      
      if (!cachedEntry || cachedEntry.expiresAt < Date.now()) {
        this.missCount++;
        this.updateStats();
        
        if (cachedEntry && cachedEntry.expiresAt < Date.now()) {
          await this.indexedDb.delete('cache' as any, key);
          this.cache().delete(key);
        }

        this.loggerService.debug('Cache miss', { key });
        return null;
      }

      // Update access info
      const updatedEntry = { ...cachedEntry };
      updatedEntry.accessCount = (updatedEntry.accessCount || 0) + 1;
      updatedEntry.lastAccessed = Date.now();
      await this.indexedDb.setCache(key, updatedEntry);
      this.hitCount++;
      this.updateStats();

      let data = cachedEntry.data;
      
      // Decrypt if encrypted
      if (this.config.encryptionEnabled) {
        data = await this.decrypt(data);
      }
      
      // Decompress if compressed
      if (this.config.compressionEnabled && cachedEntry.size > 1024) {
        data = await this.decompress(data);
      }

      this.loggerService.debug('Cache hit', { 
        key, 
        accessCount: cachedEntry.accessCount,
        size: cachedEntry.size 
      });

      return data as T;

    } catch (error) {
      this.loggerService.error('Failed to get cache entry', { key, error });
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const deleted = this.cache().delete(key);
      await this.indexedDb.deleteCache(key);
      
      this.updateStats();
      this.loggerService.debug('Cache entry deleted', { key, deleted });
      
      return deleted;
    } catch (error) {
      this.loggerService.error('Failed to delete cache entry', { key, error });
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache().clear();
      await this.indexedDb.clearCache();
      
      this.resetStats();
      this.loggerService.info('Cache cleared');
    } catch (error) {
      this.loggerService.error('Failed to clear cache', error);
      throw error;
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      const keysToDelete: string[] = [];
      
      for (const [key, entry] of this.cache().entries()) {
        if (entry.tags?.includes(tag)) {
          keysToDelete.push(key);
        }
      }

      await Promise.all(keysToDelete.map(key => this.delete(key)));
      
      this.loggerService.info('Cache invalidated by tag', { tag, count: keysToDelete.length });
    } catch (error) {
      this.loggerService.error('Failed to invalidate cache by tag', { tag, error });
      throw error;
    }
  }

  async invalidateByPattern(pattern: RegExp): Promise<void> {
    try {
      const keysToDelete: string[] = [];
      
      for (const [key] of this.cache().keys()) {
        if (pattern.test(key)) {
          keysToDelete.push(key);
        }
      }

      await Promise.all(keysToDelete.map(key => this.delete(key)));
      
      this.loggerService.info('Cache invalidated by pattern', { pattern: pattern.toString(), count: keysToDelete.length });
    } catch (error) {
      this.loggerService.error('Failed to invalidate cache by pattern', { pattern, error });
      throw error;
    }
  }

  getStats(): CacheStats {
    return this.stats();
  }

  getCacheInfo(): { config: CacheConfig; entries: number; size: number } {
    const totalSize = Array.from(this.cache().values())
      .reduce((sum, entry) => sum + entry.size, 0);

    return {
      config: this.config,
      entries: this.cache().size,
      size: totalSize
    };
  }

  private updateStats(): void {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? (this.hitCount / total) * 100 : 0;
    const missRate = total > 0 ? (this.missCount / total) * 100 : 0;

    const entries = Array.from(this.cache().values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const timestamps = entries.map(entry => entry.timestamp);
    const oldestEntry = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newestEntry = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    this.stats.set({
      totalEntries: this.cache().size,
      totalSize,
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      evictionCount: this.stats().evictionCount,
      oldestEntry,
      newestEntry
    });
  }

  private resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
    this.stats.set({
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      oldestEntry: 0,
      newestEntry: 0
    });
  }

  private async cleanup(): Promise<void> {
    try {
      const now = Date.now();
      const keysToDelete: string[] = [];
      const entries = Array.from(this.cache().entries());

      // Sort by last accessed time (priority removed from interface)
      entries.sort((a, b) => {
        return a[1].lastAccessed - b[1].lastAccessed;
      });

      // Remove expired entries
      for (const [key, entry] of entries) {
        if (entry.expiresAt < now) {
          keysToDelete.push(key);
        }
      }

      // Remove old entries if over size limit
      const currentSize = entries.reduce((sum, [, entry]) => sum + entry.size, 0);
      if (currentSize > this.config.maxSize) {
        let sizeToRemove = currentSize - this.config.maxSize;
        for (const [key, entry] of entries) {
          if (sizeToRemove <= 0) break;
          if (keysToDelete.includes(key)) continue;
          
          keysToDelete.push(key);
          sizeToRemove -= entry.size;
          this.stats().evictionCount++;
        }
      }

      // Remove excess entries if over count limit
      if (this.cache().size > this.config.maxEntries) {
        let excessCount = this.cache().size - this.config.maxEntries;
        for (let i = entries.length - 1; i >= 0 && excessCount > 0; i--) {
          const [key] = entries[i];
          if (!keysToDelete.includes(key)) {
            keysToDelete.push(key);
            excessCount--;
          }
        }
      }

      await Promise.all(keysToDelete.map(key => {
        this.cache().delete(key);
        return this.indexedDb.delete('cache' as any, key);
      }));

      if (keysToDelete.length > 0) {
        this.loggerService.info('Cache cleanup completed', {
          expired: keysToDelete.length,
          totalAfterCleanup: this.cache().size
        });
      }

    } catch (error) {
      this.loggerService.error('Cache cleanup failed', error);
    }
  }

  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private async compress(data: any): Promise<any> {
    // Simplified compression - just return data for now
    return data;
  }

  private async decompress(data: any): Promise<any> {
    // Simplified decompression - just return data for now
    return data;
  }

  private async encrypt(data: any): Promise<any> {
    // Simple encryption for demonstration - use proper crypto in production
    if (data?.encrypted) {
      return data.data;
    }
    return data;
  }

  private async decrypt(data: any): Promise<any> {
    // Simple decryption for demonstration - use proper crypto in production
    if (data?.encrypted) {
      return data.data;
    }
    return data;
  }

  // Advanced cache strategies
  async getWithFallback<T>(
    key: string, 
    fallback: () => Promise<T>,
    options?: { staleWhileRevalidate?: boolean }
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached) {
      return cached;
    }

    // Return stale data while revalidating
    if (options?.staleWhileRevalidate) {
      const staleEntry = this.cache().get(key);
      if (staleEntry && staleEntry.expiresAt > Date.now() - this.config.defaultTTL * 1000) {
        // Trigger background refresh
        this.backgroundRefresh(key);
        return staleEntry.data;
      }
    }

    return await fallback();
  }

  private async backgroundRefresh(key: string): Promise<void> {
    // This would integrate with your API service
    this.loggerService.debug('Background refresh triggered', { key });
  }

  // Cache warming
  async warmup<T>(keys: string[], dataLoader: (key: string) => Promise<T>): Promise<void> {
    const promises = keys.map(async key => {
      try {
        const data = await dataLoader(key);
        await this.set(key, data, { priority: CachePriority.HIGH });
      } catch (error) {
        this.loggerService.error('Cache warmup failed', { key, error });
      }
    });

    await Promise.all(promises);
    this.loggerService.info('Cache warmup completed', { keys: keys.length });
  }

  // Cache export/import for backup
  async exportCache(): Promise<string> {
    const entries = Array.from(this.cache().entries());
    const exportData = {
      version: '1.0',
      timestamp: Date.now(),
      config: this.config,
      entries: entries.map(([key, entry]) => ({
        key,
        ...entry
      }))
    };

    return JSON.stringify(exportData);
  }

  async importCache(exportData: string): Promise<void> {
    try {
      const data = JSON.parse(exportData);
      
      for (const entry of data.entries) {
        if (entry.expiresAt > Date.now()) {
          await this.set(entry.key, entry.data, {
            ttl: (entry.expiresAt - Date.now()) / 1000,
            priority: entry.priority,
            tags: entry.tags
          });
        }
      }

      this.loggerService.info('Cache import completed', { 
        entries: data.entries.length,
        version: data.version 
      });
    } catch (error) {
      this.loggerService.error('Cache import failed', error);
      throw error;
    }
  }
}
