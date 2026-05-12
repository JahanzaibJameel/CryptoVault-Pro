import { HttpInterceptorFn } from '@angular/common/http';

export const securityHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip adding security headers for external APIs
  if (req.url.startsWith('https://api.coingecko.com') || 
      req.url.startsWith('https://httpbin.org')) {
    return next(req);
  }

  const secureReq = req.clone({
    setHeaders: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  });
  
  return next(secureReq);
};
