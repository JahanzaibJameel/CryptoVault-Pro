export interface PerformanceBudget {
  name: string;
  budgetType: 'initial' | 'anyComponentStyle' | 'any' | 'all' | 'allInitial' | 'allAsync' | 'allSync';
  maximum: string; // bytes
  warning: string; // bytes
  error: string; // bytes
  minimum?: string; // bytes
  baseline?: string; // bytes
  critical?: string; // bytes
}

export interface PerformanceAlert {
  id: string;
  type: 'budget_exceeded' | 'performance_degradation' | 'regression_detected' | 'critical_metric';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  metric?: {
    name: string;
    value: number;
    threshold: number;
    unit: string;
  };
  timestamp: number;
  action?: {
    label: string;
    handler: () => void;
  };
  url?: string;
}

export interface PerformanceThresholds {
  // Core Web Vitals (in milliseconds)
  LCP: { good: 2500, needsImprovement: 4000, poor: 6000 };
  FCP: { good: 1800, needsImprovement: 3000, poor: 5000 };
  INP: { good: 200, needsImprovement: 500, poor: 1000 };
  TTFB: { good: 800, needsImprovement: 1800, poor: 3000 };
  TTI: { good: 3800, needsImprovement: 7300, poor: 10000 };
  
  // CLS (cumulative layout shift)
  CLS: { good: 0.1, needsImprovement: 0.25, poor: 0.5 };
  
  // Custom metrics
  bundleSize: { warning: '2MB', error: '5MB', critical: '10MB' };
  chunkSize: { warning: '500KB', error: '1MB', critical: '2MB' };
  memoryUsage: { warning: '50MB', error: '100MB', critical: '200MB' };
  apiResponseTime: { good: 200, needsImprovement: 500, poor: 1000 };
  errorRate: { good: 0.01, needsImprovement: 0.05, poor: 0.1 };
}

export const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  // Initial load budgets
  {
    name: 'initial',
    budgetType: 'initial',
    maximum: '1.5MB',
    warning: '1.2MB',
    error: '1.4MB',
    critical: '1.5MB',
    baseline: '1.0MB'
  },
  
  // Any component style budgets
  {
    name: 'anyComponentStyle',
    budgetType: 'anyComponentStyle',
    maximum: '50KB',
    warning: '40KB',
    error: '45KB',
    critical: '50KB'
  },
  
  // Total bundle budget
  {
    name: 'all',
    budgetType: 'all',
    maximum: '3MB',
    warning: '2.5MB',
    error: '2.8MB',
    critical: '3MB',
    baseline: '2.0MB'
  },
  
  // Initial scripts budget
  {
    name: 'allInitial',
    budgetType: 'allInitial',
    maximum: '1MB',
    warning: '800KB',
    error: '900KB',
    critical: '1MB'
  },
  
  // Async chunks budget
  {
    name: 'allAsync',
    budgetType: 'allAsync',
    maximum: '500KB',
    warning: '400KB',
    error: '450KB',
    critical: '500KB'
  }
];

export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  LCP: { good: 2500, needsImprovement: 4000, poor: 6000 },
  FCP: { good: 1800, needsImprovement: 3000, poor: 5000 },
  INP: { good: 200, needsImprovement: 500, poor: 1000 },
  TTFB: { good: 800, needsImprovement: 1800, poor: 3000 },
  TTI: { good: 3800, needsImprovement: 7300, poor: 10000 },
  CLS: { good: 0.1, needsImprovement: 0.25, poor: 0.5 },
  bundleSize: { warning: '2MB', error: '5MB', critical: '10MB' },
  chunkSize: { warning: '500KB', error: '1MB', critical: '2MB' },
  memoryUsage: { warning: '50MB', error: '100MB', critical: '200MB' },
  apiResponseTime: { good: 200, needsImprovement: 500, poor: 1000 },
  errorRate: { good: 0.01, needsImprovement: 0.05, poor: 0.1 }
};

export const BUDGET_CATEGORIES = {
  CORE_WEB_VITALS: ['LCP', 'FCP', 'INP', 'TTFB', 'TTI', 'CLS'],
  BUNDLE_SIZE: ['initial', 'all', 'allInitial', 'allAsync'],
  RUNTIME: ['memoryUsage', 'apiResponseTime', 'errorRate']
} as const;
