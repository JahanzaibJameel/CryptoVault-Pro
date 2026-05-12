import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SecurityHeadersInterceptor implements HttpInterceptor {
  private readonly CSP_DIRECTIVES = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.cryptovault.com https://sentry.io https://*.google-analytics.com",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ];

  private readonly SECURITY_HEADERS = {
    'Content-Security-Policy': this.CSP_DIRECTIVES.join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clone request to modify headers
    const secureReq = req.clone({
      setHeaders: {
        ...req.headers,
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      withCredentials: true
    });

    return next.handle(secureReq).pipe(
      map(event => {
        if (event instanceof HttpResponse) {
          // Clone response to add security headers
          const secureHeaders = new HttpHeaders(this.SECURITY_HEADERS);
          const secureResponse = event.clone({
            headers: secureHeaders
          });
          return secureResponse;
        }
        return event;
      })
    );
  }

  // Generate nonce for CSP
  private generateNonce(): string {
    return btoa(Math.random().toString(36).substring(2, 15));
  }

  // Validate CSP directive
  private validateCSP(): boolean {
    return this.CSP_DIRECTIVES.every(directive => 
      directive.length > 0 && directive.includes("'self'")
    );
  }
}
