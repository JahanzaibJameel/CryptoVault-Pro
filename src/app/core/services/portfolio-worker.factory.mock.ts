type WorkerMessage = {
  type: string;
  data: Record<string, unknown>;
  id: string;
};

// Mock implementation for the portfolio worker used in tests.
function buildWorkerResult(type: string, data: Record<string, unknown>) {
  const holdings = (data.holdings as Array<{ coinId: string; amount: number; avgBuyPrice: number }>) ?? [];
  const currentPrices = (data.currentPrices as Record<string, number>) ?? {};
  const priceHistory = (data.priceHistory as Record<string, number[]>) ?? {};

  switch (type) {
    case 'metrics': {
      const totalValue = holdings.reduce(
        (sum, holding) => sum + holding.amount * (currentPrices[holding.coinId] ?? 0),
        0,
      );
      const totalInvested = holdings.reduce(
        (sum, holding) => sum + holding.amount * holding.avgBuyPrice,
        0,
      );
      const totalPnL = totalValue - totalInvested;

      return {
        totalValue,
        totalInvested,
        totalPnL,
        totalROI: totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0,
        holdingsCount: holdings.length,
      };
    }
    case 'volatility': {
      const history = Object.values(priceHistory)[0] ?? [];
      const portfolioVolatility = history.length < 2 ? 0 : 0.12;

      return {
        portfolioVolatility,
        individualVolatility: {},
        correlationMatrix: {},
        sharpeRatio: portfolioVolatility === 0 ? 0 : 1.2,
        var95: portfolioVolatility === 0 ? 0 : 0.05,
        beta: portfolioVolatility === 0 ? 0 : 1,
      };
    }
    case 'diversification': {
      const totalAmount = holdings.reduce((sum, holding) => sum + holding.amount * holding.avgBuyPrice, 0);
      const bitcoinWeight =
        totalAmount > 0
          ? ((holdings.find((holding) => holding.coinId === 'bitcoin')?.amount ?? 0) *
              (holdings.find((holding) => holding.coinId === 'bitcoin')?.avgBuyPrice ?? 0)) /
            totalAmount
          : 0;

      return {
        herfindahlIndex: 0.4,
        concentrationRisk: bitcoinWeight > 0.8 ? 'high' : 'medium',
        sectorAllocation: {},
        geographicAllocation: {},
        diversificationScore: bitcoinWeight > 0.8 ? 30 : 70,
        recommendations: ['Add more assets to reduce concentration risk'],
      };
    }
    case 'risk-analysis':
      return {
        portfolioRisk: 'medium',
        riskFactors: ['Market volatility'],
        maxDrawdown: 0.1,
        volatility: 0.12,
        downsideRisk: 0.08,
        stressTestResults: {},
      };
    case 'performance':
      return {
        totalReturn: 0.15,
        annualizedReturn: 0.12,
        volatility: 0.1,
        sharpeRatio: 1.1,
        maxDrawdown: 0.08,
        alpha: 0.02,
        beta: 1,
        informationRatio: 0.5,
        winRate: 0.6,
        profitFactor: 1.4,
      };
    default:
      return {};
  }
}

class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;

  postMessage(message: WorkerMessage): void {
    if (message.data?.holdings === null) {
      queueMicrotask(() => {
        this.onmessage?.({
          data: {
            id: message.id,
            type: message.type,
            error: 'Invalid worker payload',
            calculationTime: 1,
            timestamp: Date.now(),
          },
        } as MessageEvent);
      });
      return;
    }

    queueMicrotask(() => {
      this.onmessage?.({
        data: {
          id: message.id,
          type: message.type,
          result: buildWorkerResult(message.type, message.data),
          calculationTime: 1,
          timestamp: Date.now(),
        },
      } as MessageEvent);
    });
  }

  terminate(): void {
    // no-op for tests
  }
}

export function createPortfolioWorker(): Worker {
  // Return an in-memory mock worker for fast unit testing.
  return new MockWorker() as unknown as Worker;
}
