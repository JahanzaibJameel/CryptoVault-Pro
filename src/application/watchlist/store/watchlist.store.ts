import { Injectable, signal, computed, inject } from '@angular/core';
import { IndexedDbService } from '../../../infrastructure/persistence/indexed-db.service';

@Injectable({ providedIn: 'root' })
export class WatchlistStore {
  private indexedDb = inject(IndexedDbService);
  
  private state = signal<string[]>([]);
  
  // Selectors
  coins = computed(() => this.state());
  coinCount = computed(() => this.state().length);
  isLoading = signal(true);

  constructor() {
    this.hydrateFromDb();
  }

  async addCoin(coinId: string) {
    if (this.state().includes(coinId)) {
      return; // Already in watchlist
    }
    
    this.state.update(coins => [...coins, coinId]);
    await this.indexedDb.saveWatchlist(this.state());
  }

  async removeCoin(coinId: string) {
    this.state.update(coins => coins.filter(id => id !== coinId));
    await this.indexedDb.saveWatchlist(this.state());
  }

  async reorder(fromIndex: number, toIndex: number) {
    const currentCoins = [...this.state()];
    const [movedCoin] = currentCoins.splice(fromIndex, 1);
    currentCoins.splice(toIndex, 0, movedCoin);
    
    this.state.set(currentCoins);
    await this.indexedDb.saveWatchlist(this.state());
  }

  async reorderFromList(coins: string[]) {
    this.state.set(coins);
    await this.indexedDb.saveWatchlist(this.state());
  }

  isInWatchlist(coinId: string): boolean {
    return this.state().includes(coinId);
  }

  async clearWatchlist() {
    this.state.set([]);
    await this.indexedDb.saveWatchlist([]);
  }

  private async hydrateFromDb() {
    try {
      const watchlist = await this.indexedDb.getWatchlist();
      this.state.set(watchlist || []);
    } catch (error) {
      console.error('Failed to hydrate watchlist from DB:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
