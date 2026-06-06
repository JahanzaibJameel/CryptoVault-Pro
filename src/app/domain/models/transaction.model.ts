export interface Transaction {
  id: string;
  coinId: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  date: number;
}

export interface Holding {
  coinId: string;
  amount: number;
  avgBuyPrice: number;
}

export interface Allocation {
  coinId: string;
  percentage: number;
  value: number;
}
