import { Injectable, signal, computed, inject } from '@angular/core';
import { Holding, Transaction, PortfolioState, AllocationItem } from '../../../domain/models';
import { calculatePnL, calculateAllocation, calculateROI } from '../../../domain/services/portfolio-metrics';
import { IndexedDbService } from '../../../infrastructure/persistence/indexed-db.service';

@Injectable({ providedIn: 'root' })
export class PortfolioStore {
  private indexedDb = inject(IndexedDbService);
  
  private state = signal<PortfolioState>({
    holdings: [],
    transactions: [],
    totalInvested: 0,
    currentValue: 0,
    pnl: 0,
    allocation: [],
  });

  // Selectors
  holdings = computed(() => this.state().holdings);
  transactions = computed(() => this.state().transactions);
  totalInvested = computed(() => this.state().totalInvested);
  currentValue = computed(() => this.state().currentValue);
  pnl = computed(() => this.state().pnl);
  allocation = computed(() => this.state().allocation);
  roi = computed(() => calculateROI(this.state().holdings, this.getCurrentPrices()));
  isLoading = signal(true);

  constructor() {
    this.hydrateFromDb();
  }

  async addTransaction(tx: Transaction) {
    this.state.update(s => {
      const newHoldings = this.recalculateHoldings(s.holdings, tx);
      const newTransactions = [...s.transactions, tx];
      return this.computeState(newHoldings, newTransactions);
    });
    
    await this.indexedDb.saveTransactions(this.transactions());
  }

  async removeTransaction(transactionId: string) {
    this.state.update(s => {
      const newTransactions = s.transactions.filter(tx => tx.id !== transactionId);
      const newHoldings = this.rebuildHoldingsFromTransactions(newTransactions);
      return this.computeState(newHoldings, newTransactions);
    });
    
    await this.indexedDb.saveTransactions(this.transactions());
  }

  updatePrices(prices: Record<string, number>) {
    this.state.update(s => {
      const { pnl, currentValue, totalInvested } = calculatePnL(s.holdings, prices);
      const allocation = calculateAllocation(s.holdings, prices);
      return { ...s, pnl, currentValue, totalInvested, allocation };
    });
  }

  async exportPortfolio(): Promise<string> {
    return JSON.stringify({
      transactions: this.transactions(),
      holdings: this.holdings(),
      exportDate: Date.now(),
    }, null, 2);
  }

  async importPortfolio(jsonData: string) {
    try {
      const data = JSON.parse(jsonData);
      const transactions = data.transactions || [];
      const holdings = data.holdings || [];
      
      this.state.update(() => this.computeState(holdings, transactions));
      await this.indexedDb.saveTransactions(transactions);
    } catch (error) {
      throw new Error('Invalid portfolio data format');
    }
  }

  private recalculateHoldings(holdings: Holding[], tx: Transaction): Holding[] {
    const existingHolding = holdings.find(h => h.coinId === tx.coinId);
    
    if (tx.type === 'buy') {
      if (existingHolding) {
        const totalAmount = existingHolding.amount + tx.amount;
        const totalCost = (existingHolding.amount * existingHolding.avgBuyPrice) + (tx.amount * tx.price);
        const newAvgPrice = totalCost / totalAmount;
        
        return holdings.map(h => 
          h.coinId === tx.coinId 
            ? { ...h, amount: totalAmount, avgBuyPrice: newAvgPrice }
            : h
        );
      } else {
        return [...holdings, { coinId: tx.coinId, amount: tx.amount, avgBuyPrice: tx.price }];
      }
    } else { // sell
      if (!existingHolding || existingHolding.amount < tx.amount) {
        throw new Error('Insufficient holdings for sell transaction');
      }
      
      const newAmount = existingHolding.amount - tx.amount;
      if (newAmount === 0) {
        return holdings.filter(h => h.coinId !== tx.coinId);
      }
      
      return holdings.map(h => 
        h.coinId === tx.coinId 
          ? { ...h, amount: newAmount }
          : h
      );
    }
  }

  private rebuildHoldingsFromTransactions(transactions: Transaction[]): Holding[] {
    const holdings: Holding[] = [];
    
    // Sort transactions by date to ensure correct order
    const sortedTransactions = [...transactions].sort((a, b) => a.date - b.date);
    
    for (const tx of sortedTransactions) {
      try {
        const newHoldings = this.recalculateHoldings(holdings, tx);
        holdings.length = 0; // Clear array
        holdings.push(...newHoldings);
      } catch (error) {
        console.warn('Skipping invalid transaction:', tx, error);
      }
    }
    
    return holdings;
  }

  private computeState(holdings: Holding[], transactions: Transaction[]): PortfolioState {
    const prices = this.getCurrentPrices();
    const { pnl, currentValue, totalInvested } = calculatePnL(holdings, prices);
    const allocation = calculateAllocation(holdings, prices);
    
    return {
      holdings,
      transactions,
      totalInvested,
      currentValue,
      pnl,
      allocation,
    };
  }

  private getCurrentPrices(): Record<string, number> {
    // This would be updated by market data store
    // For now, return empty object
    return {};
  }

  private async hydrateFromDb() {
    try {
      const txs = await this.indexedDb.getTransactions();
      const holdings = this.rebuildHoldingsFromTransactions(txs);
      this.state.set(this.computeState(holdings, txs));
    } catch (error) {
      console.error('Failed to hydrate portfolio from DB:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
