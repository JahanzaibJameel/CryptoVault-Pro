import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'elevated' | 'outlined' | 'filled';
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
      transition: all 0.2s ease-in-out;
      overflow: hidden;
      position: relative;
    }

    .card-header {
      padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);
      border-bottom: 1px solid var(--color-border-default);
      background-color: var(--color-background-elevated);
    }

    .card-body {
      padding: var(--spacing-lg);
      flex: 1;
    }

    .card-footer {
      padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
      border-top: 1px solid var(--color-border-default);
      background-color: var(--color-background-elevated);
    }

    /* Variants */
    .elevated {
      background-color: var(--color-background-paper);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--color-border-light);
    }

    .elevated:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-1px);
    }

    .outlined {
      background-color: var(--color-background-paper);
      border: 1px solid var(--color-border-default);
      box-shadow: none;
    }

    .outlined:hover {
      border-color: var(--color-border-dark);
      box-shadow: var(--shadow-sm);
    }

    .filled {
      background-color: var(--color-background-elevated);
      border: none;
      box-shadow: none;
    }

    .filled:hover {
      background-color: var(--color-background-default);
    }

    /* Sizes */
    .sm .card-header,
    .sm .card-body,
    .sm .card-footer {
      padding: var(--spacing-sm) var(--spacing-md);
    }

    .sm .card-body {
      padding: var(--spacing-md);
    }

    .lg .card-header,
    .lg .card-body,
    .lg .card-footer {
      padding: var(--spacing-xl) var(--spacing-2xl);
    }

    .lg .card-body {
      padding: var(--spacing-xl);
    }

    /* Clickable card */
    .clickable {
      cursor: pointer;
    }

    .clickable:hover {
      transform: translateY(-2px);
    }

    .clickable:active {
      transform: translateY(0);
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
      background-color: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(1px);
    }

    /* Dark theme */
    [data-theme="dark"] .elevated {
      background-color: var(--color-background-paper);
      box-shadow: var(--shadow-dark-md);
      border-color: var(--color-border-dark);
    }

    [data-theme="dark"] .elevated:hover {
      box-shadow: var(--shadow-dark-lg);
    }

    [data-theme="dark"] .outlined {
      background-color: var(--color-background-paper);
      border-color: var(--color-border-default);
    }

    [data-theme="dark"] .outlined:hover {
      border-color: var(--color-border-light);
      box-shadow: var(--shadow-dark-sm);
    }

    [data-theme="dark"] .filled {
      background-color: var(--color-background-elevated);
    }

    [data-theme="dark"] .filled:hover {
      background-color: var(--color-background-paper);
    }

    [data-theme="dark"] .card-header,
    [data-theme="dark"] .card-footer {
      border-color: var(--color-border-dark);
      background-color: var(--color-background-elevated);
    }

    [data-theme="dark"] .loading::after {
      background-color: rgba(0, 0, 0, 0.1);
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
