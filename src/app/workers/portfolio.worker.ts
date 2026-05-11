// Portfolio Web Worker for heavy calculations
// This worker handles portfolio metrics, volatility, and diversification calculations

export interface PortfolioCalculationRequest {
  type: 'metrics' | 'volatility' | 'diversification' | 'risk-analysis' | 'performance';
  data: any;
}

export interface PortfolioCalculationResponse {
  type: string;
  result: any;
  calculationTime: number;
  timestamp: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalROI: number;
  dayChange: number;
  dayChangePercent: number;
  bestPerformer: any;
  worstPerformer: any;
  holdingsCount: number;
}

export interface VolatilityAnalysis {
  portfolioVolatility: number;
  individualVolatility: Record<string, number>;
  correlationMatrix: Record<string, Record<string, number>>;
  beta: number;
  sharpeRatio: number;
  var95: number; // Value at Risk 95%
}

export interface DiversificationMetrics {
  herfindahlIndex: number;
  concentrationRisk: 'low' | 'medium' | 'high';
  sectorAllocation: Record<string, number>;
  geographicAllocation: Record<string, number>;
  diversificationScore: number;
  recommendations: string[];
}

export interface RiskAnalysis {
  portfolioRisk: 'low' | 'medium' | 'high';
  riskFactors: string[];
  maxDrawdown: number;
  volatility: number;
  downsideRisk: number;
  stressTestResults: any;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  alpha: number;
  beta: number;
  informationRatio: number;
  winRate: number;
  profitFactor: number;
}

// Web Worker message handler
self.onmessage = async function(event: MessageEvent<PortfolioCalculationRequest>) {
  const request = event.data;
  const startTime = performance.now();
  
  try {
    let result: any;
    
    switch (request.type) {
      case 'metrics':
        result = calculatePortfolioMetrics(request.data);
        break;
      case 'volatility':
        result = calculateVolatilityAnalysis(request.data);
        break;
      case 'diversification':
        result = calculateDiversificationMetrics(request.data);
        break;
      case 'risk-analysis':
        result = calculateRiskAnalysis(request.data);
        break;
      case 'performance':
        result = calculatePerformanceMetrics(request.data);
        break;
      default:
        throw new Error(`Unknown calculation type: ${request.type}`);
    }
    
    const calculationTime = performance.now() - startTime;
    
    const response: PortfolioCalculationResponse = {
      type: request.type,
      result,
      calculationTime,
      timestamp: Date.now()
    };
    
    self.postMessage(response);
    
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: (error as Error).message,
      calculationTime: performance.now() - startTime,
      timestamp: Date.now()
    });
  }
};

// Calculation functions
function calculatePortfolioMetrics(data: { holdings: any[]; currentPrices: Record<string, number> }): PortfolioMetrics {
  const { holdings, currentPrices } = data;
  
  let totalValue = 0;
  let totalInvested = 0;
  let dayChange = 0;
  let bestPerformer = null;
  let worstPerformer = null;
  let bestROI = -Infinity;
  let worstROI = Infinity;
  
  holdings.forEach(holding => {
    const currentPrice = currentPrices[holding.coinId] || 0;
    const currentValue = holding.amount * currentPrice;
    const investedValue = holding.amount * holding.avgBuyPrice;
    const pnl = currentValue - investedValue;
    const roi = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
    
    totalValue += currentValue;
    totalInvested += investedValue;
    dayChange += pnl;
    
    if (roi > bestROI) {
      bestROI = roi;
      bestPerformer = {
        coinId: holding.coinId,
        roi: roi,
        pnl: pnl,
        currentValue: currentValue
      };
    }
    
    if (roi < worstROI) {
      worstROI = roi;
      worstPerformer = {
        coinId: holding.coinId,
        roi: roi,
        pnl: pnl,
        currentValue: currentValue
      };
    }
  });
  
  const totalPnL = totalValue - totalInvested;
  const totalROI = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const dayChangePercent = totalInvested > 0 ? (dayChange / totalInvested) * 100 : 0;
  
  return {
    totalValue,
    totalInvested,
    totalPnL,
    totalROI,
    dayChange,
    dayChangePercent,
    bestPerformer,
    worstPerformer,
    holdingsCount: holdings.length
  };
}

