import { Component, computed, inject, signal, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { PortfolioStore } from '../../../../application/portfolio/store/portfolio.store';
import { MarketDataStore } from '../../../../application/market-data/store/market-data.store';
import { Transaction } from '../../../../domain/models/transaction.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="transaction-form">
      <div class="form-header">
        <h3>Add Transaction</h3>
      </div>
      <form [formGroup]="transactionForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="coin">Coin</label>
          <select id="coin" formControlName="coinId" data-test="coin-select">
            <option value="">Select a coin</option>
            @for (coin of availableCoins(); track coin.id) {
              <option [value]="coin.id">{{ coin.name }} ({{ coin.symbol }})</option>
            }
          </select>
          @if (transactionForm.get('coinId')?.invalid && transactionForm.get('coinId')?.touched) {
            <span class="error" data-test="coin-error">Coin is required</span>
          }
        </div>

        <div class="form-group">
          <label for="type">Type</label>
          <select id="type" formControlName="type" data-test="type-select">
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>

        <div class="form-group">
          <label for="amount">Amount</label>
          <input 
            id="amount" 
            type="number" 
            formControlName="amount" 
            data-test="amount-input"
            placeholder="0.00000000"
            step="0.00000001"
            [attr.aria-invalid]="transactionForm.get('amount')?.invalid && transactionForm.get('amount')?.touched"
          />
          @if (transactionForm.get('amount')?.invalid && transactionForm.get('amount')?.touched) {
            <span class="error" data-test="amount-error">
              @if (transactionForm.get('amount')?.hasError('required')) {
                Amount is required
              } @else if (transactionForm.get('amount')?.hasError('min')) {
                Amount must be positive
              } @else if (transactionForm.get('amount')?.hasError('insufficient')) {
                Insufficient holdings for sell
              }
            </span>
          }
        </div>

        <div class="form-group">
          <label for="price">Price (optional)</label>
          <input 
            id="price" 
            type="number" 
            formControlName="price" 
            data-test="price-input"
            placeholder="Market price will be used"
            step="0.01"
            [attr.aria-invalid]="transactionForm.get('price')?.invalid && transactionForm.get('price')?.touched"
          />
          @if (transactionForm.get('price')?.invalid && transactionForm.get('price')?.touched) {
            <span class="error" data-test="price-error">
              @if (transactionForm.get('price')?.hasError('required')) {
                Price is required
              } @else if (transactionForm.get('price')?.hasError('min')) {
                Price must be positive
              }
            </span>
          }
        </div>

        <div class="form-actions">
          <button 
            type="submit" 
            class="submit-button"
            data-test="submit-transaction"
            [disabled]="transactionForm.invalid || isLoading()"
          >  
            Add Transaction
          </button>
          <button 
            type="button" 
            class="cancel-button"
            (click)="onCancel()"
            data-test="cancel-transaction"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-group {
      margin-bottom: var(--spacing-md);
    }

    label {
      display: block;
      margin-bottom: var(--spacing-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    select, input {
      width: 100%;
      padding: var(--spacing-sm);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      background-color: var(--color-background-default);
      color: var(--color-text-primary);
    }

    select:focus, input:focus {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
      border-color: var(--color-primary-500);
    }

    .error {
      display: block;
      margin-top: var(--spacing-xs);
      color: var(--color-danger-500);
      font-size: var(--font-size-sm);
    }

    .form-actions {
      display: flex;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-lg);
    }

    [data-theme="dark"] select,
    [data-theme="dark"] input {
      background-color: var(--color-background-elevated);
      border-color: var(--color-border-dark);
    }
  `]
})
export class TransactionFormComponent {
  private portfolioStore = inject(PortfolioStore);
  private marketDataStore = inject(MarketDataStore);
  private fb = inject(FormBuilder);

  @Output() transactionAdded = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isLoading = signal(false);
  availableCoins = this.marketDataStore.topCoins;

  transactionForm: FormGroup = this.fb.group({
    coinId: ['', Validators.required],
    type: ['buy', Validators.required],
    amount: ['', [Validators.required, Validators.min(0.00000001)]],
    price: ['', [Validators.required, Validators.min(0.01)]]
  });

  constructor() {
    // Add custom validator for sell transactions
    this.transactionForm.get('type')?.valueChanges.subscribe(() => {
      this.validateSellAmount();
    });
  }

  async onSubmit(): Promise<void> {
    if (this.transactionForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    try {
      const formValue = this.transactionForm.value;
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        coinId: formValue.coinId,
        type: formValue.type,
        amount: formValue.amount,
        price: formValue.price,
        date: Date.now()
      };

      await this.portfolioStore.addTransaction(transaction);
      this.transactionForm.reset();
      this.transactionAdded.emit();
    } catch (error) {
      console.error('Failed to add transaction:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel(): void {
    this.transactionForm.reset();
    this.cancelled.emit();
  }

  private validateSellAmount(): void {
    const typeControl = this.transactionForm.get('type');
    const amountControl = this.transactionForm.get('amount');
    const coinIdControl = this.transactionForm.get('coinId');

    if (typeControl?.value === 'sell' && coinIdControl?.value) {
      const holdings = this.portfolioStore.holdings();
      const holding = holdings.find(h => h.coinId === coinIdControl.value);
      
      if (holding && amountControl?.value > holding.amount) {
        amountControl?.setErrors({ insufficient: true });
      } else {
        amountControl?.setErrors(null);
      }
    }
  }

  private markAllAsTouched(): void {
    Object.values(this.transactionForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}
