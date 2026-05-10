export class CircuitBreakerState {
  private failureCount = 0;
  private lastFailureTime = 0;
  private open = false;
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 30000; // 30 seconds

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.open = true;
      setTimeout(() => {
        this.open = false;
        this.failureCount = 0;
      }, this.recoveryTimeout);
    }
  }

  recordSuccess(): void {
    this.failureCount = 0;
  }

  isOpen(): boolean {
    return this.open;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  getLastFailureTime(): number {
    return this.lastFailureTime;
  }

  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.open = false;
  }

  getState(): 'closed' | 'open' | 'half-open' {
    if (this.open) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      return timeSinceLastFailure > this.recoveryTimeout ? 'half-open' : 'open';
    }
    return 'closed';
  }
}
