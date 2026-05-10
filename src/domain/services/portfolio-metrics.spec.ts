import { describe, it, expect } from '@jest/globals';
import { calculatePnL, calculateVolatility, diversificationScore, calculateROI } from './portfolio-metrics';
import { Holding } from '../models/holding.model';

describe('Portfolio Metrics', () => {
  const mockHoldings: Holding[] = [
    { coinId: 'bitcoin', amount: 1, avgBuyPrice: 30000 },
    { coinId: 'ethereum', amount: 10, avgBuyPrice: 2000 },
    { coinId: 'cardano', amount: 1000, avgBuyPrice: 0.5 }
  ];

  const mockPrices: Record<string, number> = {
    'bitcoin': 35000,
    'ethereum': 2500,
    'cardano': 0.6
  };

  describe('calculatePnL', () => {
    it('should calculate correct P&L for profitable portfolio', () => {
      const result = calculatePnL(mockHoldings, mockPrices);
      
      expect(result.currentValue).toBe(35000 + 10 * 2500 + 1000 * 0.6); // 35000 + 25000 + 600 = 60600
      expect(result.totalInvested).toBe(30000 + 10 * 2000 + 1000 * 0.5); // 30000 + 20000 + 500 = 50500
      expect(result.pnl).toBe(60600 - 50500); // 10100 profit
    });

    it('should handle empty holdings array', () => {
      const result = calculatePnL([], mockPrices);
      
      expect(result.currentValue).toBe(0);
      expect(result.totalInvested).toBe(0);
      expect(result.pnl).toBe(0);
    });

    it('should handle missing prices gracefully', () => {
      const result = calculatePnL(mockHoldings, {});
      
      expect(result.currentValue).toBe(0);
      expect(result.totalInvested).toBe(50500);
      expect(result.pnl).toBe(-50500); // All value lost due to missing prices
    });
  });

  describe('calculateVolatility', () => {
    it('should return 0 for stable prices', () => {
      const stablePrices = [100, 100, 100, 100, 100];
      const volatility = calculateVolatility(stablePrices);
      
      expect(volatility).toBe(0);
    });

    it('should calculate positive volatility for varying prices', () => {
      const varyingPrices = [100, 110, 90, 120, 80];
      const volatility = calculateVolatility(varyingPrices);
      
      expect(volatility).toBeGreaterThan(0);
      expect(volatility).toBeLessThan(1);
    });

    it('should handle single price point', () => {
      const singlePrice = [100];
      const volatility = calculateVolatility(singlePrice);
      
      expect(volatility).toBe(0);
    });

    it('should handle empty array', () => {
      const volatility = calculateVolatility([]);
      
      expect(volatility).toBe(0);
    });
  });

  describe('diversificationScore', () => {
    it('should return 100 for perfectly diversified portfolio', () => {
      const diversified = [
        { percentage: 25 },
        { percentage: 25 },
        { percentage: 25 },
        { percentage: 25 }
      ];
      const score = diversificationScore(diversified);
      
      expect(score).toBe(100);
    });

    it('should return 0 for concentrated portfolio', () => {
      const concentrated = [
        { percentage: 100 }
      ];
      const score = diversificationScore(concentrated);
      
      expect(score).toBe(0);
    });

    it('should return moderate score for semi-diversified portfolio', () => {
      const semiDiversified = [
        { percentage: 60 },
        { percentage: 40 }
      ];
      const score = diversificationScore(semiDiversified);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });
  });

  describe('calculateROI', () => {
    it('should calculate positive ROI for profitable portfolio', () => {
      const roi = calculateROI(mockHoldings, mockPrices);
      
      expect(roi).toBeGreaterThan(0);
      expect(roi).toBeCloseTo(20, 1); // ~20% ROI
    });

    it('should return 0 for zero investment', () => {
      const zeroInvestment = mockHoldings.map(h => ({ ...h, avgBuyPrice: 0 }));
      const roi = calculateROI(zeroInvestment, mockPrices);
      
      expect(roi).toBe(0);
    });

    it('should handle negative ROI for losses', () => {
      const lossPrices = {
        'bitcoin': 25000, // 20% loss
        'ethereum': 1500, // 25% loss
        'cardano': 0.4   // 20% loss
      };
      const roi = calculateROI(mockHoldings, lossPrices);
      
      expect(roi).toBeLessThan(0);
    });
  });
});
