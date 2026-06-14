import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map, tap } from 'rxjs';
import { Coin, GlobalMarketData } from '../../../domain/models/coin.model';
import { IndexedDbService } from '../../../infrastructure/persistence/indexed-db.service';
import { environment } from '../../../../environments/environment';

interface RawCoinMarketResponse {
  id: string;
  name: string;
  symbol?: string;
  image?: string;
  current_price?: number;
  price_change_percentage_24h?: number;
  market_cap?: number;
  market_cap_rank?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  circulating_supply?: number;
  total_supply?: number;
  last_updated?: string;
}

interface RawGlobalMarketResponse {
  data?: {
    total_market_cap?: Record<string, number>;
    total_volume?: Record<string, number>;
    market_cap_change_percentage_24h_usd?: number;
    active_cryptocurrencies?: number;
    markets?: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class MarketDataStore {
  private http = inject(HttpClient);
  private indexedDb = inject(IndexedDbService);

  private apiUrl = environment.apiUrl;

  private _topCoins = signal<Coin[]>([]);
  private _allCoins = signal<Coin[]>([]);
  private _isLoadingTopCoins = signal(false);
  private _lastGlobalMarket = signal<GlobalMarketData | null>(null);

  // Public signals
  topCoins = this._topCoins.asReadonly();
  allCoins = this._allCoins.asReadonly();
  getIsLoadingTopCoins = this._isLoadingTopCoins.asReadonly();
  lastGlobalMarket = this._lastGlobalMarket.asReadonly();

  fetchTopCoins(currency: string): Promise<void> {
    this._isLoadingTopCoins.set(true);

    return new Promise<void>((resolve, reject) => {
      this.http
        .get<RawCoinMarketResponse[]>(`${this.apiUrl}/coins/markets`, {
          params: {
            vs_currency: currency.toLowerCase(),
            order: 'market_cap_desc',
            per_page: '50',
            page: '1',
            sparkline: 'false',
            price_change_percentage: '24h',
          },
        })
        .pipe(
          map((response) => this.mapCoinsResponse(response)),
          tap((coins) => {
            this._topCoins.set(coins);
            this._allCoins.set(coins);
            this._isLoadingTopCoins.set(false);
          }),
          catchError(() => {
            this._isLoadingTopCoins.set(false);
            // Try to load from cache
            this.loadCachedCoins();
            return of([] as Coin[]);
          }),
        )
        .subscribe({
          next: () => resolve(),
          error: (err) => reject(err),
        });
    });
  }

  fetchGlobalMarket(currency: string): Observable<GlobalMarketData> {
    return this.http.get<RawGlobalMarketResponse>(`${this.apiUrl}/global`).pipe(
      map((response) => this.mapGlobalResponse(response, currency)),
      tap((data) => {
        this._lastGlobalMarket.set(data);
        this.cacheGlobalData(data);
      }),
      catchError(() => {
        const cached = this._lastGlobalMarket();
        if (cached) {
          return of(cached);
        }
        return of({
          totalMarketCap: 0,
          totalVolume24h: 0,
          marketCapChange24h: 0,
        });
      }),
    );
  }

  getCoinById(coinId: string): Coin | undefined {
    return this._allCoins().find((c) => c.id === coinId);
  }

  getCurrentPrice(coinId: string): number {
    const coin = this.getCoinById(coinId);
    return coin?.currentPrice ?? 0;
  }

  private mapCoinsResponse(data: RawCoinMarketResponse[]): Coin[] {
    return data.map((item) => ({
      id: item.id,
      name: item.name,
      symbol: item.symbol?.toUpperCase() ?? '',
      image: item.image ?? '',
      currentPrice: item.current_price ?? 0,
      priceChange24h: item.price_change_percentage_24h ?? 0,
      marketCap: item.market_cap ?? 0,
      marketCapRank: item.market_cap_rank,
      totalVolume: item.total_volume,
      high24h: item.high_24h,
      low24h: item.low_24h,
      circulatingSupply: item.circulating_supply,
      totalSupply: item.total_supply,
      lastUpdated: item.last_updated,
    }));
  }

  private mapGlobalResponse(response: RawGlobalMarketResponse, currency: string): GlobalMarketData {
    const data = response?.data;
    if (!data) {
      return { totalMarketCap: 0, totalVolume24h: 0, marketCapChange24h: 0 };
    }

    const curr = currency.toLowerCase();
    return {
      totalMarketCap: data.total_market_cap?.[curr] ?? 0,
      totalVolume24h: data.total_volume?.[curr] ?? 0,
      marketCapChange24h: data.market_cap_change_percentage_24h_usd ?? 0,
      marketCapChangePercentage24h: data.market_cap_change_percentage_24h_usd,
      activeCryptocurrencies: data.active_cryptocurrencies,
      markets: data.markets,
    };
  }

  private async loadCachedCoins(): Promise<void> {
    try {
      const cached = await this.indexedDb.get('cache', 'top-coins');
      if (cached?.data) {
        this._topCoins.set(cached.data);
        this._allCoins.set(cached.data);
      }
    } catch {
      // Cache unavailable
    }
  }

  private async cacheGlobalData(data: GlobalMarketData): Promise<void> {
    try {
      await this.indexedDb.set('cache', 'global-market', {
        data,
        timestamp: Date.now(),
        ttl: 60000,
      });
    } catch {
      // Cache unavailable
    }
  }
}
