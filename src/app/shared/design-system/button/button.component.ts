import { Component, Input, HostBinding, computed } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'ghost' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [],
  template: `
    <button
      [class]="buttonClasses"
      [disabled]="disabled || loading"
      [attr.aria-label]="ariaLabel"
      [attr.aria-describedby]="ariaDescribedBy"
      [attr.type]="type"
      (click)="handleClick($event)"
    >
      @if (loading) {
        <span class="button-spinner" aria-hidden="true"></span>
      }
      @if (icon && iconPosition === 'left') {
        <span class="button-icon button-icon-left" aria-hidden="true">{{ icon }}</span>
      }
      <span class="button-text">
        <ng-content />
      </span>
      @if (icon && iconPosition === 'right') {
        <span class="button-icon button-icon-right" aria-hidden="true">{{ icon }}</span>
      }
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-2);
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font-primary);
      font-weight: 500;
      font-size: 0.875rem;
      text-decoration: none;
      cursor: pointer;
      transition: all var(--transition-normal);
      position: relative;
      overflow: hidden;
      white-space: nowrap;
      user-select: none;
      outline: none;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    button:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(0, 194, 255, 0.2);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
      transform: none !important;
    }

    button:active:not(:disabled) {
      transform: scale(0.97);
    }

    /* Glass Base */
    button::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border-radius: inherit;
      opacity: 0;
      transition: opacity var(--transition-fast);
    }

    button:hover::before {
      opacity: 1;
    }

    /* Primary Variant - Electric Blue Glass */
    .primary {
      background: var(--color-bg-glass);
      color: var(--color-primary);
      border: 1px solid rgba(0, 194, 255, 0.3);
      box-shadow: 0 4px 16px rgba(0, 194, 255, 0.2);
    }

    .primary:hover:not(:disabled) {
      background: rgba(0, 194, 255, 0.1);
      border-color: rgba(0, 194, 255, 0.5);
      box-shadow: 0 8px 32px rgba(0, 194, 255, 0.4);
      transform: translateY(-2px);
    }

    .primary:active:not(:disabled) {
      box-shadow: 0 4px 16px rgba(0, 194, 255, 0.3);
    }

    /* Secondary Variant - Outlined Glass */
    .secondary {
      background: var(--color-bg-glass);
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-glass);
      box-shadow: var(--shadow-glass);
    }

    .secondary:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.12);
      box-shadow: var(--shadow-glass-hover);
      transform: translateY(-2px);
    }

    .secondary:active:not(:disabled) {
      transform: scale(0.97);
    }

    /* Success Variant - Emerald Mint Glass */
    .success {
      background: var(--color-bg-glass);
      color: var(--color-success);
      border: 1px solid rgba(0, 227, 150, 0.3);
      box-shadow: 0 4px 16px rgba(0, 227, 150, 0.2);
    }

    .success:hover:not(:disabled) {
      background: rgba(0, 227, 150, 0.1);
      border-color: rgba(0, 227, 150, 0.5);
      box-shadow: 0 8px 32px rgba(0, 227, 150, 0.4);
      transform: translateY(-2px);
    }

    .success:active:not(:disabled) {
      box-shadow: 0 4px 16px rgba(0, 227, 150, 0.3);
    }

    /* Warning Variant - Golden Glass */
    .warning {
      background: var(--color-bg-glass);
      color: var(--color-warning);
      border: 1px solid rgba(255, 189, 0, 0.3);
      box-shadow: 0 4px 16px rgba(255, 189, 0, 0.2);
    }

    .warning:hover:not(:disabled) {
      background: rgba(255, 189, 0, 0.1);
      border-color: rgba(255, 189, 0, 0.5);
      box-shadow: 0 8px 32px rgba(255, 189, 0, 0.4);
      transform: translateY(-2px);
    }

    .warning:active:not(:disabled) {
      box-shadow: 0 4px 16px rgba(255, 189, 0, 0.3);
    }

    /* Danger Variant - Soft Crimson Glass */
    .danger {
      background: var(--color-bg-glass);
      color: var(--color-danger);
      border: 1px solid rgba(255, 77, 106, 0.3);
      box-shadow: 0 4px 16px rgba(255, 77, 106, 0.2);
    }

    .danger:hover:not(:disabled) {
      background: rgba(255, 77, 106, 0.1);
      border-color: rgba(255, 77, 106, 0.5);
      box-shadow: 0 8px 32px rgba(255, 77, 106, 0.4);
      transform: translateY(-2px);
    }

    .danger:active:not(:disabled) {
      box-shadow: 0 4px 16px rgba(255, 77, 106, 0.3);
    }

    /* Info Variant - Electric Blue Glass */
    .info {
      background: var(--color-bg-glass);
      color: var(--color-primary);
      border: 1px solid rgba(0, 194, 255, 0.3);
      box-shadow: 0 4px 16px rgba(0, 194, 255, 0.2);
    }

    .info:hover:not(:disabled) {
      background: rgba(0, 194, 255, 0.1);
      border-color: rgba(0, 194, 255, 0.5);
      box-shadow: 0 8px 32px rgba(0, 194, 255, 0.4);
      transform: translateY(-2px);
    }

    .info:active:not(:disabled) {
      box-shadow: 0 4px 16px rgba(0, 194, 255, 0.3);
    }

    /* Ghost Variant */
    .ghost {
      background: transparent;
      color: var(--color-text-secondary);
      border: 1px solid transparent;
    }

    .ghost:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.05);
      color: var(--color-text-primary);
      border-color: var(--color-border);
    }

    .ghost:active:not(:disabled) {
      background: rgba(255, 255, 255, 0.08);
    }

    /* Link Variant */
    .link {
      background: transparent;
      color: var(--color-primary);
      border: none;
      padding: 0;
      box-shadow: none;
      text-decoration: none;
      font-weight: 500;
    }

    .link:hover:not(:disabled) {
      color: var(--color-primary);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .link:active:not(:disabled) {
      text-decoration: underline;
    }

    /* Sizes */
    .xs {
      padding: var(--spacing-1) var(--spacing-2);
      font-size: 0.75rem;
      min-height: 1.5rem;
      border-radius: var(--radius-sm);
    }

    .sm {
      padding: var(--spacing-2) var(--spacing-3);
      font-size: 0.875rem;
      min-height: 2rem;
    }

    .md {
      padding: var(--spacing-3) var(--spacing-4);
      font-size: 0.875rem;
      min-height: 2.5rem;
    }

    .lg {
      padding: var(--spacing-4) var(--spacing-6);
      font-size: 1rem;
      min-height: 3rem;
    }

    .xl {
      padding: var(--spacing-5) var(--spacing-8);
      font-size: 1.125rem;
      min-height: 3.5rem;
    }

    /* Full width */
    .full-width {
      width: 100%;
    }

    /* Icon styles */
    .button-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .button-text {
      flex: 1;
      text-align: center;
    }

    /* Loading spinner */
    .button-spinner {
      width: 1em;
      height: 1em;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Ripple effect */
    button::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    button:active::after {
      width: 300px;
      height: 300px;
    }
  `]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() icon?: string;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() ariaLabel?: string;
  @Input() ariaDescribedBy?: string;

  @HostBinding('class') get hostClasses(): string {
    return 'ui-button-host';
  }

  get buttonClasses(): string {
    const classes = [
      this.variant,
      this.size,
      this.fullWidth ? 'full-width' : ''
    ].filter(Boolean);

    return classes.join(' ');
  }

  handleClick(event: Event) {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
