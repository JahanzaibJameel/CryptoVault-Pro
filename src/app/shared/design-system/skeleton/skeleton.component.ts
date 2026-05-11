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
        rgba(255, 255, 255, 0.02) 0%,
        rgba(255, 255, 255, 0.08) 50%,
        rgba(255, 255, 255, 0.02) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      border-radius: var(--radius-md);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.04);
    }

    /* Glass shimmer effect */
    .skeleton::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(0, 194, 255, 0.1) 50%,
        transparent 100%
      );
      animation: glassShimmer 2s ease-in-out infinite;
      border-radius: inherit;
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
        transparent 0%,
        rgba(255, 255, 255, 0.1) 50%,
        transparent 100%
      );
      animation: shimmer 1.5s ease-in-out infinite;
      border-radius: inherit;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    @keyframes glassShimmer {
      0% {
        background-position: -300% 0;
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
      100% {
        background-position: 300% 0;
        opacity: 0;
      }
    }

    /* Variants */
    .text {
      border-radius: var(--radius-sm);
      height: 1em;
      margin: 0.25em 0;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.03) 0%,
        rgba(255, 255, 255, 0.06) 50%,
        rgba(255, 255, 255, 0.03) 100%
      );
    }

    .rectangular {
      border-radius: var(--radius-md);
    }

    .circular {
      border-radius: 50%;
    }

    .glass {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.02) 0%,
        rgba(255, 255, 255, 0.08) 50%,
        rgba(255, 255, 255, 0.02) 100%
      );
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .neon {
      background: linear-gradient(
        90deg,
        rgba(0, 194, 255, 0.02) 0%,
        rgba(0, 194, 255, 0.08) 50%,
        rgba(0, 194, 255, 0.02) 100%
      );
      border: 1px solid rgba(0, 194, 255, 0.2);
      box-shadow: 0 0 10px rgba(0, 194, 255, 0.2);
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

    /* Card skeleton */
    .card-skeleton {
      width: 100%;
      height: 120px;
      border-radius: var(--radius-lg);
      background: var(--color-bg-glass);
      border: 1px solid var(--color-border-glass);
      box-shadow: var(--shadow-glass);
      overflow: hidden;
    }

    .card-skeleton::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.04) 0%,
        rgba(255, 255, 255, 0.08) 50%,
        rgba(255, 255, 255, 0.04) 100%
      );
      border-bottom: 1px solid var(--color-border);
    }

    /* Animation speed variants */
    .fast {
      animation-duration: 1s;
    }

    .fast::after {
      animation-duration: 1s;
    }

    .slow {
      animation-duration: 2.5s;
    }

    .slow::after {
      animation-duration: 2.5s;
    }

    /* Pulse variant */
    .pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.4;
      }
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

    /* Group skeleton for multiple elements */
    .skeleton-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
    }

    .skeleton-group .skeleton {
      margin: 0;
    }

    /* Dark theme is now default - no separate dark theme needed */
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
