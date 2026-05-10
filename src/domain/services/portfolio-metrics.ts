import { Holding } from '../models/holding.model';
import { AllocationItem } from '../models/portfolio-state.model';

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
  // Herfindahl-Hirschman index inverse
  const hhi = allocations.reduce((sum, a) => sum + (a.percentage / 100) ** 2, 0);
  return Math.round((1 - hhi) * 100);
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