function calculateVolatilityAnalysis(data: { holdings: any[]; priceHistory: Record<string, number[]> }): VolatilityAnalysis {
  const { holdings, priceHistory } = data;
  
  // Calculate daily returns for each holding
  const returns: Record<string, number[]> = {};
  const volatilities: Record<string, number> = {};
  
  holdings.forEach(holding => {
    const prices = priceHistory[holding.coinId] || [];
    if (prices.length < 2) return;
    
    const dailyReturns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
      dailyReturns.push(dailyReturn);
    }
    
    returns[holding.coinId] = dailyReturns;
    
    // Calculate volatility (standard deviation of returns)
    const mean = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / dailyReturns.length;
    volatilities[holding.coinId] = Math.sqrt(variance) * Math.sqrt(252); // Annualized
  });
  
  // Calculate correlation matrix
  const correlationMatrix: Record<string, Record<string, number>> = {};
  const coinIds = Object.keys(returns);
  
  coinIds.forEach(coin1 => {
    correlationMatrix[coin1] = {};
    coinIds.forEach(coin2 => {
      if (coin1 === coin2) {
        correlationMatrix[coin1][coin2] = 1;
      } else {
        const correlation = calculateCorrelation(returns[coin1], returns[coin2]);
        correlationMatrix[coin1][coin2] = correlation;
      }
    });
  });
  
  // Calculate portfolio volatility (weighted average)
  const portfolioVolatility = calculatePortfolioVolatility(holdings, volatilities, correlationMatrix);
  
  // Calculate Sharpe ratio (assuming risk-free rate of 2%)
  const riskFreeRate = 0.02;
  const expectedReturn = holdings.reduce((sum, holding) => {
    const currentPrice = priceHistory[holding.coinId]?.[0] || 0;
    const currentValue = holding.amount * currentPrice;
    const investedValue = holding.amount * holding.avgBuyPrice;
    const returnValue = (currentValue - investedValue) / investedValue;
    return sum + (currentValue / getTotalPortfolioValue(holdings, priceHistory)) * returnValue;
  }, 0);
  
  const sharpeRatio = portfolioVolatility > 0 ? (expectedReturn - riskFreeRate) / portfolioVolatility : 0;
  
  // Calculate Value at Risk (95%)
  const var95 = calculateVaR(holdings, priceHistory);
  
  // Calculate beta (relative to market)
  const beta = calculateBeta(holdings, priceHistory);
  
  return {
    portfolioVolatility,
    individualVolatility: volatilities,
    correlationMatrix,
    beta,
    sharpeRatio,
    var95
  };
}

function calculateDiversificationMetrics(data: { holdings: any[]; sectorData?: Record<string, string> }): DiversificationMetrics {
  const { holdings, sectorData = {} } = data;
  
  // Calculate Herfindahl-Hirschman Index (HHI)
  const totalValue = holdings.reduce((sum, holding) => sum + (holding.amount * 100), 0); // Assuming $100 per coin for simplicity
  const marketShares = holdings.map(holding => (holding.amount * 100) / totalValue);
  const hhi = marketShares.reduce((sum, share) => sum + Math.pow(share * 100, 2), 0);
  
  // Determine concentration risk
  let concentrationRisk: 'low' | 'medium' | 'high';
  if (hhi < 1000) concentrationRisk = 'low';
  else if (hhi < 2500) concentrationRisk = 'medium';
  else concentrationRisk = 'high';
  
  // Calculate sector allocation (mock data for demonstration)
  const sectorAllocation: Record<string, number> = {};
  holdings.forEach(holding => {
    const sector = sectorData[holding.coinId] || 'Unknown';
    sectorAllocation[sector] = (sectorAllocation[sector] || 0) + (holding.amount * 100);
  });
  
  // Calculate geographic allocation (mock data)
  const geographicAllocation: Record<string, number> = {
    'North America': 60,
    'Europe': 25,
    'Asia': 15
  };
  
  // Calculate diversification score
  const diversificationScore = Math.max(0, 100 - (hhi / 100));
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (concentrationRisk === 'high') {
    recommendations.push('Consider diversifying into more assets to reduce concentration risk');
  }
  if (Object.keys(sectorAllocation).length < 3) {
    recommendations.push('Consider adding assets from different sectors');
  }
  if (diversificationScore < 50) {
    recommendations.push('Portfolio is poorly diversified - consider rebalancing');
  }
  
  return {
    herfindahlIndex: hhi,
    concentrationRisk,
    sectorAllocation,
    geographicAllocation,
    diversificationScore,
    recommendations
  };
}

function calculateRiskAnalysis(data: { holdings: any[]; priceHistory: Record<string, number[]> }): RiskAnalysis {
  const { holdings, priceHistory } = data;
  
  // Calculate basic risk metrics
  const volatility = calculatePortfolioVolatility(holdings, {}, {});
  const maxDrawdown = calculateMaxDrawdown(priceHistory);
  const downsideRisk = calculateDownsideRisk(priceHistory);
  
  // Determine overall risk level
  let portfolioRisk: 'low' | 'medium' | 'high';
  if (volatility < 0.15) portfolioRisk = 'low';
  else if (volatility < 0.25) portfolioRisk = 'medium';
  else portfolioRisk = 'high';
  
  // Identify risk factors
  const riskFactors: string[] = [];
  if (volatility > 0.3) riskFactors.push('High volatility');
  if (maxDrawdown > 0.2) riskFactors.push('High maximum drawdown');
  if (holdings.length < 5) riskFactors.push('Low diversification');
  if (downsideRisk > 0.15) riskFactors.push('High downside risk');
  
  // Perform stress test (simple scenario analysis)
  const stressTestResults = performStressTest(holdings, priceHistory);
  
  return {
    portfolioRisk,
    riskFactors,
    maxDrawdown,
    volatility,
    downsideRisk,
    stressTestResults
  };
}

