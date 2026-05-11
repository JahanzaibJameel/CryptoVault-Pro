import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'elevated' | 'outlined' | 'filled' | 'glass';
export type CardSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses" [attr.aria-label]="ariaLabel">
      @if (header) {
        <div class="card-header">
          <ng-content select="[slot=header]" />
        </div>
      }
      <div class="card-body">
        <ng-content />
      </div>
      @if (footer) {
        <div class="card-footer">
          <ng-content select="[slot=footer]" />
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .card {
      border-radius: var(--radius-lg);
      transition: all var(--transition-normal);
      overflow: hidden;
      position: relative;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    /* Glass effect overlay */
    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
      border-radius: inherit;
      opacity: 0;
      transition: opacity var(--transition-fast);
      pointer-events: none;
    }

    .card:hover::before {
      opacity: 1;
    }

    .card-header {
      padding: var(--spacing-6) var(--spacing-6) var(--spacing-4);
      border-bottom: 1px solid var(--color-border);
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    .card-body {
      padding: var(--spacing-6);
      flex: 1;
      position: relative;
      z-index: 1;
    }

    .card-footer {
      padding: var(--spacing-4) var(--spacing-6) var(--spacing-6);
      border-top: 1px solid var(--color-border);
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    /* Variants */
    .elevated {
      background: var(--color-bg-glass);
      border: 1px solid var(--color-border-glass);
      box-shadow: var(--shadow-glass);
    }

    .elevated:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.12);
      box-shadow: var(--shadow-glass-hover);
      transform: translateY(-4px);
    }

    .outlined {
      background: var(--color-bg-glass);
      border: 1px solid var(--color-border);
      box-shadow: none;
    }

    .outlined:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: var(--color-primary);
      box-shadow: 0 0 20px rgba(0, 194, 255, 0.2);
      transform: translateY(-2px);
    }

    .glass {
      background: var(--color-bg-glass);
      border: 1px solid var(--color-border-glass);
      box-shadow: var(--shadow-glass);
    }

    .glass:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.16);
      box-shadow: var(--shadow-glass-hover);
      transform: translateY(-2px);
    }

    .neon {
      background: var(--color-bg-glass);
      border: 1px solid var(--color-primary);
      box-shadow: 0 4px 16px rgba(0, 194, 255, 0.3);
    }

    .neon:hover {
      background: rgba(0, 194, 255, 0.05);
      border-color: var(--color-primary);
      box-shadow: 0 8px 32px rgba(0, 194, 255, 0.5);
      transform: translateY(-4px);
    }

    /* Sizes */
    .sm .card-header,
    .sm .card-body,
    .sm .card-footer {
      padding: var(--spacing-3) var(--spacing-4);
    }

    .sm .card-body {
      padding: var(--spacing-4);
    }

    .lg .card-header,
    .lg .card-body,
    .lg .card-footer {
      padding: var(--spacing-8) var(--spacing-8);
    }

    .lg .card-body {
      padding: var(--spacing-8);
    }

    /* Clickable card */
    .clickable {
      cursor: pointer;
    }

    .clickable:hover {
      transform: translateY(-4px);
    }

    .clickable:active {
      transform: translateY(-2px);
    }

    /* Loading state */
    .loading {
      pointer-events: none;
      opacity: 0.7;
    }

    .loading::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
      border-radius: inherit;
      z-index: 10;
    }

    /* Accent border variants */
    .accent-primary {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 1px rgba(0, 194, 255, 0.2);
    }

    .accent-success {
      border-color: var(--color-success);
      box-shadow: 0 0 0 1px rgba(0, 227, 150, 0.2);
    }

    .accent-danger {
      border-color: var(--color-danger);
      box-shadow: 0 0 0 1px rgba(255, 77, 106, 0.2);
    }

    .accent-warning {
      border-color: var(--color-warning);
      box-shadow: 0 0 0 1px rgba(255, 189, 0, 0.2);
    }

    /* Interactive states */
    .interactive {
      cursor: pointer;
      transition: all var(--transition-normal);
    }

    .interactive:hover {
      transform: translateY(-2px) scale(1.01);
    }

    .interactive:active {
      transform: translateY(0) scale(0.99);
    }

    /* Content animations */
    .card-body > *:first-child {
      animation: fadeInUp 0.6s ease-out;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Glow effect on hover */
    .glow-on-hover:hover {
      box-shadow: 
        var(--shadow-glass-hover),
        0 0 30px rgba(0, 194, 255, 0.3);
    }
  `]
})
export class CardComponent {
  @Input() variant: CardVariant = 'elevated';
  @Input() size: CardSize = 'md';
  @Input() clickable = false;
  @Input() loading = false;
  @Input() header = false;
  @Input() footer = false;
  @Input() ariaLabel?: string;

  @HostBinding('class') get hostClasses(): string {
    return 'ui-card-host';
  }

  get cardClasses(): string {
    const classes = [
      this.variant,
      this.size,
      this.clickable ? 'clickable' : '',
      this.loading ? 'loading' : ''
    ].filter(Boolean);

    return `card ${classes.join(' ')}`;
  }
}
