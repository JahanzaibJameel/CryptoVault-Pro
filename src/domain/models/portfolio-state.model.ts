import { Holding } from './holding.model';
import { Transaction } from './transaction.model';

export interface PortfolioState {
  holdings: Holding[];
  transactions: Transaction[];
  totalInvested: number;
  currentValue: number;
  pnl: number;
  allocation: AllocationItem[];
}

export interface AllocationItem {
  coinId: string;
  percentage: number;
  value: number;
}