function calculatePerformanceMetrics(data: { holdings: any[]; priceHistory: Record<string, number[]>; benchmarkHistory?: number[] }): PerformanceMetrics {
  const { holdings, priceHistory, benchmarkHistory = [] } = data;
  
  // Calculate returns over time
  const portfolioReturnsArray: number[] = [];
  const benchmarkReturnsArray: number[] = [];
  
  // Mock calculation - in reality would use actual historical data
  const totalReturn = 0.25; // 25% total return
  const annualizedReturn = 0.12; // 12% annualized
  const volatility = 0.18; // 18% volatility
  const sharpeRatio = 0.67; // Sharpe ratio
  const maxDrawdown = 0.15; // 15% max drawdown
  const alpha = 0.03; // 3% alpha
  const beta = 1.1; // Beta
  const informationRatio = 0.45; // Information ratio
  const winRate = 0.65; // 65% win rate
  const profitFactor = 1.8; // Profit factor
  
  return {
    totalReturn,
    annualizedReturn,
    volatility,
    sharpeRatio,
    maxDrawdown,
    alpha,
    beta,
    informationRatio,
    winRate,
    profitFactor
  };
}

// Helper functions
function calculateCorrelation(returns1: number[], returns2: number[]): number {
  if (returns1.length !== returns2.length || returns1.length === 0) return 0;
  
  const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length;
  const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length;
  
  let numerator = 0;
  let variance1 = 0;
  let variance2 = 0;
  
  for (let i = 0; i < returns1.length; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;
    numerator += diff1 * diff2;
    variance1 += diff1 * diff1;
    variance2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(variance1 * variance2);
  return denominator === 0 ? 0 : numerator / denominator;
}

function calculatePortfolioVolatility(holdings: any[], volatilities: Record<string, number>, correlations: Record<string, Record<string, number>>): number {
  // Simplified calculation - in reality would use proper portfolio variance formula
  const weights = holdings.map(h => h.amount);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = weights.map(w => w / totalWeight);
  
  let portfolioVariance = 0;
  for (let i = 0; i < holdings.length; i++) {
    for (let j = 0; j < holdings.length; j++) {
      const weightI = normalizedWeights[i];
      const weightJ = normalizedWeights[j];
      const volI = volatilities[holdings[i].coinId] || 0.2;
      const volJ = volatilities[holdings[j].coinId] || 0.2;
      const correlation = correlations[holdings[i].coinId]?.[holdings[j].coinId] || (i === j ? 1 : 0);
      
      portfolioVariance += weightI * weightJ * volI * volJ * correlation;
    }
  }
  
  return Math.sqrt(portfolioVariance);
}

function getTotalPortfolioValue(holdings: any[], priceHistory: Record<string, number[]>): number {
  return holdings.reduce((sum, holding) => {
    const currentPrice = priceHistory[holding.coinId]?.[0] || 0;
    return sum + (holding.amount * currentPrice);
  }, 0);
}

function calculateVaR(holdings: any[], priceHistory: Record<string, number[]>): number {
  // Simplified VaR calculation - 95% confidence interval
  // In reality would use proper statistical methods
  const totalValue = getTotalPortfolioValue(holdings, priceHistory);
  return totalValue * 0.05; // Assume 5% VaR
}

function calculateBeta(holdings: any[], priceHistory: Record<string, number[]>): number {
  // Simplified beta calculation
  // In reality would calculate covariance with market returns
  return 1.0; // Default beta
}

function calculateMaxDrawdown(priceHistory: Record<string, number[]>): number {
  // Simplified max drawdown calculation
  const allPrices = Object.values(priceHistory).flat();
  if (allPrices.length < 2) return 0;
  
  let maxDrawdown = 0;
  let peak = allPrices[0];
  
  for (let i = 1; i < allPrices.length; i++) {
    if (allPrices[i] > peak) {
      peak = allPrices[i];
    } else {
      const drawdown = (peak - allPrices[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown;
}

function calculateDownsideRisk(priceHistory: Record<string, number[]>): number {
  // Simplified downside risk calculation
  const allPrices = Object.values(priceHistory).flat();
  if (allPrices.length < 2) return 0;
  
  let downsideReturns: number[] = [];
  for (let i = 1; i < allPrices.length; i++) {
    const returnValue = (allPrices[i] - allPrices[i - 1]) / allPrices[i - 1];
    if (returnValue < 0) {
      downsideReturns.push(returnValue);
    }
  }
  
  if (downsideReturns.length === 0) return 0;
  
  const mean = downsideReturns.reduce((sum, r) => sum + r, 0) / downsideReturns.length;
  const variance = downsideReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / downsideReturns.length;
  
  return Math.sqrt(variance) * Math.sqrt(252); // Annualized
}

function performStressTest(holdings: any[], priceHistory: Record<string, number[]>): any {
  // Simplified stress test - simulate market crash scenario
  const crashScenario = -0.3; // 30% market crash
  const totalValue = getTotalPortfolioValue(holdings, priceHistory);
  const stressedValue = totalValue * (1 + crashScenario);
  
  return {
    scenario: 'Market Crash (-30%)',
    portfolioImpact: stressedValue - totalValue,
    percentImpact: crashScenario * 100,
    recoveryTime: '12-18 months (estimated)'
  };
}

export {};
