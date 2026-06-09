/// <reference lib="webworker" />

// Define interfaces locally to avoid import issues
export interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  totalInvested: number;
  totalReturned: number;
  holdingsCount: number;
  transactionsCount: number;
  lastUpdated: number;
}

export interface VolatilityMetrics {
  standardDeviation: number;
  beta: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  riskFreeRate: number;
}

export interface DiversificationMetrics {
  herfindahlIndex: number;
  concentrationRisk: 'low' | 'medium' | 'high';
  diversificationRatio: number;
  uniqueAssets: number;
  sectorAllocation: { [key: string]: number };
  geographicAllocation: { [key: string]: number };
  diversificationScore: number;
  recommendations: string[];
}

export interface RiskMetrics {
  valueAtRisk: number;
  expectedShortfall: number;
  portfolioBeta: number;
  systematicRisk: number;
  unsystematicRisk: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  alpha: number;
  beta: number;
  informationRatio: number;
  trackingError: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
}

export interface WorkerMessage {
  type: 'metrics' | 'volatility' | 'diversification' | 'risk-analysis' | 'performance';
  data: any;
  id: string;
}

export interface WorkerResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

// Portfolio metrics calculation
function calculatePortfolioMetrics(holdings: any[], transactions: any[]): PortfolioMetrics {
  const totalValue = holdings.reduce((sum, holding) => sum + (holding.currentValue || 0), 0);
  const totalCost = holdings.reduce((sum, holding) => sum + (holding.totalCost || 0), 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  const buyTransactions = transactions.filter(t => t.type === 'buy');
  const sellTransactions = transactions.filter(t => t.type === 'sell');
  const totalInvested = buyTransactions.reduce((sum, t) => sum + (t.amount * t.price), 0);
  const totalReturned = sellTransactions.reduce((sum, t) => sum + (t.amount * t.price), 0);

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    totalInvested,
    totalReturned,
    holdingsCount: holdings.length,
    transactionsCount: transactions.length,
    lastUpdated: Date.now()
  };
}

