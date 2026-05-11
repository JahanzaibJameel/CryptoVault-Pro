export interface StorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAll<T>(key: string): Promise<T[]>;
  exists(key: string): Promise<boolean>;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAll<T>(key: string): Promise<T[]>;
  exists(key: string): Promise<boolean>;
  getKeys(): Promise<string[]>;
  getSize(): Promise<number>;
}

export interface ApiService {
  get<T>(url: string, options?: { headers?: Record<string, string>; cacheKey?: string }): Promise<T>;
  post<T>(url: string, body: any, options?: { headers?: Record<string, string>; bypassCache?: boolean }): Promise<T>;
  put<T>(url: string, body: any, options?: { headers?: Record<string, string> }): Promise<T>;
  delete<T>(url: string, options?: { headers?: Record<string, string> }): Promise<T>;
  patch<T>(url: string, body: any, options?: { headers?: Record<string, string> }): Promise<T>;
}

export interface MonitoringService {
  logError(error: Error, context?: string): void;
  logWarning(message: string, context?: string): void;
  logInfo(message: string, context?: string): void;
  logDebug(message: string, context?: string): void;
  trackEvent(event: string, properties?: Record<string, any>): void;
  trackPerformance(metric: string, value: number, context?: string): void;
  trackUserAction(action: string, properties?: Record<string, any>): void;
}
