import { signal, computed, inject } from '@angular/core';
import { Coin } from '../../../domain/models';
import { CoinGeckoService } from '../../../infrastructure/api/coingecko.service';

export class MarketDataStore {
  private coinGecko = inject(CoinGeckoService);
  
  private state = signal<Record<string, Coin>>({});
  private loadingState = signal<Set<string>>(new Set());
  private errorState = signal<Record<string, string>>({});
  private lastUpdated = signal<Record<string, number>>({});

  // Selectors
  allCoins = computed(() => Object.values(this.state()));
  getCoin = (id: string) => computed(() => this.state()[id]);
  isLoading = (id?: string) => computed(() => 
    id ? this.loadingState().has(id) : this.loadingState().size > 0
  );
  getError = (id: string) => computed(() => this.errorState()[id]);
  getLastUpdated = (id: string) => computed(() => this.lastUpdated()[id]);
  topCoins = computed(() => 
    this.allCoins()
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 50)
  );

  async fetchTopCoins(currency = 'usd'): Promise<void> {
    try {
      this.loadingState.update(state => new Set(state).add('top'));
      this.errorState.update(errors => ({ ...errors, top: '' }));
      
      const coins = await this.coinGecko.getTopCoins(currency);
      
      this.state.update(current => {
        const newState = { ...current };
        coins.forEach(coin => {
          newState[coin.id] = coin;
        });
        return newState;
      });
      
      this.lastUpdated.update(current => ({
        ...current,
        top: Date.now(),
      }));
      
    } catch (error) {
      this.errorState.update(errors => ({
        ...errors,
        top: error instanceof Error ? error.message : 'Failed to fetch top coins',
      }));
      throw error;
    } finally {
      this.loadingState.update(state => {
        const newState = new Set(state);
        newState.delete('top');
        return newState;
      });
    }
  }

  async fetchCoinDetail(coinId: string): Promise<void> {
    if (this.loadingState().has(coinId)) {
      return; // Already loading
    }

    try {
      this.loadingState.update(state => new Set(state).add(coinId));
      this.errorState.update(errors => ({ ...errors, [coinId]: '' }));
      
      const coin = await this.coinGecko.getCoinDetail(coinId);
      
      this.state.update(current => ({
        ...current,
        [coinId]: coin,
      }));
      
      this.lastUpdated.update(current => ({
        ...current,
        [coinId]: Date.now(),
      }));
      
    } catch (error) {
      this.errorState.update(errors => ({
        ...errors,
        [coinId]: error instanceof Error ? error.message : `Failed to fetch ${coinId}`,
      }));
      throw error;
    } finally {
      this.loadingState.update(state => {
        const newState = new Set(state);
        newState.delete(coinId);
        return newState;
      });
    }
  }

  async refreshPrices(currency = 'usd'): Promise<void> {
    const coinIds = Object.keys(this.state());
    if (coinIds.length === 0) {
      return this.fetchTopCoins(currency);
    }

    try {
      this.loadingState.update(state => new Set(state).add('refresh'));
      
      // Fetch updated prices for all tracked coins
      await this.fetchTopCoins(currency);
      
    } catch (error) {
      console.error('Failed to refresh prices:', error);
      throw error;
    } finally {
      this.loadingState.update(state => {
        const newState = new Set(state);
        newState.delete('refresh');
        return newState;
      });
    }
  }

  updatePrices(prices: Record<string, number>) {
    this.state.update(current => {
      const newState = { ...current };
      Object.entries(prices).forEach(([coinId, price]) => {
        if (newState[coinId]) {
          newState[coinId] = {
            ...newState[coinId],
            currentPrice: price,
          };
        }
      });
      return newState;
    });
    
    this.lastUpdated.update(current => {
      const now = Date.now();
      const updated = { ...current };
      Object.keys(prices).forEach(coinId => {
        updated[coinId] = now;
      });
      return updated;
    });
  }

  clearErrors() {
    this.errorState.set({});
  }

  getCachedPrices(): Record<string, number> {
    const prices: Record<string, number> = {};
    Object.entries(this.state()).forEach(([id, coin]) => {
      prices[id] = coin.currentPrice;
    });
    return prices;
  }

  isDataStale(coinId: string, maxAgeMinutes = 5): boolean {
    const lastUpdate = this.lastUpdated()[coinId];
    if (!lastUpdate) return true;
    
    const ageMs = Date.now() - lastUpdate;
    const maxAgeMs = maxAgeMinutes * 60 * 1000;
    
    return ageMs > maxAgeMs;
  }
}
