/**
 * Create a dedicated portfolio web worker instance.
 */
export function createPortfolioWorker(): Worker {
  return new Worker(new URL('../workers/portfolio.worker.ts', import.meta.url), {
    type: 'module',
  });
}
