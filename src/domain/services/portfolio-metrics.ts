import { Holding } from '../models/holding.model';
import { AllocationItem } from '../models/portfolio-state.model';
import { Coin } from '../models/coin.model';

export interface PortfolioHolding {
  coin: Coin;
  quantity: number;
  averageBuyPrice: number;
  totalInvested: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercentage: number;
  riskScore?: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercentage: number;
  bestPerformer: PortfolioHolding | null;
  worstPerformer: PortfolioHolding | null;
  holdings: PortfolioHolding[];
  riskScore: number;
  diversificationScore: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  beta?: number;
  alpha?: number;
}

export interface RiskProfile {
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive' | 'Very Aggressive';
  riskScore: number;
  recommendedAllocation: {
    largeCap: number; // BTC, ETH
    midCap: number;  // Top 20-50
    smallCap: number; // Rest
  };
}

export interface RebalanceSuggestion {
  coin: string;
  currentAllocation: number;
  targetAllocation: number;
  recommendedAction: 'BUY' | 'SELL' | 'HOLD';
  amount: number;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function calculatePnL(holdings: Holding[], currentPrices: Record<string, number>): { 
  pnl: number; 
  currentValue: number;
  totalInvested: number;
} {
  const currentValue = holdings.reduce((sum, h) => sum + h.amount * (currentPrices[h.coinId] ?? 0), 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.amount * h.avgBuyPrice, 0);
  const pnl = currentValue - totalInvested;
  
  return { pnl, currentValue, totalInvested };
}

export function calculateVolatility(priceHistory: number[]): number {
  if (priceHistory.length < 2) return 0;
  
  const returns = priceHistory.slice(1).map((p, i) => (p - priceHistory[i]) / priceHistory[i]);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length;
  
  return Math.sqrt(variance);
}

export function diversificationScore(allocations: { percentage: number }[]): number {
  if (allocations.length === 0) {
    return 0;
  }

  if (allocations.length === 1) {
    return 0;
  }

  // Herfindahl-Hirschman index normalized so equal weights score 100.
  const hhi = allocations.reduce((sum, allocation) => sum + (allocation.percentage / 100) ** 2, 0);
  const minHhi = 1 / allocations.length;

  return Math.round(((1 - hhi) / (1 - minHhi)) * 100);
}

export function calculateAllocation(holdings: Holding[], currentPrices: Record<string, number>): AllocationItem[] {
  const totalValue = holdings.reduce((sum, h) => sum + h.amount * (currentPrices[h.coinId] ?? 0), 0);
  
  if (totalValue === 0) return [];
  
  return holdings.map(holding => {
    const value = holding.amount * (currentPrices[holding.coinId] ?? 0);
    const percentage = (value / totalValue) * 100;
    
    return {
      coinId: holding.coinId,
      percentage: Math.round(percentage * 100) / 100,
      value: Math.round(value * 100) / 100,
    };
  }).filter(item => item.value > 0);
}

export function calculateRiskScore(holdings: Holding[], priceHistory: Record<string, number[]>): number {
  if (holdings.length === 0) return 0;
  
  const volatilities = holdings.map(holding => {
    const history = priceHistory[holding.coinId] || [];
    return calculateVolatility(history);
  });
  
  const avgVolatility = volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length;
  const diversification = diversificationScore(
    holdings.map(() => ({ percentage: 100 / holdings.length }))
  );
  
  // Risk score: 0-100, higher is riskier
  const volatilityScore = Math.min(avgVolatility * 100, 70); // Cap at 70
  const concentrationRisk = Math.max(0, 100 - diversification); // Higher concentration = higher risk
  
  return Math.round((volatilityScore + concentrationRisk) / 2);
}

export function calculateROI(holdings: Holding[], currentPrices: Record<string, number>): number {
  const { pnl, totalInvested } = calculatePnL(holdings, currentPrices);
  
  if (totalInvested === 0) return 0;
  
  return (pnl / totalInvested) * 100;
}

// Enhanced Sharpe Ratio calculation
export function calculateSharpeRatio(holdings: Holding[], currentPrices: Record<string, number>, priceHistory: Record<string, number[]>, riskFreeRate: number = 0.02): number {
  if (holdings.length === 0) return 0;
  
  const portfolioReturns: number[] = [];
  
  // Calculate daily returns for each holding
  for (const holding of holdings) {
    const history = priceHistory[holding.coinId] || [];
    if (history.length < 2) continue;
    
    for (let i = 1; i < history.length; i++) {
      const dailyReturn = (history[i] - history[i-1]) / history[i-1];
      portfolioReturns.push(dailyReturn * (holding.amount * (currentPrices[holding.coinId] ?? 0)));
    }
  }
  
  if (portfolioReturns.length === 0) return 0;
  
  const meanReturn = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
  const variance = portfolioReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / portfolioReturns.length;
  const volatility = Math.sqrt(variance);
  
  // Annualized Sharpe Ratio
  const annualizedReturn = meanReturn * 365;
  const annualizedVolatility = volatility * Math.sqrt(365);
  
  return annualizedVolatility === 0 ? 0 : (annualizedReturn - riskFreeRate) / annualizedVolatility;
}

// Maximum Drawdown calculation
export function calculateMaxDrawdown(priceHistory: number[]): number {
  if (priceHistory.length < 2) return 0;
  
  let maxDrawdown = 0;
  let peak = priceHistory[0];
  
  for (let i = 1; i < priceHistory.length; i++) {
    if (priceHistory[i] > peak) {
      peak = priceHistory[i];
    }
    
    const drawdown = ((peak - priceHistory[i]) / peak) * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }
  
  return maxDrawdown;
}

// Enhanced portfolio metrics
export function calculateEnhancedPortfolioMetrics(
  holdings: Holding[], 
  currentPrices: Record<string, number>,
  priceHistory: Record<string, number[]>
): PortfolioMetrics {
  if (holdings.length === 0) {
    return getEmptyPortfolioMetrics();
  }
  
  const portfolioHoldings = holdings.map(holding => {
    const coin: Coin = {
      id: holding.coinId,
      symbol: holding.coinId.toUpperCase(),
      name: holding.coinId, // Would come from actual coin data
      image: '', // Would come from actual coin data
      currentPrice: currentPrices[holding.coinId] || 0,
      marketCap: 0, // Would come from actual coin data
      priceChange24h: 0 // Would come from actual coin data
    };
    
    const currentValue = holding.amount * (currentPrices[holding.coinId] || 0);
    const totalInvested = holding.amount * holding.avgBuyPrice;
    const unrealizedPnL = currentValue - totalInvested;
    const unrealizedPnLPercentage = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;
    
    return {
      coin,
      quantity: holding.amount,
      averageBuyPrice: holding.avgBuyPrice,
      totalInvested,
      currentValue,
      unrealizedPnL,
      unrealizedPnLPercentage
    };
  });
  
  const totalValue = portfolioHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalInvested = portfolioHoldings.reduce((sum, h) => sum + h.totalInvested, 0);
  const totalPnL = totalValue - totalInvested;
  const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  
  const bestPerformer = portfolioHoldings.reduce((best, current) => 
    !best || current.unrealizedPnLPercentage > best.unrealizedPnLPercentage ? current : best
  , portfolioHoldings[0]);
  
  const worstPerformer = portfolioHoldings.reduce((worst, current) => 
    !worst || current.unrealizedPnLPercentage < worst.unrealizedPnLPercentage ? current : worst
  , portfolioHoldings[0]);
  
  return {
    totalValue,
    totalInvested,
    totalPnL,
    totalPnLPercentage,
    bestPerformer,
    worstPerformer,
    holdings: portfolioHoldings,
    riskScore: calculateRiskScore(holdings, priceHistory),
    diversificationScore: diversificationScore(
      holdings.map(() => ({ percentage: 100 / holdings.length }))
    ),
    sharpeRatio: calculateSharpeRatio(holdings, currentPrices, priceHistory),
    maxDrawdown: calculatePortfolioMaxDrawdown(priceHistory),
    volatility: calculatePortfolioVolatility(holdings, priceHistory)
  };
}

// Calculate portfolio-level maximum drawdown
function calculatePortfolioMaxDrawdown(priceHistory: Record<string, number[]>): number {
  const allDrawdowns: number[] = [];
  
  for (const [coinId, history] of Object.entries(priceHistory)) {
    if (history.length > 1) {
      allDrawdowns.push(calculateMaxDrawdown(history));
    }
  }
  
  return allDrawdowns.length > 0 ? Math.max(...allDrawdowns) : 0;
}

// Calculate portfolio volatility
function calculatePortfolioVolatility(holdings: Holding[], priceHistory: Record<string, number[]>): number {
  if (holdings.length === 0) return 0;
  
  const volatilities = holdings.map(holding => {
    const history = priceHistory[holding.coinId] || [];
    return calculateVolatility(history);
  });
  
  return volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length;
}

// Get risk profile
export function getRiskProfile(holdings: Holding[], priceHistory: Record<string, number[]>): RiskProfile {
  const riskScore = calculateRiskScore(holdings, priceHistory);
  
  if (riskScore < 20) {
    return {
      riskLevel: 'Conservative',
      riskScore,
      recommendedAllocation: { largeCap: 70, midCap: 25, smallCap: 5 }
    };
  } else if (riskScore < 40) {
    return {
      riskLevel: 'Moderate',
      riskScore,
      recommendedAllocation: { largeCap: 50, midCap: 35, smallCap: 15 }
    };
  } else if (riskScore < 60) {
    return {
      riskLevel: 'Aggressive',
      riskScore,
      recommendedAllocation: { largeCap: 30, midCap: 40, smallCap: 30 }
    };
  } else {
    return {
      riskLevel: 'Very Aggressive',
      riskScore,
      recommendedAllocation: { largeCap: 20, midCap: 30, smallCap: 50 }
    };
  }
}

// Generate rebalancing suggestions
export function generateRebalanceSuggestions(
  holdings: Holding[],
  currentPrices: Record<string, number>,
  targetAllocation?: { [symbol: string]: number }
): RebalanceSuggestion[] {
  if (holdings.length === 0) return [];
  
  const portfolioHoldings = holdings.map(holding => ({
    coin: {
      id: holding.coinId,
      symbol: holding.coinId.toUpperCase(),
      name: holding.coinId,
      image: '',
      currentPrice: currentPrices[holding.coinId] || 0,
      marketCap: 0,
      priceChange24h: 0
    },
    quantity: holding.amount,
    averageBuyPrice: holding.avgBuyPrice,
    totalInvested: holding.amount * holding.avgBuyPrice,
    currentValue: holding.amount * (currentPrices[holding.coinId] || 0),
    unrealizedPnL: 0,
    unrealizedPnLPercentage: 0
  }));
  
  const totalValue = portfolioHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const suggestions: RebalanceSuggestion[] = [];
  
  // If no target allocation provided, use equal allocation
  const defaultTarget = 100 / holdings.length;
  
  for (const holding of portfolioHoldings) {
    const targetPercent = targetAllocation?.[holding.coin.symbol] || defaultTarget;
    const currentPercent = (holding.currentValue / totalValue) * 100;
    const difference = targetPercent - currentPercent;
    
    let action: 'BUY' | 'SELL' | 'HOLD';
    let amount = 0;
    let reason = '';
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    
    if (Math.abs(difference) < 5) {
      action = 'HOLD';
      reason = 'Allocation is within target range';
    } else if (difference > 0) {
      action = 'BUY';
      amount = (totalValue * difference / 100) - holding.currentValue;
      reason = `Underweight by ${difference.toFixed(1)}%`;
      priority = Math.abs(difference) > 15 ? 'HIGH' : Math.abs(difference) > 10 ? 'MEDIUM' : 'LOW';
    } else {
      action = 'SELL';
      amount = holding.currentValue - (totalValue * Math.abs(difference) / 100);
      reason = `Overweight by ${Math.abs(difference).toFixed(1)}%`;
      priority = Math.abs(difference) > 15 ? 'HIGH' : Math.abs(difference) > 10 ? 'MEDIUM' : 'LOW';
    }
    
    suggestions.push({
      coin: holding.coin.symbol,
      currentAllocation: currentPercent,
      targetAllocation: targetPercent,
      recommendedAction: action,
      amount: Math.abs(amount),
      reason,
      priority
    });
  }
  
  return suggestions.sort((a, b) => {
    const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function getEmptyPortfolioMetrics(): PortfolioMetrics {
  return {
    totalValue: 0,
    totalInvested: 0,
    totalPnL: 0,
    totalPnLPercentage: 0,
    bestPerformer: null,
    worstPerformer: null,
    holdings: [],
    riskScore: 0,
    diversificationScore: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    volatility: 0
  };
}
