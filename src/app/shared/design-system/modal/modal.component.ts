import { Component, Input, HostBinding, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'ui-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div 
          class="modal-container" 
          [class]="modalClasses"
          [class]="variantClass"
          [attr.aria-label]="ariaLabel"
          role="dialog"
          aria-modal="true"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header" *ngIf="showHeader">
            <div class="modal-title">
              <h2 *ngIf="title">{{ title }}</h2>
              <ng-content select="[slot=title]" *ngIf="!title"></ng-content>
            </div>
            <button 
              class="modal-close" 
              (click)="close()" 
              aria-label="Close modal"
              *ngIf="showCloseButton"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <ng-content></ng-content>
          </div>
          
          <div class="modal-footer" *ngIf="showFooter">
            <ng-content select="[slot=footer]"></ng-content>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--color-bg-overlay);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-modal);
      padding: var(--spacing-4);
      animation: fadeIn 0.2s ease-out;
    }

    .modal-container {
      background: var(--color-bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--color-border-glass);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-modal);
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      animation: slideUp 0.3s ease-out;
    }

    /* Glass shimmer effect */
    .modal-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
      border-radius: inherit;
      pointer-events: none;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-6);
      border-bottom: 1px solid var(--color-border);
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      position: relative;
      z-index: 1;
    }

    .modal-title {
      flex: 1;
      min-width: 0;
    }

    .modal-title h2 {
      font-family: var(--font-heading);
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
      line-height: 1.3;
    }

    .modal-close {
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: var(--spacing-2);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
      flex-shrink: 0;
      margin-left: var(--spacing-3);
    }

    .modal-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--color-text-primary);
      transform: scale(1.1);
    }

    .modal-body {
      padding: var(--spacing-6);
      flex: 1;
      overflow-y: auto;
      position: relative;
      z-index: 1;
    }

    .modal-footer {
      padding: var(--spacing-4) var(--spacing-6);
      border-top: 1px solid var(--color-border);
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--spacing-3);
      position: relative;
      z-index: 1;
    }

    /* Size Variants */
    .xs {
      width: 100%;
      max-width: 320px;
    }

    .sm {
      width: 100%;
      max-width: 448px;
    }

    .md {
      width: 100%;
      max-width: 640px;
    }

    .lg {
      width: 100%;
      max-width: 896px;
    }

    .xl {
      width: 100%;
      max-width: 1152px;
    }

    .full {
      width: 100%;
      max-width: 100%;
      height: 100%;
      max-height: 100vh;
      border-radius: 0;
    }

    /* Modal Variants */
    .variant-neon-primary {
      border-color: var(--color-primary);
      box-shadow: 
        var(--shadow-modal),
        0 0 30px rgba(0, 194, 255, 0.2);
    }

    .variant-neon-success {
      border-color: var(--color-success);
      box-shadow: 
        var(--shadow-modal),
        0 0 30px rgba(0, 227, 150, 0.2);
    }

    .variant-neon-danger {
      border-color: var(--color-danger);
      box-shadow: 
        var(--shadow-modal),
        0 0 30px rgba(255, 77, 106, 0.2);
    }

    /* Animations */
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .modal-backdrop {
        padding: var(--spacing-2);
      }

      .modal-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0;
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        max-height: 85vh;
      }

      .modal-header,
      .modal-body,
      .modal-footer {
        padding: var(--spacing-4);
      }

      .modal-title h2 {
        font-size: var(--font-size-lg);
      }
    }

    @media (max-width: 480px) {
      .modal-header,
      .modal-body,
      .modal-footer {
        padding: var(--spacing-3);
      }

      .modal-title h2 {
        font-size: var(--font-size-base);
      }
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title?: string;
  @Input() size: ModalSize = 'md';
  @Input() showHeader = true;
  @Input() showFooter = false;
  @Input() showCloseButton = true;
  @Input() closeOnBackdrop = true;
  @Input() ariaLabel?: string;
  @Input() variant?: 'neon-primary' | 'neon-success' | 'neon-danger';

  @Output() closeEvent = new EventEmitter<void>();
  @Output() openEvent = new EventEmitter<void>();

  @HostBinding('class') get hostClasses(): string {
    return 'ui-modal-host';
  }

  get modalClasses(): string {
    const classes = [this.size];
    return classes.join(' ');
  }

  get variantClass(): string {
    return this.variant ? 'variant-' + this.variant : '';
  }

  close(): void {
    this.isOpen = false;
    this.closeEvent.emit();
  }

  open(): void {
    this.isOpen = true;
    this.openEvent.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop && event.target === event.currentTarget) {
      this.close();
    }
  }
}
