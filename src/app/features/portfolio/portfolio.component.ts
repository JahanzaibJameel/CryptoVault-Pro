import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PortfolioStore } from '../../../application/portfolio/store';
import { SettingsStore } from '../../../application/settings/store';
import { ButtonComponent } from '../../shared/design-system/button/button.component';
import { CardComponent } from '../../shared/design-system/card/card.component';
import { SkeletonComponent } from '../../shared/design-system/skeleton/skeleton.component';
import { Price } from '../../../domain/value-objects/price';
import { Percentage } from '../../../domain/value-objects/percentage';
import { AllocationItem } from '../../../domain/models/portfolio-state.model';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonComponent,
    CardComponent,
    SkeletonComponent
  ],
  template: `
    <div class="portfolio animate-fade-in">
      <header class="portfolio-header">
        <div class="header-content">
          <h1 class="portfolio-title text-heading">Portfolio Overview</h1>
          <p class="portfolio-subtitle text-secondary">Track your cryptocurrency investments and performance</p>
        </div>
        <div class="portfolio-actions">
          <ui-button 
            variant="primary" 
            size="sm"
            routerLink="/portfolio/transactions"
            class="glass"
          >
            <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add Transaction
          </ui-button>
          <ui-button 
            variant="secondary" 
            size="sm"
            (click)="exportPortfolio()"
            class="glass"
          >
            <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            Export
          </ui-button>
          <ui-button 
            variant="ghost" 
            size="sm"
            (click)="showImportDialog()"
            class="glass"
          >
            <svg class="button-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5v-2z"/>
            </svg>
            Import
          </ui-button>
        </div>
      </header>

      <!-- Portfolio Summary Stats -->
      <section class="portfolio-summary">
        <div class="summary-grid grid-cols-4">
          <ui-card variant="glass" size="md" class="summary-card glass-card animate-fade-in">
            <div class="summary-content">
              <div class="summary-header">
                <div class="summary-icon primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                  </svg>
                </div>
                <div class="summary-info">
                  <span class="summary-label text-hint">Total Value</span>
                  <span class="summary-value text-mono">{{ formatCurrency(currentValue()) }}</span>
                  <span class="summary-change" [class]="getChangeClass(pnl())">
                    {{ formatChange(pnl()) }}
                  </span>
                </div>
              </div>
            </div>
          </ui-card>
          
          <ui-card variant="glass" size="md" class="summary-card glass-card animate-fade-in" style="animation-delay: 0.1s">
            <div class="summary-content">
              <div class="summary-header">
                <div class="summary-icon success">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.81.45 1.61 1.67 1.61 1.16 0 1.6-.64 1.6-1.46 0-.84-.68-1.22-1.88-1.54-1.55-.38-3.03-1.06-3.03-2.88 0-1.62 1.39-2.55 3.11-2.89V4h2.67v1.71c1.63.31 2.71 1.42 2.83 2.95h-1.96c-.11-.75-.47-1.43-1.39-1.43-1.06 0-1.46.59-1.46 1.28 0 .64.41 1.02 1.7 1.36 1.7.42 3.2 1.17 3.2 3.02 0 1.8-1.48 2.66-3.22 3.02z"/>
                  </svg>
                </div>
                <div class="summary-info">
                  <span class="summary-label text-hint">Total Invested</span>
                  <span class="summary-value text-mono">{{ formatCurrency(totalInvested()) }}</span>
                </div>
              </div>
            </div>
          </ui-card>
          
          <ui-card variant="glass" size="md" class="summary-card glass-card animate-fade-in" style="animation-delay: 0.2s">
            <div class="summary-content">
              <div class="summary-header">
                <div class="summary-icon warning">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                  </svg>
                </div>
                <div class="summary-info">
                  <span class="summary-label text-hint">Total P&L</span>
                  <span class="summary-value text-mono" [class]="getChangeClass(pnl())">
                    {{ formatCurrency(pnl()) }}
                  </span>
                  <span class="summary-percentage" [class]="getChangeClass(roi())">
                    {{ formatPercentage(roi()) }}
                  </span>
                </div>
              </div>
            </div>
          </ui-card>
          
          <ui-card variant="glass" size="md" class="summary-card glass-card animate-fade-in" style="animation-delay: 0.3s">
            <div class="summary-content">
              <div class="summary-header">
                <div class="summary-icon info">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div class="summary-info">
                  <span class="summary-label text-hint">Holdings</span>
                  <span class="summary-value text-mono">{{ holdings().length }}</span>
                  <span class="summary-sublabel">Unique coins</span>
                </div>
              </div>
            </div>
          </ui-card>
        </div>
      </section>

      <!-- Holdings and Allocation -->
      <div class="portfolio-content">
        <!-- Holdings List -->
        <section class="holdings-section">
          <div class="section-header">
            <div class="header-left">
              <h2 class="text-heading">Holdings</h2>
              <p class="section-subtitle text-secondary">Your cryptocurrency positions</p>
            </div>
            <div class="view-options glass">
              <button 
                class="view-toggle" 
                [class.active]="viewMode() === 'cards'"
                (click)="setViewMode('cards')"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/>
                </svg>
                Cards
              </button>
              <button 
                class="view-toggle" 
                [class.active]="viewMode() === 'table'"
                (click)="setViewMode('table')"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                </svg>
                Table
              </button>
            </div>
          </div>

          @if (portfolioStore.isLoading()) {
            <div class="holdings-loading">
              @for (i of [1,2,3,4,5]; track i) {
                <ui-card variant="elevated" size="md" class="holding-skeleton">
                  <div class="holding-skeleton-content">
                    <ui-skeleton variant="circular" size="md" />
                    <div class="holding-skeleton-info">
                      <ui-skeleton variant="text" size="md" width="120px" />
                      <ui-skeleton variant="text" size="sm" width="80px" />
                      <ui-skeleton variant="text" size="xs" width="100px" />
                    </div>
                  </div>
                </ui-card>
              }
            </div>
          } @else if (holdings().length === 0) {
            <ui-card variant="outlined" size="lg" class="empty-state">
              <div class="empty-content">
                <h3>No Holdings Yet</h3>
                <p>Start building your portfolio by adding your first transaction.</p>
                <ui-button 
                  variant="primary" 
                  size="md"
                  routerLink="/portfolio/transactions"
                >
                  Add First Transaction
                </ui-button>
              </div>
            </ui-card>
          } @else {
            <div class="holdings-container" [class.card-view]="viewMode() === 'cards'" [class.table-view]="viewMode() === 'table'">
              @for (holding of holdings(); track holding.coinId) {
                @if (viewMode() === 'cards') {
                  <ui-card variant="elevated" size="md" class="holding-card">
                    <div class="holding-content">
                      <div class="holding-header">
                        <div class="holding-info">
                          <h3 class="coin-name">{{ getCoinName(holding.coinId) }}</h3>
                          <span class="coin-amount">{{ holding.amount }} coins</span>
                        </div>
                        <div class="holding-actions">
                          <ui-button 
                            variant="ghost" 
                            size="sm"
                            (click)="viewTransactions(holding.coinId)"
                          >
                            View
                          </ui-button>
                        </div>
                      </div>
                      <div class="holding-details">
                        <div class="detail-row">
                          <span class="detail-label">Avg Buy Price</span>
                          <span class="detail-value">{{ formatCurrency(holding.avgBuyPrice) }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">Current Value</span>
                          <span class="detail-value">{{ formatCurrency(getHoldingValue(holding)) }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">P&L</span>
                          <span class="detail-value" [class]="getChangeClass(getHoldingPnL(holding))">
                            {{ formatCurrency(getHoldingPnL(holding)) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </ui-card>
                } @else {
                  <div class="holding-row">
                    <div class="holding-table-info">
                      <span class="coin-name">{{ getCoinName(holding.coinId) }}</span>
                      <span class="coin-amount">{{ holding.amount }}</span>
                    </div>
                    <div class="holding-table-details">
                      <span>{{ formatCurrency(holding.avgBuyPrice) }}</span>
                      <span>{{ formatCurrency(getHoldingValue(holding)) }}</span>
                      <span [class]="getChangeClass(getHoldingPnL(holding))">
                        {{ formatCurrency(getHoldingPnL(holding)) }}
                      </span>
                    </div>
                    <div class="holding-table-actions">
                      <ui-button 
                        variant="ghost" 
                        size="sm"
                        (click)="viewTransactions(holding.coinId)"
                      >
                        View
                      </ui-button>
                    </div>
                  </div>
                }
              }
            </div>
          }
        </section>

        <!-- Allocation Chart -->
        @if (allocation().length > 0) {
          <section class="allocation-section">
            <div class="section-header">
              <h2>Portfolio Allocation</h2>
            </div>
            <ui-card variant="elevated" size="md" class="allocation-card">
              <div class="allocation-content">
                <div class="allocation-chart">
                  <!-- Simple pie chart representation -->
                  <div class="pie-chart">
                    @for (item of allocation(); track item.coinId; let i = $index) {
                      <div 
                        class="pie-slice" 
                        [style.background-color]="getCoinColor(item.coinId)"
                        [style.transform]="'rotate(' + getCumulativeRotation(i) + 'deg)'"
                        [style.clip-path]="'polygon(50% 50%, 50% 0%, ' + getSliceEndAngle(item.percentage) + ')'"
                      ></div>
                    }
                  </div>
                </div>
                <div class="allocation-legend">
                  @for (item of allocation(); track item.coinId) {
                    <div class="legend-item">
                      <div 
                        class="legend-color" 
                        [style.background-color]="getCoinColor(item.coinId)"
                      ></div>
                      <div class="legend-info">
                        <span class="legend-name">{{ getCoinName(item.coinId) }}</span>
                        <span class="legend-percentage">{{ item.percentage.toFixed(1) }}%</span>
                        <span class="legend-value">{{ formatCurrency(item.value) }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </ui-card>
          </section>
        }
      </div>

      <!-- Recent Transactions -->
      <section class="transactions-section">
        <div class="section-header">
          <h2>Recent Transactions</h2>
          <ui-button 
            variant="ghost" 
            size="sm"
            routerLink="/portfolio/transactions"
          >
            View All
          </ui-button>
        </div>

        @if (recentTransactions().length === 0) {
          <ui-card variant="outlined" size="md" class="empty-transactions">
            <p>No transactions yet. Add your first transaction to get started.</p>
          </ui-card>
        } @else {
          <div class="transactions-list">
            @for (transaction of recentTransactions(); track transaction.id) {
              <ui-card variant="outlined" size="sm" class="transaction-item">
                <div class="transaction-content">
                  <div class="transaction-info">
                    <span class="transaction-type" [class]="transaction.type">
                      {{ transaction.type.toUpperCase() }}
                    </span>
                    <span class="transaction-coin">{{ getCoinName(transaction.coinId) }}</span>
                    <span class="transaction-amount">{{ transaction.amount }}</span>
                  </div>
                  <div class="transaction-details">
                    <span class="transaction-price">{{ formatCurrency(transaction.price) }}</span>
                    <span class="transaction-date">{{ formatDate(transaction.date) }}</span>
                  </div>
                </div>
              </ui-card>
            }
          </div>
        }
      </section>
    </div>

    <!-- Hidden file input for import -->
    <input 
      type="file" 
      #fileInput 
      accept=".json" 
      style="display: none"
      (change)="handleFileImport($event)"
    />
  `,
  styles: [`
    /* Cyber-Glass 2026 Portfolio Styles */
    .portfolio {
      padding: var(--spacing-6);
      max-width: 1400px;
      margin: 0 auto;
      min-height: 100vh;
    }

    .portfolio-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-8);
      flex-wrap: wrap;
      gap: var(--spacing-6);
    }

    .header-content {
      flex: 1;
    }

    .portfolio-title {
      font-size: 2.5rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-2) 0;
      line-height: 1.2;
    }

    .portfolio-subtitle {
      font-size: 1rem;
      margin: 0;
      opacity: 0.8;
    }

    .portfolio-actions {
      display: flex;
      gap: var(--spacing-3);
      align-items: center;
    }

    /* Portfolio Summary Section */
    .portfolio-summary {
      margin-bottom: var(--spacing-8);
    }

    .summary-grid {
      display: grid;
      gap: var(--spacing-6);
    }

    .summary-card {
      transition: all var(--transition-normal);
    }

    .summary-card:hover {
      transform: translateY(-4px);
    }

    .summary-content {
      padding: 0;
    }

    .summary-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
    }

    .summary-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .summary-icon.primary {
      background: rgba(0, 194, 255, 0.1);
      color: var(--color-primary);
      box-shadow: 0 0 20px rgba(0, 194, 255, 0.2);
    }

    .summary-icon.success {
      background: rgba(0, 227, 150, 0.1);
      color: var(--color-success);
      box-shadow: 0 0 20px rgba(0, 227, 150, 0.2);
    }

    .summary-icon.warning {
      background: rgba(255, 189, 0, 0.1);
      color: var(--color-warning);
      box-shadow: 0 0 20px rgba(255, 189, 0, 0.2);
    }

    .summary-icon.info {
      background: rgba(0, 194, 255, 0.1);
      color: var(--color-primary);
      box-shadow: 0 0 20px rgba(0, 194, 255, 0.2);
    }

    .summary-info {
      flex: 1;
    }

    .summary-label {
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: var(--spacing-1);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 600;
      line-height: 1.2;
      margin-bottom: var(--spacing-1);
    }

    .summary-change {
      font-size: 0.875rem;
      font-weight: 500;
      padding: var(--spacing-1) var(--spacing-2);
      border-radius: var(--radius-sm);
    }

    .summary-percentage {
      font-size: 0.75rem;
      font-weight: 500;
      opacity: 0.8;
    }

    .summary-sublabel {
      font-size: 0.75rem;
      opacity: 0.7;
    }

    .positive {
      color: var(--color-success);
    }

    .negative {
      color: var(--color-danger);
    }

    /* Portfolio Content Layout */
    .portfolio-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--spacing-8);
    }

    .holdings-section,
    .allocation-section,
    .transactions-section {
      margin-bottom: var(--spacing-8);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-6);
      flex-wrap: wrap;
      gap: var(--spacing-4);
    }

    .header-left h2 {
      font-size: 2rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-1) 0;
      line-height: 1.3;
    }

    .section-subtitle {
      font-size: 1rem;
      margin: 0;
      opacity: 0.7;
    }

    .view-options {
      display: flex;
      gap: var(--spacing-1);
      background: var(--color-bg-glass);
      border: 1px solid var(--color-border-glass);
      border-radius: var(--radius-lg);
      padding: var(--spacing-1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    .view-toggle {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      padding: var(--spacing-2) var(--spacing-3);
      border: none;
      background: transparent;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .view-toggle:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--color-text-primary);
    }

    .view-toggle.active {
      background: rgba(0, 194, 255, 0.2);
      color: var(--color-primary);
      border: 1px solid rgba(0, 194, 255, 0.3);
    }

    /* Holdings Section */
    .holdings-container {
      display: grid;
      gap: var(--spacing-6);
    }

    .holdings-container.card-view {
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }

    .holdings-container.table-view {
      grid-template-columns: 1fr;
    }

    .holdings-loading {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--spacing-6);
    }

    .holding-skeleton {
      margin-bottom: 0;
    }

    .holding-skeleton-content {
      padding: var(--spacing-6);
      display: flex;
      align-items: center;
      gap: var(--spacing-4);
    }

    .holding-skeleton-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
    }

    .holding-card {
      transition: all var(--transition-normal);
      cursor: pointer;
    }

    .holding-card:hover {
      transform: translateY(-4px);
      border-color: var(--color-primary);
    }

    .holding-content {
      padding: var(--spacing-6);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4);
      height: 100%;
    }

    .holding-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .holding-info {
      flex: 1;
    }

    .coin-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-1) 0;
      line-height: 1.3;
    }

    .coin-amount {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .holding-details {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-2) 0;
      border-bottom: 1px solid var(--color-border);
    }

    .detail-label {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .detail-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .holding-row {
      display: grid;
      grid-template-columns: 2fr 2fr 1fr;
      gap: var(--spacing-4);
      align-items: center;
      padding: var(--spacing-4);
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-glass);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-2);
      transition: all var(--transition-fast);
    }

    .holding-row:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .holding-table-info {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1);
    }

    .holding-table-details {
      display: flex;
      gap: var(--spacing-4);
      align-items: center;
    }

    .holding-table-actions {
      display: flex;
      justify-content: flex-end;
    }

    /* Empty States */
    .empty-state {
      text-align: center;
      padding: var(--spacing-8);
    }

    .empty-content h3 {
      font-size: 1.5rem;
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-4);
    }

    .empty-content p {
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-6);
      opacity: 0.8;
    }

    /* Allocation Section */
    .allocation-card {
      height: fit-content;
    }

    .allocation-content {
      padding: var(--spacing-6);
      display: flex;
      gap: var(--spacing-6);
      align-items: center;
    }

    .pie-chart {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      position: relative;
      background: conic-gradient(
        from 0deg,
        rgba(255, 255, 255, 0.1) 0deg,
        rgba(255, 255, 255, 0.1) 360deg
      );
      border: 1px solid var(--color-border);
    }

    .pie-slice {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      transform-origin: center;
    }

    .allocation-legend {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4);
    }

    .legend-item {
      display: flex;
      gap: var(--spacing-3);
      align-items: center;
      padding: var(--spacing-2);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }

    .legend-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .legend-info {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1);
    }

    .legend-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .legend-percentage {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      font-weight: 600;
    }

    .legend-value {
      font-size: 0.75rem;
      color: var(--color-text-hint);
      font-family: var(--font-mono);
    }

    /* Transactions Section */
    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3);
    }

    .transaction-item {
      transition: all var(--transition-normal);
    }

    .transaction-item:hover {
      transform: translateX(4px);
    }

    .transaction-content {
      padding: var(--spacing-4);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .transaction-info {
      display: flex;
      gap: var(--spacing-4);
      align-items: center;
    }

    .transaction-type {
      padding: var(--spacing-1) var(--spacing-2);
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .transaction-type.buy {
      background: rgba(0, 227, 150, 0.2);
      color: var(--color-success);
      border: 1px solid rgba(0, 227, 150, 0.3);
    }

    .transaction-type.sell {
      background: rgba(255, 77, 106, 0.2);
      color: var(--color-danger);
      border: 1px solid rgba(255, 77, 106, 0.3);
    }

    .transaction-coin {
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .transaction-amount {
      color: var(--color-text-secondary);
      font-family: var(--font-mono);
    }

    .transaction-details {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1);
      align-items: flex-end;
    }

    .transaction-price {
      font-weight: 600;
      color: var(--color-text-primary);
      font-family: var(--font-mono);
    }

    .transaction-date {
      font-size: 0.75rem;
      color: var(--color-text-hint);
    }

    .empty-transactions {
      text-align: center;
      padding: var(--spacing-6);
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .portfolio-content {
        grid-template-columns: 1fr;
      }

      .summary-grid.grid-cols-4 {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .portfolio {
        padding: var(--spacing-4);
      }

      .portfolio-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-4);
      }

      .portfolio-title {
        font-size: 2rem;
      }

      .summary-grid.grid-cols-4,
      .summary-grid.grid-cols-2 {
        grid-template-columns: 1fr;
      }

      .holding-row {
        grid-template-columns: 1fr;
        gap: var(--spacing-3);
      }

      .holding-table-details {
        flex-wrap: wrap;
      }

      .allocation-content {
        flex-direction: column;
        gap: var(--spacing-4);
      }

      .pie-chart {
        width: 150px;
        height: 150px;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-3);
      }
    }

    @media (max-width: 480px) {
      .portfolio-title {
        font-size: 1.75rem;
      }

      .portfolio-actions {
        flex-direction: column;
        width: 100%;
      }

      .portfolio-actions ui-button {
        width: 100%;
      }

      .holdings-container.card-view {
        grid-template-columns: 1fr;
      }
    }

    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in {
      animation: fadeInUp 0.6s ease-out;
    }

    /* Glass effects for cards */
    .glass-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);
      border-radius: inherit;
      opacity: 0;
      transition: opacity var(--transition-fast);
      pointer-events: none;
    }

    .glass-card:hover::before {
      opacity: 1;
    }
  `]
})
export class PortfolioComponent implements OnInit {
  portfolioStore: PortfolioStore = inject(PortfolioStore);
  settingsStore: SettingsStore = inject(SettingsStore);

