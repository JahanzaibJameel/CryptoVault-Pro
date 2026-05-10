import { TestBed } from '@angular/core/testing';
import { PortfolioStore } from './portfolio.store';
import { Transaction } from '../../../domain/models/transaction.model';
import { IndexedDbService } from '../../../infrastructure/persistence/indexed-db.service';

describe('PortfolioStore', () => {
  let store: PortfolioStore;
  let mockIndexedDb: jasmine.SpyObj<IndexedDbService>;

  beforeEach(() => {
    mockIndexedDb = jasmine.createSpyObj('IndexedDbService');
    mockIndexedDb.getTransactions.and.resolveTo([]);
    mockIndexedDb.saveTransactions.and.resolveTo(Promise.resolve());
    
    TestBed.configureTestingModule({
      providers: [
        PortfolioStore,
        { provide: IndexedDbService, useValue: mockIndexedDb }
      ]
    });
    
    store = TestBed.inject(PortfolioStore);
  });

  describe('addTransaction', () => {
    it('should add buy transaction and update holdings', async () => {
      const transaction: Transaction = {
        id: '1',
        coinId: 'bitcoin',
        type: 'buy',
        amount: 1,
        price: 30000,
        date: Date.now()
      };

      await store.addTransaction(transaction);

      const holdings = store.holdings();
      expect(holdings).toHaveLength(1);
      expect(holdings[0]).toEqual({
        coinId: 'bitcoin',
        amount: 1,
        avgBuyPrice: 30000
      });

      expect(mockIndexedDb.saveTransactions).toHaveBeenCalled();
    });

    it('should add sell transaction and reduce holdings', async () => {
      // First add a buy transaction
      const buyTx: Transaction = {
        id: '1',
        coinId: 'bitcoin',
        type: 'buy',
        amount: 2,
        price: 30000,
        date: Date.now()
      };
      await store.addTransaction(buyTx);

      // Then sell half
      const sellTx: Transaction = {
        id: '2',
        coinId: 'bitcoin',
        type: 'sell',
        amount: 1,
        price: 35000,
        date: Date.now()
      };
      await store.addTransaction(sellTx);

      const holdings = store.holdings();
      expect(holdings).toHaveLength(1);
      expect(holdings[0]).toEqual({
        coinId: 'bitcoin',
        amount: 1,
        avgBuyPrice: 30000 // Original buy price preserved
      });
    });

    it('should throw error for insufficient holdings', async () => {
      const sellTx: Transaction = {
        id: '1',
        coinId: 'bitcoin',
        type: 'sell',
        amount: 1,
        price: 30000,
        date: Date.now()
      };

      await expectAsync(store.addTransaction(sellTx)).rejects.toThrow();
    });
  });

  describe('removeTransaction', () => {
    it('should remove transaction and recalculate holdings', async () => {
      // Add transactions first
      const tx1: Transaction = {
        id: '1',
        coinId: 'bitcoin',
        type: 'buy',
        amount: 1,
        price: 30000,
        date: Date.now()
      };
      const tx2: Transaction = {
        id: '2',
        coinId: 'bitcoin',
        type: 'buy',
        amount: 1,
        price: 25000,
        date: Date.now()
      };

      await store.addTransaction(tx1);
      await store.addTransaction(tx2);

      expect(store.transactions()).toHaveLength(2);

      // Remove one transaction
      await store.removeTransaction('1');

      expect(store.transactions()).toHaveLength(1);
      expect(store.transactions()[0].id).toBe('2');
      expect(mockIndexedDb.saveTransactions).toHaveBeenCalled();
    });
  });

  describe('updatePrices', () => {
    beforeEach(async () => {
      // Add some holdings first
      const tx: Transaction = {
        id: '1',
        coinId: 'bitcoin',
        type: 'buy',
        amount: 2,
        price: 30000,
        date: Date.now()
      };
      await store.addTransaction(tx);
    });

    it('should update portfolio value based on current prices', () => {
      const prices = { 'bitcoin': 35000 };

      store.updatePrices(prices);

      expect(store.currentValue()).toBe(70000); // 2 * 35000
      expect(store.pnl()).toBe(10000); // 70000 - 60000
    });

    it('should calculate allocation based on current prices', () => {
      const prices = { 'bitcoin': 35000, 'ethereum': 2000 };

      // Add ethereum holding
      const ethTx: Transaction = {
        id: '2',
        coinId: 'ethereum',
        type: 'buy',
        amount: 10,
        price: 1800,
        date: Date.now()
      };
      await store.addTransaction(ethTx);

      store.updatePrices(prices);

      const allocation = store.allocation();
      expect(allocation).toHaveLength(2);
      
      const btcAllocation = allocation.find(a => a.coinId === 'bitcoin');
      const ethAllocation = allocation.find(a => a.coinId === 'ethereum');
      
      expect(btcAllocation?.value).toBe(70000);
      expect(ethAllocation?.value).toBe(20000);
      expect(btcAllocation?.percentage).toBeCloseTo(97.22, 1); // 70000/72000 * 100
      expect(ethAllocation?.percentage).toBeCloseTo(2.78, 1);   // 2000/72000 * 100
    });
  });

  describe('export/import functionality', () => {
    it('should export portfolio as JSON', async () => {
      const tx: Transaction = {
        id: '1',
        coinId: 'bitcoin',
        type: 'buy',
        amount: 1,
        price: 30000,
        date: Date.now()
      };
      await store.addTransaction(tx);

      const exported = await store.exportPortfolio();
      
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed.transactions).toContain(tx);
    });

    it('should import portfolio from JSON', async () => {
      const portfolioData = {
        transactions: [
          {
            id: '1',
            coinId: 'ethereum',
            type: 'buy',
            amount: 5,
            price: 2000,
            date: Date.now()
          }
        ]
      };

      await store.importPortfolio(JSON.stringify(portfolioData));

      expect(store.transactions()).toHaveLength(1);
      expect(store.transactions()[0].coinId).toBe('ethereum');
    });

    it('should reject invalid JSON on import', async () => {
      await expectAsync(store.importPortfolio('invalid json')).rejects.toThrow();
    });
  });

  describe('computed selectors', () => {
    it('should provide reactive holdings', () => {
      expect(store.holdings).toBeDefined();
      expect(typeof store.holdings).toBe('function');
    });

    it('should provide reactive transactions', () => {
      expect(store.transactions).toBeDefined();
      expect(typeof store.transactions).toBe('function');
    });

    it('should provide reactive portfolio metrics', () => {
      expect(store.currentValue).toBeDefined();
      expect(store.totalInvested).toBeDefined();
      expect(store.pnl).toBeDefined();
      expect(store.allocation).toBeDefined();
      expect(store.roi).toBeDefined();
    });
  });
});
