import { Injectable, signal, inject } from '@angular/core';
import { IndexedDbService } from '../../../infrastructure/persistence/indexed-db.service';

@Injectable({
  providedIn: 'root'
})
export class WatchlistStore {
  private indexedDb = inject(IndexedDbService);

  private _coins = signal<string[]>([]);
  private _isLoading = signal(false);

  coins = this._coins.asReadonly();
  isLoading = this._isLoading.asReadonly();

  constructor() {
    this.loadFromStorage();
  }

  addCoin(coinId: string): void {
    const current = this._coins();
    if (!current.includes(coinId)) {
      const updated = [...current, coinId];
      this._coins.set(updated);
      this.persistToStorage(updated);
    }
  }

  removeCoin(coinId: string): void {
    const updated = this._coins().filter(id => id !== coinId);
    this._coins.set(updated);
    this.persistToStorage(updated);
  }

  reorderFromList(reordered: string[]): void {
    this._coins.set(reordered);
    this.persistToStorage(reordered);
  }

  private async loadFromStorage(): Promise<void> {
    this._isLoading.set(true);
    try {
      const stored = await this.indexedDb.get('watchlist', 'coins');
      if (Array.isArray(stored)) {
        this._coins.set(stored);
      }
    } catch {
      // Storage unavailable, start with empty watchlist
    } finally {
      this._isLoading.set(false);
    }
  }

  private async persistToStorage(coins: string[]): Promise<void> {
    try {
      await this.indexedDb.set('watchlist', 'coins', coins);
    } catch {
      // Storage unavailable
    }
  }
}
