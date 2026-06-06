import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { catchError, retry, timeout, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

const MAX_RETRY_DELAY = 30000;
const RATE_LIMIT_MAX_DELAY = 60000;
const REQUEST_TIMEOUT = 30000;

function getRetryCount(req: HttpRequest<unknown>): number {
  if (req.method !== 'GET') return 0;
  if (req.body instanceof FormData || req.body instanceof Blob) return 0;
  if (req.headers.get('X-No-Retry') === 'true') return 0;
  if (req.url.includes('/api/v3/coins/markets')) return 2;
  return 1;
}

function shouldRetry(error: unknown, retryCount: number): boolean {
  if (!(error instanceof HttpErrorResponse)) return false;
  // Don't retry on 4xx errors (except 429)
  if (error.status >= 400 && error.status < 500 && error.status !== 429) return false;
  return true;
}

function getRetryDelay(error: HttpErrorResponse, retryCount: number): number {
  const baseDelay = 1000;
  const exponentialDelay = baseDelay * Math.pow(2, retryCount);
  const jitter = Math.random() * 0.1 * exponentialDelay;

  if (error.status === 429) {
    const retryAfter = error.headers?.get('Retry-After');
    if (retryAfter) return parseInt(retryAfter, 10) * 1000;
    return Math.min(exponentialDelay + jitter, RATE_LIMIT_MAX_DELAY);
  }

  return Math.min(exponentialDelay + jitter, MAX_RETRY_DELAY);
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    timeout(REQUEST_TIMEOUT),
    retry({
      count: getRetryCount(req),
      delay: (error: unknown, retryCount: number) => {
        if (!shouldRetry(error, retryCount)) {
          throw error;
        }
        const delay = getRetryDelay(error as HttpErrorResponse, retryCount);
        return new Promise(resolve => setTimeout(resolve, delay));
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.error?.simulated) {
        return throwError(() => error);
      }

      if (error.error instanceof ErrorEvent) {
        notificationService.error(
          'Network Error',
          'Unable to connect to the server. Please check your internet connection.',
          { persistent: true }
        );
      } else {
        handleServerError(error, req, notificationService);
      }

      return throwError(() => error);
    })
  );
};

function handleServerError(
  error: HttpErrorResponse,
  req: HttpRequest<unknown>,
  notificationService: NotificationService
): void {
  switch (error.status) {
    case 0:
      notificationService.error(
        'Connection Failed',
        'Unable to reach the server. Please check your network connection.',
        { persistent: true }
      );
      break;
    case 400:
      notificationService.error(
        'Bad Request',
        error.error?.message || 'Invalid request parameters',
        { duration: 5000 }
      );
      break;
    case 401:
      notificationService.error(
        'Authentication Required',
        'Please log in to access this resource.',
        { persistent: true }
      );
      break;
    case 403:
      notificationService.error(
        'Access Denied',
        'You do not have permission to access this resource.',
        { persistent: true }
      );
      break;
    case 404:
      if (!req.url.includes('/api/v3/ping')) {
        notificationService.warning(
          'Not Found',
          'The requested resource was not found.',
          { duration: 3000 }
        );
      }
      break;
    case 429: {
      const retryAfter = error.headers?.get('Retry-After');
      notificationService.warning(
        'Rate Limited',
        retryAfter
          ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
          : 'Rate limit exceeded. Please slow down your requests.',
        { persistent: true, duration: retryAfter ? parseInt(retryAfter, 10) * 1000 : 10000 }
      );
      break;
    }
    case 500:
      notificationService.error(
        'Server Error',
        'An internal server error occurred. Please try again later.',
        { persistent: true }
      );
      break;
    case 502:
    case 503:
    case 504:
      notificationService.error(
        'Service Unavailable',
        `${error.statusText || 'Service Unavailable'}. The service is temporarily unavailable. Please try again later.`,
        { persistent: true }
      );
      break;
    default:
      notificationService.error(
        'Error',
        error.error?.message || error.message || 'An unexpected error occurred',
        { duration: 5000 }
      );
      break;
  }

  console.group('HTTP Error Details');
  console.error('Request URL:', req.url);
  console.error('Method:', req.method);
  console.error('Status:', error.status);
  console.error('Message:', error.message);
  console.groupEnd();
}
