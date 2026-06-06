import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CoinGeckoService } from './coingecko.service';

describe('CoinGeckoService Integration', () => {
  let service: CoinGeckoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CoinGeckoService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CoinGeckoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getTopCoins', () => {
    it('should fetch and map coins correctly', async () => {
      const mockResponse = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
          current_price: 50000,
          market_cap: 1000000000000,
          market_cap_rank: 1,
          price_change_percentage_24h: 2.5,
          total_volume: 30000000000,
          high_24h: 51000,
          low_24h: 49000,
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          current_price: 3000,
          market_cap: 360000000000,
          market_cap_rank: 2,
          price_change_percentage_24h: -1.2,
          total_volume: 15000000000,
          high_24h: 3100,
          low_24h: 2900,
        },
      ];

      const coins$ = service.getTopCoins('usd', 10, 1);
      const coinsPromise = firstValueFrom(coins$);

      // Verify the request was made
      const req = httpMock.expectOne(
        (req) =>
          req.url.includes('api.coingecko.com/api/v3/coins/markets') &&
          req.url.includes('vs_currency=usd') &&
          req.url.includes('per_page=10') &&
          req.url.includes('page=1'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const coins = await coinsPromise;

      // Verify the mapping
      expect(coins).toHaveLength(2);
      expect(coins[0]).toEqual({
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        currentPrice: 50000,
        marketCap: 1000000000000,
        priceChange24h: 2.5,
      });
      expect(coins[1]).toEqual({
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        currentPrice: 3000,
        marketCap: 360000000000,
        priceChange24h: -1.2,
      });
    });

    it('should handle API errors gracefully', async () => {
      const coins$ = service.getTopCoins('usd');
      const coinsPromise = firstValueFrom(coins$);

      const req = httpMock.expectOne((req) =>
        req.url.includes('api.coingecko.com/api/v3/coins/markets'),
      );
      req.flush('API Rate Limit Exceeded', { status: 429, statusText: 'Too Many Requests' });

      await expect(coinsPromise).rejects.toBeDefined();
    });
  });

  describe('getCoinDetail', () => {
    it('should fetch and map coin detail correctly', async () => {
      const mockResponse = {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: {
          large: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        },
        market_data: {
          current_price: { usd: 50000 },
          market_cap: { usd: 1000000000000 },
          total_volume: { usd: 30000000000 },
          price_change_percentage_24h: 2.5,
          market_cap_change_24h_in_currency: { usd: 25000000000 },
          circulating_supply: 19000000,
          total_supply: 21000000,
          max_supply: 21000000,
          ath: { usd: 69000 },
          ath_change_percentage: { usd: -27.5 },
          atl: { usd: 65 },
          atl_change_percentage: { usd: 76923 },
        },
      };

      const coin$ = service.getCoinDetail('bitcoin', 'usd');
      const coinPromise = firstValueFrom(coin$);

      const req = httpMock.expectOne(
        (req) =>
          req.url.includes('api.coingecko.com/api/v3/coins/bitcoin') &&
          req.url.includes('localization=false') &&
          req.url.includes('market_data=true'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const coin = await coinPromise;

      expect(coin).toEqual({
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        currentPrice: 50000,
        marketCap: 1000000000000,
        priceChange24h: 2.5,
      });
    });

    it('should handle 404 for non-existent coin', async () => {
      const coin$ = service.getCoinDetail('nonexistent', 'usd');
      const coinPromise = firstValueFrom(coin$);

      const req = httpMock.expectOne((req) =>
        req.url.includes('api.coingecko.com/api/v3/coins/nonexistent'),
      );
      req.flush('Coin not found', { status: 404, statusText: 'Not Found' });

      await expect(coinPromise).rejects.toBeDefined();
    });
  });

  describe('searchCoins', () => {
    it('should search and map coins correctly', async () => {
      const mockResponse = {
        coins: [
          {
            id: 'bitcoin',
            name: 'Bitcoin',
            symbol: 'btc',
            large: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
          },
          {
            id: 'bitcoin-cash',
            name: 'Bitcoin Cash',
            symbol: 'bch',
            large: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash.png',
          },
        ],
      };

      const coins$ = service.searchCoins('bitcoin');
      const coinsPromise = firstValueFrom(coins$);

      const req = httpMock.expectOne(
        (req) =>
          req.url.includes('api.coingecko.com/api/v3/search') && req.url.includes('query=bitcoin'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const coins = await coinsPromise;

      expect(coins).toHaveLength(2);
      expect(coins[0]).toEqual({
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        currentPrice: 0,
        marketCap: 0,
        priceChange24h: 0,
      });
    });

    it('should handle empty search results', async () => {
      const mockResponse = { coins: [] };

      const coins$ = service.searchCoins('nonexistent');
      const coinsPromise = firstValueFrom(coins$);

      const req = httpMock.expectOne(
        (req) =>
          req.url.includes('api.coingecko.com/api/v3/search') &&
          req.url.includes('query=nonexistent'),
      );
      req.flush(mockResponse);

      const coins = await coinsPromise;

      expect(coins).toHaveLength(0);
    });
  });

  describe('getCoinPriceHistory', () => {
    it('should fetch price history correctly', async () => {
      const mockResponse = {
        prices: [
          [1640995200000, 47000],
          [1641081600000, 48000],
          [1641168000000, 46000],
          [1641254400000, 49000],
        ],
      };

      const history$ = service.getCoinPriceHistory('bitcoin', 'usd', 7);
      const historyPromise = firstValueFrom(history$);

      const req = httpMock.expectOne(
        (req) =>
          req.url.includes('api.coingecko.com/api/v3/coins/bitcoin/market_chart') &&
          req.url.includes('vs_currency=usd') &&
          req.url.includes('days=7') &&
          req.url.includes('interval=daily'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const history = await historyPromise;

      expect(history).toHaveLength(4);
      expect(history[0]).toEqual({ time: 1640995200000, price: 47000 });
      expect(history[1]).toEqual({ time: 1641081600000, price: 48000 });
      expect(history[2]).toEqual({ time: 1641168000000, price: 46000 });
      expect(history[3]).toEqual({ time: 1641254400000, price: 49000 });
    });

    it('should handle missing prices data', async () => {
      const mockResponse = { prices: null };

      const history$ = service.getCoinPriceHistory('bitcoin', 'usd', 7);
      const historyPromise = firstValueFrom(history$);

      const req = httpMock.expectOne((req) =>
        req.url.includes('api.coingecko.com/api/v3/coins/bitcoin/market_chart'),
      );
      req.flush(mockResponse);

      const history = await historyPromise;

      expect(history).toHaveLength(0);
    });
  });

  describe('getGlobalMarketData', () => {
    it('should fetch global market data correctly', async () => {
      const mockResponse = {
        data: {
          total_market_cap: { usd: 2500000000000 },
          total_volume: { usd: 120000000000 },
          market_cap_change_percentage_24h_usd: 2.5,
          volume_change_percentage_24h_usd: 5.2,
          market_cap_percentage: {
            btc: 45.2,
            eth: 14.8,
          },
        },
      };

      const marketData$ = service.getGlobalMarketData('usd');
      const marketDataPromise = firstValueFrom(marketData$);

      const req = httpMock.expectOne(
        (req) =>
          req.url.includes('api.coingecko.com/api/v3/global') &&
          req.url.includes('vs_currency=usd'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const marketData = await marketDataPromise;

      expect(marketData).toEqual({
        totalMarketCap: 2500000000000,
        totalVolume24h: 120000000000,
        marketCapChange24h: 2.5,
        volumeChange24h: 5.2,
        marketCapPercentage: {
          btc: 45.2,
          eth: 14.8,
        },
      });
    });
  });
});
