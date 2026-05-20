import { Injectable, signal, inject } from '@angular/core';
import { PERFORMANCE_BUDGETS, PERFORMANCE_THRESHOLDS, PerformanceBudget, PerformanceAlert } from './budgets.config';
import { LoggerService } from '../app/core/services/logger.service';
import { NotificationService } from '../app/core/services/notification.service';

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface EventEntry extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
}

export interface BudgetStatus {
  budget: PerformanceBudget;
  current: number;
  percentage: number;
  status: 'within' | 'warning' | 'error' | 'critical';
  variance: number;
}

export interface MetricThreshold {
  name: string;
  current: number;
  threshold: number;
  status: 'good' | 'needs-improvement' | 'poor';
  variance: number;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetMonitorService {
  private loggerService = inject(LoggerService);
  private notificationService = inject(NotificationService);

  private budgetStatuses = signal<Map<string, BudgetStatus>>(new Map());
  private metricThresholds = signal<Map<string, MetricThreshold>>(new Map());
  private alerts = signal<Map<string, PerformanceAlert>>(new Map());
  private isMonitoring = signal(false);

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.isMonitoring.set(true);
      this.startBudgetMonitoring();
      this.startMetricMonitoring();
      
      this.loggerService.info('Budget monitoring initialized', {
        budgets: PERFORMANCE_BUDGETS.length,
        thresholds: Object.keys(PERFORMANCE_THRESHOLDS).length
      });
    }
  }

  private startBudgetMonitoring(): void {
    // Monitor bundle sizes
    if ('performance' in window && 'getEntriesByType' in performance) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.analyzeBudgetEntries(entries);
      });

      observer.observe({ entryTypes: ['resource', 'navigation', 'measure'] });
    }
  }

  private startMetricMonitoring(): void {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      const vitalsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.analyzeWebVitals(entries);
      });

      vitalsObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-contentful-paint', 'layout-shift', 'first-input'] });
    }
  }

  private analyzeBudgetEntries(entries: PerformanceEntry[]): void {
    const resourceEntries = entries.filter(entry => entry.entryType === 'resource');
    
    // Analyze bundle sizes
    const bundleEntries = resourceEntries.filter(entry => 
      entry.name.includes('main') || 
      entry.name.includes('polyfills') || 
      entry.name.includes('vendor') ||
      entry.name.includes('runtime')
    );

    for (const entry of bundleEntries) {
      const resource = entry as PerformanceResourceTiming;
    const size = resource.transferSize || 0;
      const budget = this.findBudgetForEntry(entry.name);
      
      if (budget) {
        this.updateBudgetStatus(budget.name, size, budget);
      }
    }
  }

  private analyzeWebVitals(entries: PerformanceEntry[]): void {
    for (const entry of entries) {
      switch (entry.entryType) {
        case 'largest-contentful-paint':
          this.updateMetricThreshold('LCP', entry.startTime, PERFORMANCE_THRESHOLDS.LCP);
          break;
        case 'first-contentful-paint':
          this.updateMetricThreshold('FCP', entry.startTime, PERFORMANCE_THRESHOLDS.FCP);
          break;
        case 'layout-shift': {
          const layoutShiftEntry = entry as LayoutShiftEntry;
          if (layoutShiftEntry.value && !layoutShiftEntry.hadRecentInput) {
            this.updateMetricThreshold('CLS', layoutShiftEntry.value, PERFORMANCE_THRESHOLDS.CLS);
          }
          break;
        }
        case 'first-input': {
          const inputEntry = entry as EventEntry;
          if (inputEntry.processingStart && inputEntry.processingEnd) {
            const inp = inputEntry.processingEnd - inputEntry.processingStart;
            this.updateMetricThreshold('INP', inp, PERFORMANCE_THRESHOLDS.INP);
          }
          break;
        }
      }
    }
  }

  private findBudgetForEntry(entryName: string): PerformanceBudget | null {
    return PERFORMANCE_BUDGETS.find(budget => 
      entryName.includes(budget.name.toLowerCase()) ||
      budget.name === 'initial' && entryName.includes('main')
    ) || null;
  }

  private updateBudgetStatus(budgetName: string, current: number, budget: PerformanceBudget): void {
    const percentage = (current / this.parseBytes(budget.maximum)) * 100;
    const status = this.determineStatus(current, budget);
    const variance = current - this.parseBytes(budget.baseline || budget.maximum);

    const budgetStatus: BudgetStatus = {
      budget,
      current,
      percentage,
      status,
      variance
    };

    this.budgetStatuses().set(budgetName, budgetStatus);

    if (status !== 'within') {
      this.createAlert(budgetName, status, current, budget);
    }

    this.loggerService.debug('Budget status updated', {
      budget: budgetName,
      current,
      percentage: `${percentage.toFixed(2)}%`,
      status
    });
  }

  private updateMetricThreshold(metricName: string, value: number, threshold: any): void {
    const status = this.determineMetricStatus(value, threshold);
    const variance = value - threshold.good;

    const metricThreshold: MetricThreshold = {
      name: metricName,
      current: value,
      threshold: threshold.good,
      status,
      variance
    };

    this.metricThresholds().set(metricName, metricThreshold);

    if (status === 'poor') {
      this.createAlert(metricName, 'error', value, threshold);
    }

    this.loggerService.debug('Metric threshold updated', {
      metric: metricName,
      value,
      status,
      variance
    });
  }

  private determineStatus(current: number, budget: PerformanceBudget): 'within' | 'warning' | 'error' | 'critical' {
    const currentBytes = current;
    const warningBytes = this.parseBytes(budget.warning);
    const errorBytes = this.parseBytes(budget.error);
    const criticalBytes = this.parseBytes(budget.critical || '0');

    if (currentBytes >= criticalBytes) return 'critical';
    if (currentBytes >= errorBytes) return 'error';
    if (currentBytes >= warningBytes) return 'warning';
    return 'within';
  }

  private determineMetricStatus(value: number, threshold: any): 'good' | 'needs-improvement' | 'poor' {
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  private createAlert(
    entity: string, 
    status: 'warning' | 'error' | 'critical', 
    current: number, 
    budget: PerformanceBudget | { critical?: string; warning?: string }
  ): void {
    const alert: PerformanceAlert = {
      id: `${entity}_${Date.now()}`,
      type: status === 'critical' ? 'budget_exceeded' : 'performance_degradation',
      severity: status,
      title: `${status.toUpperCase()}: ${entity}`,
      message: this.generateAlertMessage(entity, status, current, budget),
      metric: {
        name: entity,
        value: current,
        threshold: status === 'critical' ? budget.critical : budget.warning,
        unit: 'bytes'
      },
      timestamp: Date.now(),
      action: this.generateActionSuggestion(entity)
    };

    this.alerts().set(alert.id || `${entity}_${Date.now()}`, alert);
    this.notifyUser(alert);
    this.logAlert(alert);
  }

  private generateAlertMessage(
    entity: string, 
    status: string, 
    current: number, 
    budget: PerformanceBudget | any
  ): string {
    const currentFormatted = this.formatBytes(current);
    const thresholdFormatted = this.formatBytes(
      status === 'critical' ? budget.critical : budget.warning
    );

    switch (status) {
      case 'warning':
        return `${entity} is approaching budget limit: ${currentFormatted} / ${thresholdFormatted}`;
      case 'error':
        return `${entity} exceeds budget limit: ${currentFormatted} / ${thresholdFormatted}`;
      case 'critical':
        return `${entity} critically exceeds budget: ${currentFormatted} / ${thresholdFormatted}`;
      default:
        return `${entity} performance degraded: ${currentFormatted} (threshold: ${thresholdFormatted})`;
    }
  }

  private generateActionSuggestion(entity: string): { label: string; handler: () => void } {
    const suggestions = {
      initial: 'Consider code splitting and tree shaking',
      anyComponentStyle: 'Review and optimize component styles',
      all: 'Implement lazy loading and reduce bundle size',
      allInitial: 'Optimize initial JavaScript bundle',
      allAsync: 'Review and optimize async chunks',
      LCP: 'Optimize largest contentful paint - check images and fonts',
      FCP: 'Optimize first contentful paint - reduce render blocking resources',
      INP: 'Reduce input delay and optimize JavaScript execution',
      TTFB: 'Optimize server response time and CDN usage',
      TTI: 'Improve interactive time and reduce JavaScript execution time',
      CLS: 'Stabilize layout shifts and implement proper dimensions',
      bundleSize: 'Implement better compression and code splitting',
      memoryUsage: 'Check for memory leaks and optimize data structures'
    };

    return {
      label: suggestions[entity as keyof typeof suggestions] || 'Optimize performance metrics',
      handler: () => {
        console.log(`Action suggested: ${suggestions[entity as keyof typeof suggestions] || 'Optimize performance metrics'}`);
      }
    };
  }

  private notifyUser(alert: PerformanceAlert): void {
    const notificationType = alert.severity === 'critical' ? 'error' : 'warning';
    
    this.notificationService[notificationType](
      alert.title,
      alert.message,
      {
        persistent: alert.severity === 'critical',
        duration: alert.severity === 'critical' ? 10000 : 5000,
        action: {
          label: 'Report Issue',
          handler: () => {
            window.open('https://github.com/your-repo/issues', '_blank');
          }
        }
      }
    );
  }

  private logAlert(alert: PerformanceAlert): void {
    this.loggerService.warn('Performance alert triggered', {
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      metric: alert.metric,
      action: alert.action
    });
  }

  private showAlertDetails(alert: PerformanceAlert): void {
    // This would open a modal with detailed performance information
    console.group(`🚨 ${alert.title}`);
    console.log('Message:', alert.message);
    console.log('Metric:', alert.metric);
    console.log('Timestamp:', new Date(alert.timestamp).toISOString());
    console.log('Suggested Action:', alert.action);
    console.groupEnd();
  }

  // Public API
  getBudgetStatuses(): Map<string, BudgetStatus> {
    return this.budgetStatuses();
  }

  getMetricThresholds(): Map<string, MetricThreshold> {
    return this.metricThresholds();
  }

  getAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts().values());
  }

  clearAlerts(): void {
    this.alerts().clear();
  }

  getOverallHealth(): { status: 'healthy' | 'warning' | 'critical'; score: number; issues: string[] } {
    const statuses = Array.from(this.budgetStatuses().values());
    const thresholds = Array.from(this.metricThresholds().values());
    const alerts = this.getAlerts();

    const criticalIssues = [
      ...statuses.filter((s): s is BudgetStatus => s.status === 'critical'),
      ...thresholds.filter((t): t is MetricThreshold => t.status === 'poor'),
      ...alerts.filter(a => a.severity === 'critical')
    ];

    const warningIssues = [
      ...statuses.filter((s): s is BudgetStatus => s.status === 'error'),
      ...thresholds.filter((t): t is MetricThreshold => t.status === 'needs-improvement'),
      ...alerts.filter(a => a.severity === 'error')
    ];

    const issues = [
      ...criticalIssues.map((issue) => {
        if ('budget' in issue) {
          return `Critical: ${issue.budget.name}`;
        }
        return `Critical: ${(issue as any).name || 'Unknown'}`;
      }),
      ...warningIssues.map((issue) => {
        if ('budget' in issue) {
          return `Warning: ${issue.budget.name}`;
        }
        return `Warning: ${(issue as any).name || 'Unknown'}`;
      })
    ];

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let score = 100;

    if (criticalIssues.length > 0) {
      status = 'critical';
      score = Math.max(0, 100 - (criticalIssues.length * 25));
    } else if (warningIssues.length > 0) {
      status = 'warning';
      score = Math.max(0, 100 - (warningIssues.length * 10));
    }

    return { status, score, issues };
  }

  private parseBytes(bytes: string): number {
    if (bytes.includes('MB')) {
      return parseFloat(bytes) * 1024 * 1024;
    }
    if (bytes.includes('KB')) {
      return parseFloat(bytes) * 1024;
    }
    return parseInt(bytes) || 0;
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }

  // Manual budget check
  checkCustomBudget(name: string, current: number, maximum: number): BudgetStatus {
    const budget: PerformanceBudget = {
      name,
      budgetType: 'any',
      maximum: maximum.toString(),
      warning: (maximum * 0.8).toString(),
      error: (maximum * 0.9).toString(),
      critical: maximum.toString()
    };

    return this.determineBudgetStatus(name, current, budget);
  }

  private determineBudgetStatus(name: string, current: number, budget: PerformanceBudget): BudgetStatus {
    const percentage = (current / this.parseBytes(budget.maximum)) * 100;
    const status = this.determineStatus(current, budget);
    const variance = current - this.parseBytes(budget.baseline || budget.maximum);

    return {
      budget,
      current,
      percentage,
      status,
      variance
    };
  }

  // Export performance report
  generatePerformanceReport(): {
    timestamp: string;
    budgetStatuses: Record<string, any>;
    metricThresholds: Record<string, any>;
    alerts: PerformanceAlert[];
    overallHealth: any;
  } {
    const budgetStatuses = Object.fromEntries(this.budgetStatuses());
    const metricThresholds = Object.fromEntries(this.metricThresholds());
    const alerts = this.getAlerts();
    const overallHealth = this.getOverallHealth();

    return {
      timestamp: new Date().toISOString(),
      budgetStatuses,
      metricThresholds,
      alerts,
      overallHealth
    };
  }
}
