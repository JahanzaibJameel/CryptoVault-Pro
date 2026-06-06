import { ApplicationConfig, provideBrowserGlobalErrorListeners, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { offlineSimulatorInterceptor } from './core/interceptors/offline-simulator.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { cacheInterceptor } from './core/interceptors/cache.interceptor';
import { GlobalErrorHandler } from './core/services/global-error-handler';
import { SentryService } from './core/services/sentry.service';
import { PerformanceService } from './core/services/performance.service';
import { PerformanceOptimizerService } from './core/services/performance-optimizer.service';
import { HealthCheckService } from './core/services/health-check.service';
import { DEFAULT_PERFORMANCE_CONFIG, PERFORMANCE_CONFIG } from './core/config/performance.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([cacheInterceptor, offlineSimulatorInterceptor, errorInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: PERFORMANCE_CONFIG, useValue: DEFAULT_PERFORMANCE_CONFIG },
    SentryService,
    PerformanceService,
    PerformanceOptimizerService,
    HealthCheckService
  ]
};
