# ADR 0003: API Resilience and Circuit Breaker Pattern

## Status
Accepted

## Context
CryptoVault Pro needs to handle various network conditions and API failures gracefully:
- Intermittent connectivity issues
- API rate limiting (CoinGecko limits)
- Server errors and timeouts
- High latency connections
- Partial API failures

## Decision
Implement a comprehensive resilience strategy with circuit breaker pattern, retry logic, and stale-while-revalidate caching.

## Consequences

### Positive
- **High Availability**: App remains functional during API issues
- **Better UX**: Users see cached data instead of errors
- **Automatic Recovery**: Circuit breaker prevents cascade failures
- **Performance**: Caching reduces API calls and improves response times
- **Observability**: Clear metrics for monitoring API health
- **Graceful Degradation**: Fallback strategies for different failure modes

### Negative
- **Stale Data Risk**: Users might see outdated information
- **Complexity**: Additional infrastructure code to maintain
- **Memory Usage**: Caching increases memory consumption
- **Debugging Complexity**: Multiple failure modes can be harder to debug
- **Cache Invalidation**: Need strategies for cache updates

### Neutral
- **Network Dependency**: Still requires network for fresh data
- **Development Overhead**: Need to test various failure scenarios
- **Configuration**: Multiple parameters to tune for optimal performance

## Implementation Details

### Resilience Layers
```
Request → Circuit Breaker → Retry Logic → Cache → Fallback → Response
```

### Circuit Breaker Implementation
```typescript
export class CircuitBreakerState {
  private failureCount = 0;
  private lastFailureTime = 0;
  private open = false;
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 30000;

  recordFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.open = true;
      setTimeout(() => this.reset(), this.recoveryTimeout);
    }
  }

  isOpen(): boolean {
    return this.open;
  }
}
```

### Retry Strategy
```typescript
const retryConfig = {
  count: 3,
  delay: (error, retryCount) => {
    // Exponential backoff: 1s, 2s, 4s
    return Math.pow(2, retryCount) * 1000;
  },
  // Only retry on network/5xx errors
  shouldRetry: (error) => error.status >= 500 || error.status === 0
};
```

### Caching Strategy
```typescript
export class ResilientApiService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  get<T>(url: string): Observable<T> {
    // 1. Check circuit breaker
    if (this.circuitBreaker.isOpen()) {
      return this.serveFromCache<T>(url) || throwError('Circuit open');
    }

    // 2. Check cache
    const cached = this.getFromCache<T>(url);
    if (cached) {
      return of(cached.data);
    }

    // 3. Make request with retry
    return this.http.get<T>(url).pipe(
      retry(retryConfig),
      tap(data => {
        this.circuitBreaker.recordSuccess();
        this.setCache(url, data);
      }),
      catchError(error => {
        this.circuitBreaker.recordFailure();
        return this.serveFromCache<T>(url) || throwError(error);
      })
    );
  }
}
```

### Fallback Hierarchy
1. **Memory Cache**: Fastest, most recent data
2. **IndexedDB**: Persistent cache across sessions
3. **Stale Data**: Serve expired cache with warning
4. **Default Values**: Hardcoded fallbacks for critical data
5. **Error State**: Graceful error with recovery options

## Configuration

### Circuit Breaker Settings
```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;    // Default: 5
  recoveryTimeout: number;     // Default: 30000ms
  monitoringPeriod: number;    // Default: 60000ms
  halfOpenMaxCalls: number;   // Default: 3
}
```

### Retry Configuration
```typescript
interface RetryConfig {
  maxAttempts: number;        // Default: 3
  baseDelay: number;          // Default: 1000ms
  maxDelay: number;          // Default: 30000ms
  backoffMultiplier: number;   // Default: 2
  jitterFactor: number;        // Default: 0.1
}
```

### Cache Configuration
```typescript
interface CacheConfig {
  ttl: number;               // Default: 30000ms (30s)
  maxSize: number;           // Default: 100 entries
  strategy: 'lru' | 'fifo'; // Default: 'lru'
  backgroundRefresh: boolean;  // Default: true
}
```