  // Signals
  viewMode = signal<'cards' | 'table'>('cards');

  // Computed properties
  holdings = this.portfolioStore.holdings;
  currentValue = this.portfolioStore.currentValue;
  totalInvested = this.portfolioStore.totalInvested;
  pnl = this.portfolioStore.pnl;
  roi = this.portfolioStore.roi;
  allocation = this.portfolioStore.allocation;
  currency = this.settingsStore.currency;

  recentTransactions = computed(() => 
    this.portfolioStore.transactions().slice(0, 5)
  );

  ngOnInit(): void {
    // Portfolio data is loaded automatically by the store
  }

  setViewMode(mode: 'cards' | 'table'): void {
    this.viewMode.set(mode);
  }

  // Portfolio actions
  async exportPortfolio(): Promise<void> {
    try {
      const data = await this.portfolioStore.exportPortfolio();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export portfolio:', error);
    }
  }

  showImportDialog(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  async handleFileImport(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await this.portfolioStore.importPortfolio(text);
    } catch (error) {
      console.error('Failed to import portfolio:', error);
    }
  }

  viewTransactions(coinId: string): void {
    // Navigate to transactions filtered by coin
    console.log('View transactions for:', coinId);
  }

  // Utility methods
  getCoinName(coinId: string): string {
    // This would typically come from a market data store
    return coinId.charAt(0).toUpperCase() + coinId.slice(1);
  }

