import { InjectionToken } from '@angular/core';

export interface PerformanceConfig {
  // Core Web Vitals thresholds
  thresholds: {
    lcp: {
      good: number;      // 2.5s
      needsImprovement: number; // 4s
    };
    fid: {
      good: number;      // 100ms
      needsImprovement: number; // 300ms
    };
    cls: {
      good: number;      // 0.1
      needsImprovement: number; // 0.25
    };
  };

  // Bundle optimization settings
  bundling: {
    enableCodeSplitting: boolean;
    enableTreeShaking: boolean;
    enableMinification: boolean;
    compressionLevel: 'none' | 'gzip' | 'brotli';
    chunkSizeWarning: number; // KB
  };

  // Caching strategies
  caching: {
    enableServiceWorker: boolean;
    enableHttpCaching: boolean;
    enableMemoryCaching: boolean;
    cacheMaxAge: number; // seconds
  };

  // Image optimization
  images: {
    enableWebP: boolean;
    enableLazyLoading: boolean;
    enablePlaceholders: boolean;
    qualityThreshold: number; // 0-100
    maxWidth: number; // pixels
  };

  // Route optimization
  routing: {
    enablePreloading: boolean;
    preloadStrategy: 'none' | 'preloadAllModules' | 'custom';
    criticalRoutes: string[];
    prefetchDelay: number; // ms
  };

  // Memory management
  memory: {
    enableGarbageCollection: boolean;
    memoryThreshold: number; // 0-1
    monitoringInterval: number; // ms
    maxHeapSize: number; // MB
  };

  // Monitoring settings
  monitoring: {
    enableCoreWebVitals: boolean;
    enableNavigationTiming: boolean;
    enableResourceTiming: boolean;
    enableUserTiming: boolean;
    samplingRate: number; // 0-1
  };
}

export const PERFORMANCE_CONFIG = new InjectionToken<PerformanceConfig>('PERFORMANCE_CONFIG');

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  thresholds: {
    lcp: {
      good: 2500,
      needsImprovement: 4000
    },
    fid: {
      good: 100,
      needsImprovement: 300
    },
    cls: {
      good: 0.1,
      needsImprovement: 0.25
    }
  },

  bundling: {
    enableCodeSplitting: true,
    enableTreeShaking: true,
    enableMinification: true,
    compressionLevel: 'brotli',
    chunkSizeWarning: 250 // KB
  },

  caching: {
    enableServiceWorker: true,
    enableHttpCaching: true,
    enableMemoryCaching: true,
    cacheMaxAge: 86400 // 24 hours
  },

  images: {
    enableWebP: true,
    enableLazyLoading: true,
    enablePlaceholders: true,
    qualityThreshold: 85,
    maxWidth: 1920
  },

  routing: {
    enablePreloading: true,
    preloadStrategy: 'custom',
    criticalRoutes: ['/dashboard', '/portfolio'],
    prefetchDelay: 200
  },

  memory: {
    enableGarbageCollection: true,
    memoryThreshold: 0.8,
    monitoringInterval: 30000,
    maxHeapSize: 512
  },

  monitoring: {
    enableCoreWebVitals: true,
    enableNavigationTiming: true,
    enableResourceTiming: true,
    enableUserTiming: true,
    samplingRate: 1.0
  }
};

// Environment-specific configurations
export const ENVIRONMENT_CONFIGS = {
  development: {
    ...DEFAULT_PERFORMANCE_CONFIG,
    bundling: {
      ...DEFAULT_PERFORMANCE_CONFIG.bundling,
      compressionLevel: 'none'
    },
    monitoring: {
      ...DEFAULT_PERFORMANCE_CONFIG.monitoring,
      samplingRate: 0.1 // Sample 10% in development
    }
  },

  production: {
    ...DEFAULT_PERFORMANCE_CONFIG,
    bundling: {
      ...DEFAULT_PERFORMANCE_CONFIG.bundling,
      compressionLevel: 'brotli'
    },
    monitoring: {
      ...DEFAULT_PERFORMANCE_CONFIG.monitoring,
      samplingRate: 0.01 // Sample 1% in production
    }
  },

  test: {
    ...DEFAULT_PERFORMANCE_CONFIG,
    monitoring: {
      ...DEFAULT_PERFORMANCE_CONFIG.monitoring,
      samplingRate: 0 // Disable monitoring in tests
    }
  }
};
