import { Injectable, inject } from '@angular/core';
import { SentryService } from './sentry.service';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  stack?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private sentryService = inject(SentryService);
  private isProduction = false;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;

  constructor() {
    this.isProduction = this.getEnvironment() === 'production';
  }

  private getEnvironment(): string {
    // In a real app, this would come from environment variables
    return (typeof window !== 'undefined' && (window as any).__ENV?.NODE_ENV) || 'development';
  }

  debug(message: string, data?: any, context?: string): void {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: any, context?: string): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string): void {
    this.log('warn', message, data, context);
  }

  error(message: string, error?: any, context?: string): void {
    this.log('error', message, error, context);
    
    // Send errors to Sentry in production
    if (this.isProduction) {
      if (error instanceof Error) {
        this.sentryService.captureException(error, { context, message });
      } else {
        this.sentryService.captureMessage(message, 'error', { error, context });
      }
    }
  }

  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      data,
      stack: level === 'error' && data instanceof Error ? data.stack : undefined
    };

    // Add to buffer
    this.addToBuffer(entry);

    // Console output in development
    if (!this.isProduction) {
      this.outputToConsole(entry);
    }

    // Send to Sentry for warnings and errors
    if (this.isProduction && (level === 'warn' || level === 'error')) {
      this.sendToSentry(entry);
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    const contextStr = entry.context ? ` [${entry.context}]` : '';
    
    switch (entry.level) {
      case 'debug':
        console.debug(`${prefix}${contextStr} ${entry.message}`, entry.data);
        break;
      case 'info':
        console.info(`${prefix}${contextStr} ${entry.message}`, entry.data);
        break;
      case 'warn':
        console.warn(`${prefix}${contextStr} ${entry.message}`, entry.data);
        break;
      case 'error':
        console.error(`${prefix}${contextStr} ${entry.message}`, entry.data);
        break;
    }
  }

  private sendToSentry(entry: LogEntry): void {
    const sentryLevel = entry.level === 'warn' ? 'warning' : 'error';
    
    if (entry.data instanceof Error) {
      this.sentryService.captureException(entry.data, {
        context: entry.context,
        message: entry.message
      });
    } else {
      this.sentryService.captureMessage(entry.message, sentryLevel, {
        data: entry.data,
        context: entry.context
      });
    }
  }

  // Structured logging methods for specific contexts
  api(method: string, url: string, statusCode?: number, duration?: number, error?: any): void {
    const message = `API ${method} ${url}`;
    const data = { method, url, statusCode, duration, error };
    const level = statusCode && statusCode >= 400 ? 'error' : 'info';
    
    this.log(level, message, data, 'api');
  }

  performance(metric: string, value: number, unit: string = 'ms'): void {
    const message = `Performance metric: ${metric} = ${value}${unit}`;
    const data = { metric, value, unit };
    
    this.log('info', message, data, 'performance');
  }

  user(action: string, details?: any): void {
    const message = `User action: ${action}`;
    const data = details;
    
    this.log('info', message, data, 'user');
  }

  security(event: string, details?: any): void {
    const message = `Security event: ${event}`;
    const data = details;
    
    this.log('warn', message, data, 'security');
    
    // Always send security events to Sentry
    this.sentryService.captureMessage(message, 'warning', { data, context: 'security' });
  }

  circuitBreaker(service: string, state: string, failureCount: number): void {
    const message = `Circuit breaker ${state} for ${service}`;
    const data = { service, state, failureCount };
    const level = state === 'open' ? 'error' : 'warn';
    
    this.log(level, message, data, 'circuit-breaker');
  }

  // Buffer management
  getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logBuffer.filter(entry => entry.level === level);
  }

  getLogsByContext(context: string): LogEntry[] {
    return this.logBuffer.filter(entry => entry.context === context);
  }

  clearLogBuffer(): void {
    this.logBuffer = [];
  }

  exportLogs(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      environment: this.getEnvironment(),
      logs: this.logBuffer,
      count: this.logBuffer.length
    }, null, 2);
  }

  // Analytics and metrics
  getLogMetrics(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byContext: Record<string, number>;
    recent: LogEntry[];
  } {
    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    };
    
    const byContext: Record<string, number> = {};
    
    this.logBuffer.forEach(entry => {
      byLevel[entry.level]++;
      if (entry.context) {
        byContext[entry.context] = (byContext[entry.context] || 0) + 1;
      }
    });

    const recent = this.logBuffer.slice(-10);

    return {
      total: this.logBuffer.length,
      byLevel,
      byContext,
      recent
    };
  }

  // Health check
  checkHealth(): { healthy: boolean; checks: Record<string, boolean> } {
    const checks = {
      buffer_size: this.logBuffer.length < this.maxBufferSize,
      sentry_available: !!this.sentryService,
      environment_detected: !!this.getEnvironment()
    };

    return {
      healthy: Object.values(checks).every(check => check),
      checks
    };
  }
}