  getHoldingValue(holding: any): number {
    // This would calculate based on current price
    return holding.amount * holding.avgBuyPrice * 1.1; // Mock 10% gain
  }

  getHoldingPnL(holding: any): number {
    const currentValue = this.getHoldingValue(holding);
    const invested = holding.amount * holding.avgBuyPrice;
    return currentValue - invested;
  }

  getCoinColor(coinId: string): string {
    const colors = [
      '#3f51b5', '#e91e63', '#4caf50', '#ff9800', 
      '#2196f3', '#9c27b0', '#00bcd4', '#ffeb3b'
    ];
    const index = coinId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }

  getCumulativeRotation(index: number): number {
    const allocation = this.allocation();
    let rotation = 0;
    for (let i = 0; i < index; i++) {
      rotation += (allocation[i].percentage / 100) * 360;
    }
    return rotation;
  }

  getSliceEndAngle(percentage: number): string {
    const angle = (percentage / 100) * 360;
    const x = 50 + 50 * Math.cos((angle - 90) * Math.PI / 180);
    const y = 50 + 50 * Math.sin((angle - 90) * Math.PI / 180);
    return `50% 50%, ${x}% ${y}%`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatChange(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${this.formatCurrency(value)}`;
  }

  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  getChangeClass(value: number): string {
    return value >= 0 ? 'positive' : 'negative';
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }
}
