/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, signal, inject } from '@angular/core';
import { LoggerService } from './logger.service';

export type AccessibilityLevel = 'AA' | 'AAA';
export type FocusTrapMode = 'strict' | 'loose';
export type NavigationMode = 'mouse' | 'keyboard' | 'touch' | 'switch';

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
  announcements: boolean;
  skipLinks: boolean;
  focusTrap: boolean;
  colorBlindFriendly: boolean;
}

export interface FocusTrapConfig {
  container: HTMLElement;
  initialFocus?: HTMLElement;
  restoreFocus?: HTMLElement;
  escapeKey?: () => void;
}

export interface ScreenReaderAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
  timeout?: number;
}

export interface AccessibilityViolation {
  type: 'contrast' | 'keyboard' | 'aria' | 'focus' | 'semantic' | 'color';
  severity: 'error' | 'warning' | 'info';
  element: HTMLElement;
  message: string;
  suggestion: string;
  wcagCriterion: string;
}

@Injectable({
  providedIn: 'root',
})
export class AccessibilityService {
  private loggerService = inject(LoggerService);

  private settings = signal<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    focusVisible: true,
    announcements: true,
    skipLinks: true,
    focusTrap: true,
    colorBlindFriendly: false,
  });

  private currentFocusTrap = signal<FocusTrapConfig | null>(null);
  private navigationMode = signal<NavigationMode>('mouse');
  private violations = signal<AccessibilityViolation[]>([]);
  private announcementQueue: ScreenReaderAnnouncement[] = [];
  private isAnnouncing = false;

  constructor() {
    this.initializeAccessibility();
  }

  private initializeAccessibility(): void {
    // Detect user preferences
    this.detectUserPreferences();

    // Set up event listeners
    this.setupEventListeners();

    // Create live regions for screen readers
    this.createLiveRegions();

    // Perform initial accessibility check
    this.checkAccessibility();

    this.loggerService.info(
      'Accessibility service initialized',
      {
        settings: this.settings(),
        navigationMode: this.navigationMode(),
      },
      'accessibility',
    );
  }

  private detectUserPreferences(): void {
    // Guard against environments where matchMedia is not available (e.g., Jest tests)
    if (!window.matchMedia) {
      return;
    }

    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
    };

    // Apply detected preferences
    if (mediaQueries.reducedMotion.matches) {
      this.updateSetting('reducedMotion', true);
    }

    if (mediaQueries.highContrast.matches) {
      this.updateSetting('highContrast', true);
    }

    // Listen for changes
    Object.entries(mediaQueries).forEach(([setting, mq]) => {
      if (mq && typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', (e: MediaQueryListEvent) => {
          this.updateSetting(setting as keyof AccessibilitySettings, e.matches);
        });
      } else if (mq && typeof (mq as any).addListener === 'function') {
        (mq as any).addListener((e: MediaQueryListEvent) => {
          this.updateSetting(setting as keyof AccessibilitySettings, e.matches);
        });
      }
    });
  }

  refreshUserPreferences(): void {
    this.detectUserPreferences();
  }

  private setupEventListeners(): void {
    // Track navigation mode
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.navigationMode.set('keyboard');
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      this.navigationMode.set('mouse');
      document.body.classList.remove('keyboard-navigation');
    });

    document.addEventListener('touchstart', () => {
      this.navigationMode.set('touch');
    });

    // Handle focus management
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));

    // Handle escape key for focus traps
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscapeKey(e);
      }
    });
  }

  private createLiveRegions(): void {
    // Create live regions for screen reader announcements
    const politeRegion = document.createElement('div');
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    politeRegion.className = 'sr-only live-region-polite';
    politeRegion.style.position = 'absolute';
    politeRegion.style.left = '-10000px';
    politeRegion.style.width = '1px';
    politeRegion.style.height = '1px';
    politeRegion.style.overflow = 'hidden';
    document.body.appendChild(politeRegion);

    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only live-region-assertive';
    assertiveRegion.style.position = 'absolute';
    assertiveRegion.style.left = '-10000px';
    assertiveRegion.style.width = '1px';
    assertiveRegion.style.height = '1px';
    assertiveRegion.style.overflow = 'hidden';
    document.body.appendChild(assertiveRegion);
  }

  private getDocumentRoot(): HTMLElement {
    return document.documentElement;
  }

  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;

    if (this.settings().focusVisible && this.navigationMode() === 'keyboard') {
      target.classList.add('focus-visible');
    }

    // Announce focusable element for screen readers
    if (this.settings().screenReader && this.settings().announcements) {
      const announcement = this.getFocusAnnouncement(target);
      if (announcement) {
        this.announce(announcement, 'polite');
      }
    }
  }

  private handleFocusOut(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    target.classList.remove('focus-visible');
  }

  private handleEscapeKey(event: KeyboardEvent): void {
    const focusTrap = this.currentFocusTrap();
    if (focusTrap && focusTrap.escapeKey) {
      focusTrap.escapeKey();
      event.preventDefault();
    }
  }

  private getFocusAnnouncement(element: HTMLElement): string | null {
    // Generate appropriate announcement for focused element
    if (element.tagName === 'BUTTON') {
      return `Button, ${element.textContent?.trim() || 'unnamed'}`;
    } else if (element.tagName === 'INPUT') {
      const type = element.getAttribute('type') || 'text';
      const label =
        element.getAttribute('aria-label') ||
        element.getAttribute('placeholder') ||
        element.getAttribute('title') ||
        `input field`;
      return `${label}, ${type} input`;
    } else if (element.tagName === 'A') {
      return `Link, ${element.textContent?.trim() || 'unnamed'}`;
    } else if (element.getAttribute('role')) {
      const role = element.getAttribute('role')!;
      const label =
        element.getAttribute('aria-label') || element.textContent?.trim() || `${role} element`;
      return `${label}, ${role}`;
    }

    return null;
  }

  // Public API methods
  updateSetting(setting: keyof AccessibilitySettings, value: boolean): void {
    this.settings.update((current) => ({ ...current, [setting]: value }));
    this.applyAccessibilityClasses();

    this.loggerService.info(
      'Accessibility setting updated',
      {
        setting,
        value,
        allSettings: this.settings(),
      },
      'accessibility',
    );
  }

  private applyAccessibilityClasses(): void {
    const body = document.body;
    const settings = this.settings();

    // Apply or remove classes based on settings
    body.classList.toggle('high-contrast', settings.highContrast);
    body.classList.toggle('large-text', settings.largeText);
    body.classList.toggle('reduced-motion', settings.reducedMotion);
    body.classList.toggle('screen-reader-mode', settings.screenReader);
    body.classList.toggle('keyboard-navigation', settings.keyboardNavigation);
    body.classList.toggle('focus-visible-enabled', settings.focusVisible);
    body.classList.toggle('announcements-enabled', settings.announcements);
    body.classList.toggle('skip-links-enabled', settings.skipLinks);
    body.classList.toggle('color-blind-friendly', settings.colorBlindFriendly);

    // Update CSS custom properties
    this.updateCSSProperties();
  }

  private updateCSSProperties(): void {
    const root = this.getDocumentRoot();
    const settings = this.settings();

    if (settings.largeText) {
      root.style.setProperty('--font-size-base', '18px');
      root.style.setProperty('--font-size-small', '16px');
      root.style.setProperty('--font-size-large', '20px');
    } else {
      root.style.setProperty('--font-size-base', '16px');
      root.style.setProperty('--font-size-small', '14px');
      root.style.setProperty('--font-size-large', '18px');
    }

    if (settings.highContrast) {
      root.style.setProperty('--contrast-ratio', '7');
      root.style.setProperty('--text-primary', '#000000');
      root.style.setProperty('--text-secondary', '#333333');
      root.style.setProperty('--background-primary', '#ffffff');
      root.style.setProperty('--background-secondary', '#f5f5f5');
    }

    if (settings.reducedMotion) {
      root.style.setProperty('--transition-duration', '0s');
      root.style.setProperty('--animation-duration', '0s');
    }
  }

  // Focus management
  trapFocus(config: FocusTrapConfig): void {
    if (!this.settings().focusTrap) return;

    // Remove existing focus trap
    this.removeFocusTrap();

    // Set up new focus trap config so cleanup still works even when there are no focusable descendants
    this.currentFocusTrap.set(config);

    // Find all focusable elements
    const focusableElements = config.container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) as NodeListOf<HTMLElement>;

    // Handle tab navigation within trap
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    config.container.addEventListener('keydown', handleTabKey);
    (config.container as any)._focusTrapHandler = handleTabKey;

    if (focusableElements.length === 0) {
      return;
    }

    // Set initial focus
    const initialElement = config.initialFocus || focusableElements[0];
    initialElement.focus();
  }

  removeFocusTrap(): void {
    const currentTrap = this.currentFocusTrap();
    if (currentTrap) {
      // Remove event listener
      if ((currentTrap.container as any)._focusTrapHandler) {
        currentTrap.container.removeEventListener(
          'keydown',
          (currentTrap.container as any)._focusTrapHandler,
        );
        delete (currentTrap.container as any)._focusTrapHandler;
      }

      // Restore focus
      if (currentTrap.restoreFocus) {
        currentTrap.restoreFocus.focus();
      }

      this.currentFocusTrap.set(null);
    }
  }

  // Screen reader announcements
  announce(message: string, priority: 'polite' | 'assertive' = 'polite', timeout?: number): void {
    if (!this.settings().announcements) return;

    const announcement: ScreenReaderAnnouncement = {
      message,
      priority,
      timeout,
    };

    this.announcementQueue.push(announcement);
    this.processAnnouncementQueue();
  }

  private async processAnnouncementQueue(): Promise<void> {
    if (this.isAnnouncing || this.announcementQueue.length === 0) return;

    this.isAnnouncing = true;

    while (this.announcementQueue.length > 0) {
      const announcement = this.announcementQueue.shift()!;
      await this.makeAnnouncement(announcement);
    }

    this.isAnnouncing = false;
  }

  private makeAnnouncement(announcement: ScreenReaderAnnouncement): Promise<void> {
    return new Promise((resolve) => {
      const region = document.querySelector(`.live-region-${announcement.priority}`) as HTMLElement;

      if (!region) {
        resolve();
        return;
      }

      // Clear previous content
      region.textContent = '';

      // Set new content
      setTimeout(() => {
        region.textContent = announcement.message;

        // Clear after timeout
        if (announcement.timeout) {
          setTimeout(() => {
            region.textContent = '';
            resolve();
          }, announcement.timeout);
        } else {
          // Default timeout for screen readers to process
          setTimeout(() => {
            region.textContent = '';
            resolve();
          }, 1000);
        }
      }, 100);
    });
  }

  private normalizeNodeList<T extends Node>(nodes: NodeListOf<T> | T[] | null | undefined): T[] {
    if (!nodes) {
      return [];
    }
    return Array.isArray(nodes) ? nodes : Array.from(nodes);
  }

  private getStyles(element: Element | { style?: any }): CSSStyleDeclaration | any {
    if (element && typeof (element as any).style !== 'undefined') {
      return (element as any).style;
    }
    return window.getComputedStyle(element as Element);
  }

  // Skip links
  createSkipLinks(): void {
    if (!this.settings().skipLinks) return;

    const skipLinksContainer = document.createElement('div');
    skipLinksContainer.className = 'skip-links';
    skipLinksContainer.setAttribute('role', 'navigation');
    skipLinksContainer.setAttribute('aria-label', 'Skip navigation links');

    const skipLinks = [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#navigation', text: 'Skip to navigation' },
      { href: '#search', text: 'Skip to search' },
    ];

    skipLinks.forEach((link) => {
      const anchor = document.createElement('a');
      anchor.href = link.href;
      anchor.textContent = link.text;
      anchor.className = 'skip-link';
      skipLinksContainer.appendChild(anchor);
    });

    // Insert at the beginning of body
    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
  }

  // Accessibility checking
  async checkAccessibility(): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];

    // Check color contrast
    violations.push(...(await this.checkColorContrast()));

    // Check keyboard accessibility
    violations.push(...this.checkKeyboardAccessibility());

    // Check ARIA attributes
    violations.push(...this.checkARIAAttributes());

    // Check focus management
    violations.push(...this.checkFocusManagement());

    // Check semantic HTML
    violations.push(...this.checkSemanticHTML());

    this.violations.set(violations);

    this.loggerService.info(
      'Accessibility check completed',
      {
        violationsFound: violations.length,
        violations: violations.map((v) => ({ type: v.type, severity: v.severity })),
      },
      'accessibility',
    );

    return violations;
  }

  private async checkColorContrast(): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];
    const elements = this.normalizeNodeList(document.querySelectorAll('*'));

    for (const element of elements) {
      const styles = this.getStyles(element as any);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const ratio = this.calculateContrastRatio(color, backgroundColor);

        if (ratio < 4.5) {
          violations.push({
            type: 'contrast',
            severity: 'error',
            element: element as HTMLElement,
            message: `Low contrast ratio: ${ratio.toFixed(2)}:1`,
            suggestion:
              'Increase contrast between text and background to meet WCAG AA standards (4.5:1)',
            wcagCriterion: '1.4.3 Contrast (Minimum)',
          });
        }
      }
    }

    return violations;
  }

  private calculateContrastRatio(color1: string, color2: string): number {
    // Simplified contrast ratio calculation
    // In a real implementation, this would use proper color parsing
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);

    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  private parseColor(color: string): { r: number; g: number; b: number } {
    // Simplified color parsing
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
      };
    }

    // Default to black for invalid colors
    return { r: 0, g: 0, b: 0 };
  }

  private getLuminance(rgb: { r: number; g: number; b: number }): number {
    const { r, g, b } = rgb;

    // Convert to 0-1 range
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    // Apply gamma correction
    const rCorrected = rNorm <= 0.03928 ? rNorm / 12.92 : Math.pow((rNorm + 0.055) / 1.055, 2.4);
    const gCorrected = gNorm <= 0.03928 ? gNorm / 12.92 : Math.pow((gNorm + 0.055) / 1.055, 2.4);
    const bCorrected = bNorm <= 0.03928 ? bNorm / 12.92 : Math.pow((bNorm + 0.055) / 1.055, 2.4);

    return 0.2126 * rCorrected + 0.7152 * gCorrected + 0.0722 * bCorrected;
  }

  private checkKeyboardAccessibility(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // Check for elements that should be keyboard accessible
    const clickableElements = this.normalizeNodeList(
      document.querySelectorAll('button, a, input, select, textarea, [onclick]'),
    );

    clickableElements.forEach((element) => {
      const htmlElement = element as HTMLElement;

      if (htmlElement.tabIndex < 0 && !htmlElement.getAttribute('aria-hidden')) {
        violations.push({
          type: 'keyboard',
          severity: 'error',
          element: htmlElement,
          message: 'Element is not keyboard accessible',
          suggestion: 'Add tabindex="0" or ensure element is naturally focusable',
          wcagCriterion: '2.1.1 Keyboard',
        });
      }
    });

    return violations;
  }

  private checkARIAAttributes(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // Check for missing ARIA labels on interactive elements
    const interactiveElements = this.normalizeNodeList(
      document.querySelectorAll('button, a[href], input, select, textarea'),
    );

    interactiveElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const hasLabel =
        htmlElement.getAttribute('aria-label') ||
        htmlElement.getAttribute('aria-labelledby') ||
        htmlElement.getAttribute('title') ||
        htmlElement.textContent?.trim();
      const isSubmitInput =
        htmlElement.tagName === 'INPUT' && htmlElement.getAttribute('type') === 'submit';

      if (!hasLabel && !isSubmitInput) {
        violations.push({
          type: 'aria',
          severity: 'warning',
          element: htmlElement,
          message: 'Interactive element missing accessible label',
          suggestion: 'Add aria-label, aria-labelledby, or visible text content',
          wcagCriterion: '1.3.1 Info and Relationships',
        });
      }
    });

    return violations;
  }

  private checkFocusManagement(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // Check for focus management in modals and dialogs
    const modals = this.normalizeNodeList(document.querySelectorAll('[role="dialog"], .modal'));

    modals.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const focusableElements = this.normalizeNodeList(
        htmlElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusableElements.length === 0) {
        violations.push({
          type: 'focus',
          severity: 'error',
          element: htmlElement,
          message: 'Modal has no focusable elements',
          suggestion: 'Ensure modal has at least one focusable element for focus management',
          wcagCriterion: '2.1.2 No Keyboard Trap',
        });
      }
    });

    return violations;
  }

  private checkSemanticHTML(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];

    // Check for proper heading structure
    const headings = this.normalizeNodeList(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.substring(1));

      if (level > lastLevel + 1) {
        violations.push({
          type: 'semantic',
          severity: 'warning',
          element: heading as HTMLElement,
          message: `Heading level skipped (h${lastLevel} to h${level})`,
          suggestion: 'Use proper heading hierarchy without skipping levels',
          wcagCriterion: '1.3.1 Info and Relationships',
        });
      }

      lastLevel = level;
    });

    return violations;
  }

  // Color blindness support
  generateColorBlindPalette(): Record<string, string> {
    return {
      primary: '#0066cc',
      secondary: '#00cc66',
      success: '#008844',
      warning: '#cc8800',
      error: '#cc0044',
      info: '#0066cc',
      'text-primary': '#000000',
      'text-secondary': '#333333',
      'background-primary': '#ffffff',
      'background-secondary': '#f5f5f5',
    };
  }

  // Getters
  getSettings(): AccessibilitySettings {
    return this.settings();
  }

  getNavigationMode(): NavigationMode {
    return this.navigationMode();
  }

  getViolations(): AccessibilityViolation[] {
    return this.violations();
  }

  getViolationCount(severity?: 'error' | 'warning' | 'info'): number {
    const violations = this.getViolations();
    if (!severity) return violations.length;
    return violations.filter((v) => v.severity === severity).length;
  }

  // Health check
  checkHealth(): { healthy: boolean; checks: Record<string, boolean> } {
    const violations = this.getViolations();
    const errorCount = violations.filter((v) => v.severity === 'error').length;

    const checks = {
      settings_loaded: !!this.settings(),
      violations_checked: violations.length >= 0,
      no_critical_errors: errorCount === 0,
      live_regions_created: !!document.querySelector('.live-region-polite'),
      focus_management_enabled: this.settings().focusTrap,
    };

    return {
      healthy: Object.values(checks).every((check) => check) && errorCount === 0,
      checks,
    };
  }
}
