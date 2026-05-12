import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { TransactionFormComponent } from './transaction-form.component';
import { PortfolioStore } from '../../../../application/portfolio/store/portfolio.store';
import { MarketDataStore } from '../../../../application/market-data/store/market-data.store';

describe('TransactionFormComponent', () => {
  let component: TransactionFormComponent;
  let fixture: any;
  let portfolioStore: jest.Mocked<PortfolioStore>;
  let marketDataStore: jest.Mocked<MarketDataStore>;

  beforeEach(async () => {
    // Create mock stores
    portfolioStore = {
      addTransaction: jest.fn(),
      transactions: jest.fn(),
      portfolioValue: jest.fn(),
      totalPnL: jest.fn(),
      totalAllocation: jest.fn()
    } as any;

    marketDataStore = {
      topCoins: jest.fn().mockReturnValue([
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', current_price: 50000 },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', current_price: 3000 }
      ]),
      isLoading: jest.fn().mockReturnValue(false),
      error: jest.fn().mockReturnValue(null)
    } as any;

    await TestBed.configureTestingModule({
      imports: [TransactionFormComponent],
      providers: [
        { provide: PortfolioStore, useValue: portfolioStore },
        { provide: MarketDataStore, useValue: marketDataStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render form with all required fields', () => {
    const coinSelect = fixture.debugElement.query(By.css('[data-test="coin-select"]'));
    const amountInput = fixture.debugElement.query(By.css('[data-test="amount-input"]'));
    const priceInput = fixture.debugElement.query(By.css('[data-test="price-input"]'));
    const submitBtn = fixture.debugElement.query(By.css('[data-test="submit-transaction"]'));

    expect(coinSelect).toBeTruthy();
    expect(amountInput).toBeTruthy();
    expect(priceInput).toBeTruthy();
    expect(submitBtn).toBeTruthy();
  });

  it('should show validation errors for invalid form', () => {
    const submitBtn = fixture.debugElement.query(By.css('[data-test="submit-transaction"]'));
    
    // Form should be invalid initially
    expect(component.transactionForm.invalid).toBeTruthy();
    expect(submitBtn.nativeElement.disabled).toBeTruthy();
  });

  it('should validate amount field', () => {
    const amountInput = fixture.debugElement.query(By.css('[data-test="amount-input"]'));
    
    // Test negative amount
    amountInput.nativeElement.value = '-1';
    amountInput.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.transactionForm.get('amount')?.invalid).toBeTruthy();
  });

  it('should validate price field', () => {
    const priceInput = fixture.debugElement.query(By.css('[data-test="price-input"]'));
    
    // Test zero price
    priceInput.nativeElement.value = '0';
    priceInput.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.transactionForm.get('price')?.invalid).toBeTruthy();
  });

  it('should enable submit when form is valid', () => {
    component.transactionForm.setValue({
      coinId: 'bitcoin',
      type: 'buy',
      amount: 1,
      price: 30000
    });
    fixture.detectChanges();

    const submitBtn = fixture.debugElement.query(By.css('[data-test="submit-transaction"]'));
    expect(component.transactionForm.valid).toBeTruthy();
    expect(submitBtn.nativeElement.disabled).toBeFalsy();
  });

  it('should have cancel button', () => {
    const cancelBtn = fixture.debugElement.query(By.css('[data-test="cancel-transaction"]'));
    expect(cancelBtn).toBeTruthy();
  });

  it('should reset form after successful submission', async () => {
    jest.spyOn(component, 'onSubmit').mockResolvedValue();
    
    component.transactionForm.setValue({
      coinId: 'bitcoin',
      type: 'buy',
      amount: 1,
      price: 30000
    });
    
    await component.onSubmit();
    
    expect(component.transactionForm.pristine).toBeTruthy();
  });
});