## Error Handling Strategy

### Error Classification
```typescript
enum ErrorType {
  NETWORK = 'network',           // No connectivity
  TIMEOUT = 'timeout',           // Request timeout
  RATE_LIMIT = 'rate_limit',     // API rate limiting
  SERVER_ERROR = 'server_error',  // 5xx errors
  CLIENT_ERROR = 'client_error',  // 4xx errors
  UNKNOWN = 'unknown'            // Unclassified
}
```

### Recovery Actions
```typescript
const recoveryStrategies = {
  [ErrorType.NETWORK]: () => {
    // Enable offline mode
    // Show connection status
    // Queue requests for retry
  },
  [ErrorType.RATE_LIMIT]: () => {
    // Exponential backoff
    // Show rate limit warning
    // Use cached data
  },
  [ErrorType.SERVER_ERROR]: () => {
    // Circuit breaker open
    // Use stale data
    // Schedule retry
  }
};
```

## Monitoring and Metrics

### Key Metrics
```typescript
interface ResilienceMetrics {
  requestCount: number;
  successCount: number;
  failureCount: number;
  cacheHitRate: number;
  averageResponseTime: number;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  lastFailureTime: number;
  retryCount: number;
}
```

### Health Checks
```typescript
export class HealthMonitor {
  async checkApiHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      await this.api.ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}
```

## Testing Strategy

### Failure Simulation
```typescript
export class FailureSimulator {
  // Simulate different failure scenarios
  simulateNetworkError(): void;
  simulateRateLimit(): void;
  simulateSlowConnection(): void;
  simulateServerTimeout(): void;
  simulatePartialFailure(): void;
}
```

### Test Cases
```typescript
describe('API Resilience', () => {
  it('should retry on network errors', async () => {
    // Mock network failure
    // Verify retry logic
    // Verify circuit breaker state
  });

  it('should serve cached data when circuit is open', async () => {
    // Open circuit breaker
    // Verify cache fallback
    // Verify user experience
  });

  it('should handle rate limiting gracefully', async () => {
    // Mock 429 responses
    // Verify exponential backoff
    // Verify user notification
  });
});
```

## Performance Considerations

### Optimization Strategies
- **Request Deduplication**: Prevent duplicate in-flight requests
- **Background Refresh**: Update cache before expiration
- **Selective Caching**: Cache only appropriate responses
- **Memory Management**: Limit cache size and cleanup
- **Network Efficiency**: Batch requests when possible

### Bundle Impact
```typescript
// Resilience layer adds ~8KB to bundle
// Circuit breaker: ~2KB
// Retry logic: ~3KB
// Cache management: ~3KB
```

## Security Considerations

### Data Protection
- **Cache Encryption**: Sensitive data encrypted in cache
- **Request Sanitization**: Validate all cached responses
- **Error Information**: Don't expose sensitive error details
- **Rate Limit Respect**: Implement client-side rate limiting

### Privacy
- **Cache Isolation**: Per-user cache isolation
- **Data Minimization**: Cache only necessary data
- **Clear Policies**: User control over cache clearing

## Related Decisions

- [ADR 0001]: Signals - Work well with async resilience patterns
- [ADR 0002]: Offline-first - Complements resilience strategy

## Future Enhancements

### Advanced Features
- **Adaptive Circuit Breaker**: Machine learning for threshold optimization
- **Distributed Caching**: Shared cache across browser tabs
- **Predictive Prefetching**: Cache likely-to-be-requested data
- **Smart Retry**: Context-aware retry strategies

### Monitoring Improvements
- **Real-time Dashboards**: Live resilience metrics
- **Alerting Integration**: External monitoring services
- **Performance Analytics**: Detailed performance insights
- **Automated Tuning**: Dynamic parameter optimization

## References

- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker)
- [Retry Pattern](https://martinfowler.com/bliki/Retry)
- [Stale-While-Revalidate](https://web.dev/stale-while-revalidate/)
- [HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Resilience Patterns](https://microservices.io/patterns/resilience/)