// Volatility calculation
function calculateVolatilityMetrics(holdings: any[], priceHistory: any[]): VolatilityMetrics {
  if (holdings.length === 0 || priceHistory.length === 0) {
    return {
      standardDeviation: 0,
      beta: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      volatility: 0,
      riskFreeRate: 0.02
    };
  }

  const returns = priceHistory.map((item, index) => {
    if (index === 0) return 0;
    return (item.price - priceHistory[index - 1].price) / priceHistory[index - 1].price;
  }).slice(1);

  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const standardDeviation = Math.sqrt(variance);
  const volatility = standardDeviation * Math.sqrt(252); // Annualized volatility

  // Simplified beta calculation (would use market data in real implementation)
  const beta = 1.0;
  const riskFreeRate = 0.02;
  const sharpeRatio = volatility > 0 ? (meanReturn * 252 - riskFreeRate) / volatility : 0;

  // Max drawdown calculation
  let maxDrawdown = 0;
  let peak = priceHistory[0]?.price || 0;
  
  priceHistory.forEach(item => {
    if (item.price > peak) {
      peak = item.price;
    }
    const drawdown = (peak - item.price) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  return {
    standardDeviation,
    beta,
    sharpeRatio,
    maxDrawdown,
    volatility,
    riskFreeRate
  };
}

// Diversification metrics
function calculateDiversificationMetrics(holdings: any[]): DiversificationMetrics {
  if (holdings.length === 0) {
    return {
      herfindahlIndex: 0,
      concentrationRisk: 'low',
      diversificationRatio: 0,
      uniqueAssets: 0,
      sectorAllocation: {},
      geographicAllocation: {},
      diversificationScore: 0,
      recommendations: ['No holdings available for diversification analysis']
    };
  }

  const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
  if (totalValue === 0) {
    return {
      herfindahlIndex: 0,
      concentrationRisk: 'low',
      diversificationRatio: 0,
      uniqueAssets: holdings.length,
      sectorAllocation: {},
      geographicAllocation: {},
      diversificationScore: 0,
      recommendations: ['Holdings have no current market value so diversification metrics cannot be calculated reliably']
    };
  }

  const weights = holdings.map(h => (h.currentValue || 0) / totalValue);
  const herfindahlIndex = weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
  const concentrationRisk =
    herfindahlIndex > 0.5 ? 'high' :
    herfindahlIndex > 0.25 ? 'medium' :
    'low';
  const diversificationRatio = herfindahlIndex > 0 ? 1 / herfindahlIndex : 0;

  const sectorAllocation: { [key: string]: number } = {};
  holdings.forEach(holding => {
    const sector = holding.sector || 'Unknown';
    sectorAllocation[sector] = (sectorAllocation[sector] || 0) + (holding.currentValue || 0);
  });

  Object.keys(sectorAllocation).forEach(sector => {
    sectorAllocation[sector] = (sectorAllocation[sector] / totalValue) * 100;
  });

  const geographicAllocation: { [key: string]: number } = {};
  const diversificationScore = Math.max(0, Math.round((1 - herfindahlIndex) * 100));
  const recommendations: string[] = [];
  if (concentrationRisk === 'high') {
    recommendations.push('Consider adding more asset types to reduce concentration risk');
  }
  if (Object.keys(sectorAllocation).length < 3) {
    recommendations.push('Consider diversifying across more sectors');
  }
  if (diversificationScore < 50) {
    recommendations.push('Portfolio diversification is low; consider rebalancing');
  }
  if (recommendations.length === 0) {
    recommendations.push('Portfolio appears diversified across available holdings');
  }

  return {
    herfindahlIndex,
    concentrationRisk,
    diversificationRatio,
    uniqueAssets: holdings.length,
    sectorAllocation,
    geographicAllocation,
    diversificationScore,
    recommendations
  };
}

// Risk analysis
function calculateRiskMetrics(holdings: any[], volatility: VolatilityMetrics): RiskMetrics {
  if (holdings.length === 0) {
    return {
      valueAtRisk: 0,
      expectedShortfall: 0,
      portfolioBeta: 0,
      systematicRisk: 0,
      unsystematicRisk: 0,
      riskLevel: 'Low'
    };
  }

  const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
  
  // Simplified VaR calculation (95% confidence, 1 day)
  const valueAtRisk = totalValue * volatility.standardDeviation * 1.65;
  
  // Expected Shortfall (average loss beyond VaR)
  const expectedShortfall = valueAtRisk * 1.2;

  const portfolioBeta = volatility.beta;
  const systematicRisk = portfolioBeta * 0.16; // Market volatility approximation
  const unsystematicRisk = volatility.standardDeviation - systematicRisk;

  // Risk level classification
  let riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  if (volatility.volatility < 0.15) {
    riskLevel = 'Low';
  } else if (volatility.volatility < 0.25) {
    riskLevel = 'Medium';
  } else if (volatility.volatility < 0.35) {
    riskLevel = 'High';
  } else {
    riskLevel = 'Very High';
  }

  return {
    valueAtRisk,
    expectedShortfall,
    portfolioBeta,
    systematicRisk,
    unsystematicRisk,
    riskLevel
  };
}

// Performance metrics
function calculatePerformanceMetrics(transactions: any[], currentHoldings: any[]): PerformanceMetrics {
  if (transactions.length === 0) {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      alpha: 0,
      beta: 0,
      informationRatio: 0,
      trackingError: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0
    };
  }

  const totalValue = currentHoldings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
  const totalCost = transactions.reduce((sum, t) => sum + (t.amount * t.price), 0);
  const totalReturn = totalValue - totalCost;
  const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  // Simplified annualized return (would use actual time period)
  const annualizedReturn = totalReturnPercent;

  // Simplified alpha/beta calculation
  const alpha = totalReturnPercent - 0.08; // Assuming 8% market return
  const beta = 1.0;
  const informationRatio = alpha / 0.12; // Assuming 12% tracking error

  // Win/Loss statistics
  const realizedTransactions = transactions.filter(t => t.type === 'sell');
  const wins = realizedTransactions.filter(t => {
    const buyPrice = transactions.find(buy => buy.coinId === t.coinId && buy.date < t.date)?.price || 0;
    return t.price > buyPrice;
  });
  const losses = realizedTransactions.filter(t => !wins.includes(t));

  const winRate = realizedTransactions.length > 0 ? (wins.length / realizedTransactions.length) * 100 : 0;
  const averageWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.gainLoss || 0), 0) / wins.length : 0;
  const averageLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + (t.gainLoss || 0), 0) / losses.length : 0;
  const profitFactor = averageLoss !== 0 ? Math.abs(averageWin / averageLoss) : 0;

  return {
    totalReturn,
    annualizedReturn,
    alpha,
    beta,
    informationRatio,
    trackingError: 0.12, // Assumed
    winRate,
    averageWin,
    averageLoss,
    profitFactor
  };
}

// Main worker message handler
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, data, id } = event.data;
  const startTime = performance.now();

  try {
    let result: any;

    switch (type) {
      case 'metrics':
        result = calculatePortfolioMetrics(data.holdings, data.transactions);
        break;

      case 'volatility':
        result = calculateVolatilityMetrics(data.holdings, data.priceHistory);
        break;

      case 'diversification':
        result = calculateDiversificationMetrics(data.holdings);
        break;

      case 'risk-analysis':
        const volatility = calculateVolatilityMetrics(data.holdings, data.priceHistory);
        result = calculateRiskMetrics(data.holdings, volatility);
        break;

      case 'performance':
        result = calculatePerformanceMetrics(data.transactions, data.currentHoldings);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const executionTime = performance.now() - startTime;

    const response: WorkerResponse = {
      id,
      success: true,
      data: result,
      executionTime
    };

    self.postMessage(response);

  } catch (error) {
    const executionTime = performance.now() - startTime;

    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime
    };

    self.postMessage(response);
  }
});

// Health check
self.addEventListener('message', (event: MessageEvent) => {
  if (event.data === 'health-check') {
    self.postMessage({
      status: 'healthy',
      timestamp: Date.now(),
      version: '1.0.0'
    });
  }
});
