import { Injectable, signal, computed, inject } from '@angular/core';
import { IndexedDbService } from '../../../infrastructure/persistence/indexed-db.service';
import { Transaction, Holding, Allocation } from '../../../domain/models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class PortfolioStore {
  private indexedDb = inject(IndexedDbService);

  private _transactions = signal<Transaction[]>([]);
  private _isLoading = signal(false);
  private _prices = signal<Record<string, number>>({});

  transactions = this._transactions.asReadonly();
  isLoading = this._isLoading.asReadonly();

  holdings = computed<Holding[]>(() => {
    const txMap = new Map<string, { totalAmount: number; totalCost: number }>();

    for (const tx of this._transactions()) {
      const existing = txMap.get(tx.coinId) ?? { totalAmount: 0, totalCost: 0 };
      if (tx.type === 'buy') {
        existing.totalAmount += tx.amount;
        existing.totalCost += tx.amount * tx.price;
      } else {
        const avgPrice = existing.totalAmount > 0 ? existing.totalCost / existing.totalAmount : 0;
        existing.totalAmount -= tx.amount;
        existing.totalCost -= tx.amount * avgPrice;
      }
      txMap.set(tx.coinId, existing);
    }

    return Array.from(txMap.entries())
      .filter(([, data]) => data.totalAmount > 0.00000001)
      .map(([coinId, data]) => ({
        coinId,
        amount: data.totalAmount,
        avgBuyPrice: data.totalCost / data.totalAmount
      }));
  });

  totalInvested = computed(() => {
    return this.holdings().reduce((sum, h) => sum + h.amount * h.avgBuyPrice, 0);
  });

  currentValue = computed(() => {
    const prices = this._prices();
    return this.holdings().reduce((sum, h) => {
      const price = prices[h.coinId] ?? h.avgBuyPrice;
      return sum + h.amount * price;
    }, 0);
  });

  pnl = computed(() => this.currentValue() - this.totalInvested());

  roi = computed(() => {
    const invested = this.totalInvested();
    if (invested === 0) return 0;
    return (this.pnl() / invested) * 100;
  });

  allocation = computed<Allocation[]>(() => {
    const total = this.currentValue();
    if (total === 0) return [];

    const prices = this._prices();
    return this.holdings().map(h => {
      const price = prices[h.coinId] ?? h.avgBuyPrice;
      const value = h.amount * price;
      return {
        coinId: h.coinId,
        percentage: (value / total) * 100,
        value
      };
    }).sort((a, b) => b.percentage - a.percentage);
  });

  constructor() {
    this.loadFromStorage();
  }

  updatePrices(prices: Record<string, number>): void {
    this._prices.set(prices);
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    const updated = [...this._transactions(), transaction];
    this._transactions.set(updated);
    await this.persistTransactions(updated);
  }

  async removeTransaction(id: string): Promise<void> {
    const updated = this._transactions().filter(t => t.id !== id);
    this._transactions.set(updated);
    await this.persistTransactions(updated);
  }

  async exportPortfolio(): Promise<string> {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions: this._transactions()
    }, null, 2);
  }

  async importPortfolio(jsonString: string): Promise<void> {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.transactions)) {
        this._transactions.set(parsed.transactions);
        await this.persistTransactions(parsed.transactions);
      } else if (Array.isArray(parsed)) {
        this._transactions.set(parsed);
        await this.persistTransactions(parsed);
      } else {
        throw new Error('Invalid portfolio format');
      }
    } catch {
      throw new Error('Failed to parse portfolio data');
    }
  }

  private async loadFromStorage(): Promise<void> {
    this._isLoading.set(true);
    try {
      const stored = await this.indexedDb.getAll('transactions');
      if (stored.length > 0) {
        this._transactions.set(stored);
      }
    } catch {
      // Storage unavailable
    } finally {
      this._isLoading.set(false);
    }
  }

  private async persistTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await this.indexedDb.clear('transactions');
      for (const tx of transactions) {
        await this.indexedDb.set('transactions', tx.id, tx);
      }
    } catch {
      // Storage unavailable
    }
  }
}
