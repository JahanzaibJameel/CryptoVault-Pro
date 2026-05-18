import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResilientApiService } from './resilience/resilient-api.service';
import { Coin } from '../../domain/models/coin.model';
import { environment } from '../../environments/environment';

export interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation?: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply?: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface CoinGeckoDetail {
  id: string;
  symbol: string;
  name: string;
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  market_data: {
    current_price: { [currency: string]: number };
    market_cap: { [currency: string]: number };
    total_volume: { [currency: string]: number };
    price_change_24h_in_currency: { [currency: string]: number };
    price_change_percentage_24h: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number;
    max_supply?: number;
    ath: { [currency: string]: number };
    ath_change_percentage: { [currency: string]: number };
    atl: { [currency: string]: number };
    atl_change_percentage: { [currency: string]: number };
  };
  description: { [lang: string]: string };
  categories: string[];
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    twitter_screen_name: string;
    facebook_username: string;
    telegram_channel_identifier: string;
    subreddit_url: string;
    repos_url: { [platform: string]: string[] };
  };
}

@Injectable({
  providedIn: 'root'
})
export class CoinGeckoService {
  private api = inject(ResilientApiService);
  private readonly baseUrl = environment.apiUrl;

  getTopCoins(currency = 'usd', perPage = 50, page = 1): Observable<Coin[]> {
    const url = `${this.baseUrl}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h`;
    
    return this.api.get<CoinGeckoMarketData[]>(url, {
      useCache: true,
      cacheKey: `top-coins-${currency}-${perPage}-${page}`
    }).pipe(
      map(data => data.map(this.transformMarketData))
    );
  }

  getCoinDetail(id: string, currency = 'usd'): Observable<Coin> {
    const url = `${this.baseUrl}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    
    return this.api.get<CoinGeckoDetail>(url, {
      useCache: true,
      cacheKey: `coin-detail-${id}-${currency}`
    }).pipe(
      map(data => this.transformDetailData(data, currency))
    );
  }

  searchCoins(query: string): Observable<Coin[]> {
    const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}`;
    
    return this.api.get<any>(url, {
      useCache: true,
      cacheKey: `search-${query}`
    }).pipe(
      map(data => data.coins?.slice(0, 10).map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.large,
        currentPrice: 0,
        marketCap: 0,
        priceChange24h: 0
      })) || [])
    );
  }

  getCoinPriceHistory(id: string, currency = 'usd', days = 7): Observable<{ time: number; price: number }[]> {
    const url = `${this.baseUrl}/coins/${id}/market_chart?vs_currency=${currency}&days=${days}&interval=daily`;
    
    return this.api.get<any>(url, {
      useCache: true,
      cacheKey: `price-history-${id}-${currency}-${days}`
    }).pipe(
      map(data => data.prices?.map(([timestamp, price]: [number, number]) => ({
        time: timestamp,
        price
      })) || [])
    );
  }

  getGlobalMarketData(currency = 'usd'): Observable<{
    totalMarketCap: number;
    totalVolume24h: number;
    marketCapChange24h: number;
    volumeChange24h: number;
    marketCapPercentage: { [coinId: string]: number };
  }> {
    const url = `${this.baseUrl}/global?vs_currency=${currency}`;
    
    return this.api.get<any>(url, {
      useCache: true,
      cacheKey: `global-market-${currency}`
    }).pipe(
      map(data => ({
        totalMarketCap: data.data?.total_market_cap?.[currency] || 0,
        totalVolume24h: data.data?.total_volume?.[currency] || 0,
        marketCapChange24h: data.data?.market_cap_change_percentage_24h_usd || 0,
        volumeChange24h: data.data?.volume_change_percentage_24h_usd || 0,
        marketCapPercentage: data.data?.market_cap_percentage || {}
      }))
    );
  }

  private transformMarketData(data: CoinGeckoMarketData): Coin {
    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      image: data.image,
      currentPrice: data.current_price,
      marketCap: data.market_cap,
      priceChange24h: data.price_change_percentage_24h || 0
    };
  }

  private transformDetailData(data: CoinGeckoDetail, currency: string): Coin {
    const marketData = data.market_data;
    
    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      image: data.image.large,
      currentPrice: marketData.current_price[currency] || 0,
      marketCap: marketData.market_cap[currency] || 0,
      priceChange24h: marketData.price_change_percentage_24h || 0
    };
  }
}
