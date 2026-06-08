/**
 * Create a dedicated portfolio web worker instance.
 * This worker is created as a module worker.
 */
export function createPortfolioWorker(): Worker {
  return new Worker(new URL('../workers/portfolio.worker.ts', import.meta.url), {
    type: 'module',
  });
}

