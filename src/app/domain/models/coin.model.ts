export interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;
  marketCapRank?: number;
  totalVolume?: number;
  high24h?: number;
  low24h?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  lastUpdated?: string;
}

export interface GlobalMarketData {
  totalMarketCap: number;
  totalVolume24h: number;
  marketCapChange24h: number;
  marketCapChangePercentage24h?: number;
  activeCryptocurrencies?: number;
  markets?: number;
}
