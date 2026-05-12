import { ApplicationConfig, provideBrowserGlobalErrorListeners, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { offlineSimulatorInterceptor } from './core/interceptors/offline-simulator.interceptor';
import { securityHeadersInterceptor } from './core/interceptors/security-headers.interceptor';
import { GlobalErrorHandler } from './core/services/global-error-handler';
import { SentryService } from './core/services/sentry.service';
import { PerformanceService } from './core/services/performance.service';
import { HealthCheckService } from './core/services/health-check.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([offlineSimulatorInterceptor, securityHeadersInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    SentryService,
    PerformanceService,
    HealthCheckService
  ]
};
