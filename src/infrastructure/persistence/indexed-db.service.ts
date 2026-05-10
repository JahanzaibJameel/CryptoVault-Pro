import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { Transaction } from '../../domain/models/transaction.model';

interface CryptoVaultDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-coin': string;
      'by-date': number;
      'by-type': 'buy' | 'sell';
    };
  };
  watchlist: {
    key: number;
    value: { id: number; coinId: string };
    indexes: {
      'by-order': number;
    };
  };
  priceHistory: {
    key: string;
    value: {
      coinId: string;
      prices: { time: number; price: number }[];
      lastUpdated: number;
    };
    indexes: {
      'by-coin': string;
      'by-updated': number;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private db: IDBPDatabase<CryptoVaultDB> | null = null;
  private readonly DB_NAME = 'crypto-vault-db';
  private readonly DB_VERSION = 1;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      this.db = await openDB<CryptoVaultDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Transactions store
          if (!db.objectStoreNames.contains('transactions')) {
            const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
            transactionStore.createIndex('by-coin', 'coinId');
            transactionStore.createIndex('by-date', 'date');
            transactionStore.createIndex('by-type', 'type');
          }

          // Watchlist store
          if (!db.objectStoreNames.contains('watchlist')) {
            const watchlistStore = db.createObjectStore('watchlist', { keyPath: 'id', autoIncrement: true });
            watchlistStore.createIndex('by-order', 'id');
          }

          // Price history store
          if (!db.objectStoreNames.contains('priceHistory')) {
            const priceHistoryStore = db.createObjectStore('priceHistory', { keyPath: 'coinId' });
            priceHistoryStore.createIndex('by-coin', 'coinId');
            priceHistoryStore.createIndex('by-updated', 'lastUpdated');
          }

          // Settings store
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw error;
    }
  }

  private async ensureDb(): Promise<IDBPDatabase<CryptoVaultDB>> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  // Transaction methods
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    const db = await this.ensureDb();
    const tx = db.transaction('transactions', 'readwrite');
    
    // Clear existing transactions
    await tx.store.clear();
    
    // Add all transactions
    for (const transaction of transactions) {
      await tx.store.put(transaction);
    }
    
    await tx.done;
  }

  async getTransactions(): Promise<Transaction[]> {
    const db = await this.ensureDb();
    return await db.getAll('transactions');
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    const db = await this.ensureDb();
    await db.add('transactions', transaction);
  }

  async removeTransaction(transactionId: string): Promise<void> {
    const db = await this.ensureDb();
    await db.delete('transactions', transactionId);
  }

  async getTransactionsByCoin(coinId: string): Promise<Transaction[]> {
    const db = await this.ensureDb();
    return await db.getAllFromIndex('transactions', 'by-coin', coinId);
  }

  async getTransactionsByDateRange(startDate: number, endDate: number): Promise<Transaction[]> {
    const db = await this.ensureDb();
    const tx = db.transaction('transactions', 'readonly');
    const index = tx.store.index('by-date');
    
    const transactions: Transaction[] = [];
    let cursor = await index.openCursor(IDBKeyRange.bound(startDate, endDate));
    
    while (cursor) {
      transactions.push(cursor.value);
      cursor = await cursor.continue();
    }
    
    return transactions;
  }

  // Watchlist methods
  async saveWatchlist(coinIds: string[]): Promise<void> {
    const db = await this.ensureDb();
    const tx = db.transaction('watchlist', 'readwrite');
    
    // Clear existing watchlist
    await tx.store.clear();
    
    // Add all coin IDs
    for (let i = 0; i < coinIds.length; i++) {
      await tx.store.put({ id: i, coinId: coinIds[i] });
    }
    
    await tx.done;
  }

  async getWatchlist(): Promise<string[]> {
    const db = await this.ensureDb();
    const watchlistItems = await db.getAll('watchlist');
    return watchlistItems.map(item => item.coinId);
  }

  async addToWatchlist(coinId: string): Promise<void> {
    const db = await this.ensureDb();
    const watchlist = await this.getWatchlist();
    
    if (!watchlist.includes(coinId)) {
      watchlist.push(coinId);
      await this.saveWatchlist(watchlist);
    }
  }

  async removeFromWatchlist(coinId: string): Promise<void> {
    const db = await this.ensureDb();
    const watchlist = await this.getWatchlist();
    const filteredWatchlist = watchlist.filter(id => id !== coinId);
    await this.saveWatchlist(filteredWatchlist);
  }

  // Price history methods
  async savePriceHistory(coinId: string, prices: { time: number; price: number }[]): Promise<void> {
    const db = await this.ensureDb();
    await db.put('priceHistory', {
      coinId,
      prices,
      lastUpdated: Date.now()
    });
  }

  async getPriceHistory(coinId: string): Promise<{ time: number; price: number }[]> {
    const db = await this.ensureDb();
    const result = await db.get('priceHistory', coinId);
    return result?.prices || [];
  }

  async getAllPriceHistory(): Promise<{ [coinId: string]: { time: number; price: number }[] }> {
    const db = await this.ensureDb();
    const allHistory = await db.getAll('priceHistory');
    const result: { [coinId: string]: { time: number; price: number }[] } = {};
    
    for (const entry of allHistory) {
      result[entry.coinId] = entry.prices;
    }
    
    return result;
  }

  async clearOldPriceHistory(maxAgeDays = 30): Promise<void> {
    const db = await this.ensureDb();
    const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    const tx = db.transaction('priceHistory', 'readwrite');
    
    let cursor = await tx.store.index('by-updated').openCursor(IDBKeyRange.upperBound(cutoffTime));
    
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    
    await tx.done;
  }

  // Settings methods
  async saveSetting(key: string, value: any): Promise<void> {
    const db = await this.ensureDb();
    await db.put('settings', { key, value });
  }

  async getSetting(key: string): Promise<any> {
    const db = await this.ensureDb();
    const result = await db.get('settings', key);
    return result?.value;
  }

  async getAllSettings(): Promise<{ [key: string]: any }> {
    const db = await this.ensureDb();
    const allSettings = await db.getAll('settings');
    const result: { [key: string]: any } = {};
    
    for (const setting of allSettings) {
      result[setting.key] = setting.value;
    }
    
    return result;
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    const db = await this.ensureDb();
    const tx = db.transaction(['transactions', 'watchlist', 'priceHistory', 'settings'], 'readwrite');
    
    await Promise.all([
      tx.objectStore('transactions').clear(),
      tx.objectStore('watchlist').clear(),
      tx.objectStore('priceHistory').clear(),
      tx.objectStore('settings').clear()
    ]);
    
    await tx.done;
  }

  async exportData(): Promise<{
    transactions: Transaction[];
    watchlist: string[];
    priceHistory: { [coinId: string]: { time: number; price: number }[] };
    settings: { [key: string]: any };
  }> {
    const [transactions, watchlist, priceHistory, settings] = await Promise.all([
      this.getTransactions(),
      this.getWatchlist(),
      this.getAllPriceHistory(),
      this.getAllSettings()
    ]);

    return {
      transactions,
      watchlist,
      priceHistory,
      settings
    };
  }

  async importData(data: {
    transactions?: Transaction[];
    watchlist?: string[];
    priceHistory?: { [coinId: string]: { time: number; price: number }[] };
    settings?: { [key: string]: any };
  }): Promise<void> {
    const db = await this.ensureDb();
    const tx = db.transaction(['transactions', 'watchlist', 'priceHistory', 'settings'], 'readwrite');

    if (data.transactions) {
      await tx.objectStore('transactions').clear();
      for (const transaction of data.transactions) {
        await tx.objectStore('transactions').put(transaction);
      }
    }

    if (data.watchlist) {
      await tx.objectStore('watchlist').clear();
      for (let i = 0; i < data.watchlist.length; i++) {
        await tx.objectStore('watchlist').put({ id: i, coinId: data.watchlist[i] });
      }
    }

    if (data.priceHistory) {
      await tx.objectStore('priceHistory').clear();
      for (const [coinId, prices] of Object.entries(data.priceHistory)) {
        await tx.objectStore('priceHistory').put({
          coinId,
          prices,
          lastUpdated: Date.now()
        });
      }
    }

    if (data.settings) {
      await tx.objectStore('settings').clear();
      for (const [key, value] of Object.entries(data.settings)) {
        await tx.objectStore('settings').put({ key, value });
      }
    }

    await tx.done;
  }

  getDbInfo(): { name: string; version: number; ready: boolean } {
    return {
      name: this.DB_NAME,
      version: this.DB_VERSION,
      ready: this.db !== null
    };
  }
}
