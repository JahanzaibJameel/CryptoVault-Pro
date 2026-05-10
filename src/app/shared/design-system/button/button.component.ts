import { Component, Input, HostBinding, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'ghost' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
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
      gap: var(--spacing-sm);
      border: none;
      border-radius: var(--radius-md);
      font-family: var(--font-family-primary);
      font-weight: var(--font-weight-medium);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      position: relative;
      overflow: hidden;
      white-space: nowrap;
      user-select: none;
      outline: none;
    }

    button:focus-visible {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    /* Variants */
    .primary {
      background-color: var(--color-primary-500);
      color: var(--color-white);
      box-shadow: var(--shadow-sm);
    }

    .primary:hover:not(:disabled) {
      background-color: var(--color-primary-600);
      box-shadow: var(--shadow-md);
    }

    .primary:active:not(:disabled) {
      background-color: var(--color-primary-700);
      box-shadow: var(--shadow-sm);
    }

    .secondary {
      background-color: var(--color-gray-100);
      color: var(--color-gray-900);
      border: 1px solid var(--color-gray-300);
    }

    .secondary:hover:not(:disabled) {
      background-color: var(--color-gray-200);
      border-color: var(--color-gray-400);
    }

    .secondary:active:not(:disabled) {
      background-color: var(--color-gray-300);
    }

    .success {
      background-color: var(--color-success-500);
      color: var(--color-white);
      box-shadow: var(--shadow-sm);
    }

    .success:hover:not(:disabled) {
      background-color: var(--color-success-600);
      box-shadow: var(--shadow-md);
    }

    .success:active:not(:disabled) {
      background-color: var(--color-success-700);
      box-shadow: var(--shadow-sm);
    }

    .warning {
      background-color: var(--color-warning-500);
      color: var(--color-white);
      box-shadow: var(--shadow-sm);
    }

    .warning:hover:not(:disabled) {
      background-color: var(--color-warning-600);
      box-shadow: var(--shadow-md);
    }

    .warning:active:not(:disabled) {
      background-color: var(--color-warning-700);
      box-shadow: var(--shadow-sm);
    }

    .danger {
      background-color: var(--color-danger-500);
      color: var(--color-white);
      box-shadow: var(--shadow-sm);
    }

    .danger:hover:not(:disabled) {
      background-color: var(--color-danger-600);
      box-shadow: var(--shadow-md);
    }

    .danger:active:not(:disabled) {
      background-color: var(--color-danger-700);
      box-shadow: var(--shadow-sm);
    }

    .info {
      background-color: var(--color-info-500);
      color: var(--color-white);
      box-shadow: var(--shadow-sm);
    }

    .info:hover:not(:disabled) {
      background-color: var(--color-info-600);
      box-shadow: var(--shadow-md);
    }

    .info:active:not(:disabled) {
      background-color: var(--color-info-700);
      box-shadow: var(--shadow-sm);
    }

    .ghost {
      background-color: transparent;
      color: var(--color-primary-500);
      border: 1px solid transparent;
    }

    .ghost:hover:not(:disabled) {
      background-color: var(--color-primary-50);
      border-color: var(--color-primary-200);
    }

    .ghost:active:not(:disabled) {
      background-color: var(--color-primary-100);
    }

    .link {
      background-color: transparent;
      color: var(--color-primary-500);
      border: none;
      padding: 0;
      box-shadow: none;
      text-decoration: underline;
    }

    .link:hover:not(:disabled) {
      color: var(--color-primary-600);
      text-decoration: none;
    }

    .link:active:not(:disabled) {
      color: var(--color-primary-700);
    }

    /* Sizes */
    .xs {
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: var(--font-size-xs);
      min-height: 1.5rem;
      border-radius: var(--radius-sm);
    }

    .sm {
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: var(--font-size-sm);
      min-height: 2rem;
    }

    .md {
      padding: var(--spacing-sm) var(--spacing-lg);
      font-size: var(--font-size-base);
      min-height: 2.5rem;
    }

    .lg {
      padding: var(--spacing-md) var(--spacing-xl);
      font-size: var(--font-size-lg);
      min-height: 3rem;
    }

    .xl {
      padding: var(--spacing-lg) var(--spacing-2xl);
      font-size: var(--font-size-xl);
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

    /* Dark theme */
    [data-theme="dark"] .secondary {
      background-color: var(--color-gray-800);
      color: var(--color-gray-100);
      border-color: var(--color-gray-600);
    }

    [data-theme="dark"] .secondary:hover:not(:disabled) {
      background-color: var(--color-gray-700);
      border-color: var(--color-gray-500);
    }

    [data-theme="dark"] .secondary:active:not(:disabled) {
      background-color: var(--color-gray-600);
    }

    [data-theme="dark"] .ghost:hover:not(:disabled) {
      background-color: var(--color-primary-900);
      border-color: var(--color-primary-700);
    }

    [data-theme="dark"] .ghost:active:not(:disabled) {
      background-color: var(--color-primary-800);
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

  buttonClasses = computed(() => {
    const classes = [
      this.variant,
      this.size,
      this.fullWidth ? 'full-width' : ''
    ].filter(Boolean);

    return classes.join(' ');
  });

  handleClick(event: Event) {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
