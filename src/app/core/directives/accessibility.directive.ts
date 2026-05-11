import { Directive, ElementRef, Renderer2, inject, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { AccessibilityService } from '../services/accessibility.service';

@Directive({
  selector: '[appAccessibility]',
  standalone: true
})
export class AccessibilityDirective {
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  private accessibilityService = inject(AccessibilityService);

  @Input() role?: string;
  @Input() label?: string;
  @Input() description?: string;
  @Input() ariaLabel?: string;
  @Input() ariaDescribedBy?: string;
  @Input() ariaExpanded?: boolean;
  @Input() ariaSelected?: boolean;
  @Input() ariaDisabled?: boolean;
  @Input() ariaRequired?: boolean;
  @Input() ariaInvalid?: boolean;
  @Input() ariaHidden?: boolean;
  @Input() tabIndex?: number;
  @Input() focusTrap?: boolean;
  @Input() skipLink?: boolean;
  @Input() announceOnMount?: string;

  @Output() focusChange = new EventEmitter<boolean>();
  @Output() blur = new EventEmitter<void>();

  private hasFocus = false;

  constructor() {
    this.setupAccessibility();
  }

  private setupAccessibility(): void {
    const element = this.elementRef.nativeElement;

    // Set ARIA attributes
    if (this.role) {
      this.renderer.setAttribute(element, 'role', this.role);
    }

    if (this.ariaLabel || this.label) {
      this.renderer.setAttribute(element, 'aria-label', this.ariaLabel || this.label || '');
    }

    if (this.description) {
      this.renderer.setAttribute(element, 'aria-description', this.description);
    }

    if (this.ariaDescribedBy) {
      this.renderer.setAttribute(element, 'aria-describedby', this.ariaDescribedBy);
    }

    if (this.ariaExpanded !== undefined) {
      this.renderer.setAttribute(element, 'aria-expanded', this.ariaExpanded.toString());
    }

    if (this.ariaSelected !== undefined) {
      this.renderer.setAttribute(element, 'aria-selected', this.ariaSelected.toString());
    }

    if (this.ariaDisabled !== undefined) {
      this.renderer.setAttribute(element, 'aria-disabled', this.ariaDisabled.toString());
    }

    if (this.ariaRequired !== undefined) {
      this.renderer.setAttribute(element, 'aria-required', this.ariaRequired.toString());
    }

    if (this.ariaInvalid !== undefined) {
      this.renderer.setAttribute(element, 'aria-invalid', this.ariaInvalid.toString());
    }

    if (this.ariaHidden !== undefined) {
      this.renderer.setAttribute(element, 'aria-hidden', this.ariaHidden.toString());
    }

    if (this.tabIndex !== undefined) {
      this.renderer.setAttribute(element, 'tabindex', this.tabIndex.toString());
    }

    // Add accessibility classes
    this.renderer.addClass(element, 'accessibility-enhanced');

    // Set up focus trap if requested
    if (this.focusTrap) {
      this.setupFocusTrap();
    }

    // Set up skip link if requested
    if (this.skipLink) {
      this.setupSkipLink();
    }

    // Announce element if requested
    if (this.announceOnMount) {
      this.accessibilityService.announce(this.announceOnMount, 'polite');
    }
  }

  private setupFocusTrap(): void {
    const element = this.elementRef.nativeElement;
    
    if (element instanceof HTMLElement) {
      this.accessibilityService.trapFocus({
        container: element,
        escapeKey: () => {
          this.accessibilityService.announce('Focus trap escaped', 'polite');
        }
      });
    }
  }

  private setupSkipLink(): void {
    const element = this.elementRef.nativeElement;
    
    if (element instanceof HTMLElement && element.tagName === 'A') {
      this.renderer.addClass(element, 'skip-link');
    }
  }

  @HostListener('focus', ['$event'])
  onFocus(event: FocusEvent): void {
    this.hasFocus = true;
    this.focusChange.emit(true);
    
    // Add focus visible class for keyboard navigation
    if (this.accessibilityService.getNavigationMode() === 'keyboard') {
      this.renderer.addClass(this.elementRef.nativeElement, 'keyboard-focus');
    }
  }

  @HostListener('blur')
  onBlur(): void {
    this.hasFocus = false;
    this.blur.emit();
    
    // Remove focus visible class
    this.renderer.removeClass(this.elementRef.nativeElement, 'keyboard-focus');
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Handle space key for buttons when focused
    if (event.key === ' ' && this.hasFocus) {
      const element = this.elementRef.nativeElement;
      
      if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
        event.preventDefault();
        element.click();
      }
    }

    // Handle escape key
    if (event.key === 'Escape') {
      this.accessibilityService.announce('Escape key pressed', 'polite');
    }
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    // Announce hover for screen readers
    if (this.label || this.ariaLabel) {
      this.accessibilityService.announce(`Hovering over ${this.label || this.ariaLabel}`, 'polite');
    }
  }

  // Update methods
  updateAccessibilityAttributes(changes: Partial<AccessibilityDirective>): void {
    Object.assign(this, changes);
    this.setupAccessibility();
  }

  setFocus(): void {
    this.elementRef.nativeElement.focus();
  }

  removeFocus(): void {
    this.elementRef.nativeElement.blur();
  }

  // Getters
  isFocused(): boolean {
    return this.hasFocus;
  }
}
