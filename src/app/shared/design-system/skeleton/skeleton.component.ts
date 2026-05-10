import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'text' | 'rectangular' | 'circular';
export type SkeletonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [class]="skeletonClasses" 
      [style.width]="width" 
      [style.height]="height"
      [attr.aria-label]="ariaLabel || 'Loading...'"
      role="status"
      aria-live="polite"
    >
      <span class="sr-only">Loading...</span>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .skeleton {
      display: inline-block;
      background: linear-gradient(
        90deg,
        var(--color-gray-200) 25%,
        var(--color-gray-100) 50%,
        var(--color-gray-200) 75%
      );
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: var(--radius-md);
      position: relative;
      overflow: hidden;
    }

    .skeleton::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
      );
      animation: shimmer 1.5s infinite;
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    /* Variants */
    .text {
      border-radius: var(--radius-sm);
      height: 1em;
      margin: 0.25em 0;
    }

    .rectangular {
      border-radius: var(--radius-md);
    }

    .circular {
      border-radius: 50%;
    }

    /* Sizes */
    .xs {
      width: 1rem;
      height: 1rem;
    }

    .sm {
      width: 1.5rem;
      height: 1.5rem;
    }

    .md {
      width: 2rem;
      height: 2rem;
    }

    .lg {
      width: 3rem;
      height: 3rem;
    }

    .xl {
      width: 4rem;
      height: 4rem;
    }

    /* Text skeleton specific sizes */
    .text.xs {
      width: 4rem;
      height: 0.75rem;
    }

    .text.sm {
      width: 6rem;
      height: 0.875rem;
    }

    .text.md {
      width: 8rem;
      height: 1rem;
    }

    .text.lg {
      width: 12rem;
      height: 1.125rem;
    }

    .text.xl {
      width: 16rem;
      height: 1.25rem;
    }

    /* Animation speed variants */
    .fast {
      animation-duration: 1s;
    }

    .fast::after {
      animation-duration: 1s;
    }

    .slow {
      animation-duration: 2s;
    }

    .slow::after {
      animation-duration: 2s;
    }

    /* Screen reader only */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* Dark theme */
    [data-theme="dark"] .skeleton {
      background: linear-gradient(
        90deg,
        var(--color-gray-700) 25%,
        var(--color-gray-600) 50%,
        var(--color-gray-700) 75%
      );
    }

    [data-theme="dark"] .skeleton::after {
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
    }
  `]
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'rectangular';
  @Input() size: SkeletonSize = 'md';
  @Input() width?: string;
  @Input() height?: string;
  @Input() animationSpeed: 'normal' | 'fast' | 'slow' = 'normal';
  @Input() ariaLabel?: string;

  @HostBinding('class') get hostClasses(): string {
    return 'ui-skeleton-host';
  }

  get skeletonClasses(): string {
    const classes = [
      'skeleton',
      this.variant,
      this.size,
      this.animationSpeed !== 'normal' ? this.animationSpeed : ''
    ].filter(Boolean);

    return classes.join(' ');
  }
}
