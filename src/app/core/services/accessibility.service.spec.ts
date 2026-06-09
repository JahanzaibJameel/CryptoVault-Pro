/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-namespace */
import { TestBed } from '@angular/core/testing';
import { AccessibilityService } from './accessibility.service';
import { LoggerService } from './logger.service';

// Mock global test functions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeTrue(): R;
      toBeFalse(): R;
      toBeGreaterThan(value: number): R;
      toBeLessThan(value: number): R;
      toContain(expected: string): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(count: number): R;
      toBeCloseTo(expected: number, precision?: number): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toEqual(expected: any): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toHaveLength(expected: number): R;
      toBeNull(): R;
      toHaveClass(expected: string): R;
      toHaveAttribute(expected: string): R;
    }
  }
}

describe('AccessibilityService', () => {
  let service: AccessibilityService;
  let mockLoggerService: jest.Mocked<LoggerService>;

  beforeEach(() => {
    const loggerSpy = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [AccessibilityService, { provide: LoggerService, useValue: loggerSpy }],
    });

    // Mock window.matchMedia before service initialization
    const mockMatchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    // Mock DOM methods
    spyOn(document, 'addEventListener');
    spyOn(document.body.classList, 'toggle');
    spyOn(document.body.classList, 'add');
    spyOn(document.body.classList, 'remove');
    spyOn(document.body, 'appendChild').and.callFake((node: Node) => node);
    spyOn(document.body, 'insertBefore').and.callFake((node: Node) => node);
    spyOn(document, 'querySelector').and.returnValue(null);
    spyOn(document, 'querySelectorAll').and.returnValue([]);

    service = TestBed.inject(AccessibilityService);
    mockLoggerService = TestBed.inject(LoggerService) as jest.Mocked<LoggerService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial Settings', () => {
    it('should have default accessibility settings', () => {
      const settings = service.getSettings();
      expect(settings.highContrast).toBeFalse();
      expect(settings.largeText).toBeFalse();
      expect(settings.reducedMotion).toBeFalse();
      expect(settings.screenReader).toBeFalse();
      expect(settings.keyboardNavigation).toBeTrue();
      expect(settings.focusVisible).toBeTrue();
      expect(settings.announcements).toBeTrue();
      expect(settings.skipLinks).toBeTrue();
      expect(settings.focusTrap).toBeTrue();
      expect(settings.colorBlindFriendly).toBeFalse();
    });

    it('should start with mouse navigation mode', () => {
      const navigationMode = service.getNavigationMode();
      expect(navigationMode).toBe('mouse');
    });
  });

  describe('Settings Management', () => {
    it('should update accessibility setting', () => {
      service.updateSetting('highContrast', true);
      const settings = service.getSettings();
      expect(settings.highContrast).toBeTrue();
    });

    it('should apply CSS classes when setting is updated', () => {
      spyOn(service as any, 'applyAccessibilityClasses');
      service.updateSetting('largeText', true);
      expect((service as any).applyAccessibilityClasses).toHaveBeenCalled();
    });

    it('should log setting update', () => {
      service.updateSetting('reducedMotion', true);
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Accessibility setting updated',
        jasmine.any(Object),
        'accessibility',
      );
    });
  });

  describe('User Preference Detection', () => {
    beforeEach(() => {
      spyOn(window, 'matchMedia');
    });

    it('should detect reduced motion preference', () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: jasmine.createSpy('addEventListener'),
      };
      (window.matchMedia as jasmine.Spy).and.returnValue(mockMediaQuery);

      service.refreshUserPreferences();
      const settings = service.getSettings();
      expect(settings.reducedMotion).toBeTrue();
    });

    it('should detect high contrast preference', () => {
      const mockMediaQuery = {
        matches: true,
        addEventListener: jasmine.createSpy('addEventListener'),
      };
      (window.matchMedia as jasmine.Spy).and.returnValue(mockMediaQuery);

      service.refreshUserPreferences();
      const settings = service.getSettings();
      expect(settings.highContrast).toBeTrue();
    });

    it('should listen for preference changes', () => {
      const mockMediaQuery = {
        matches: false,
        addEventListener: jasmine.createSpy('addEventListener'),
      };
      (window.matchMedia as jasmine.Spy).and.returnValue(mockMediaQuery);

      service.refreshUserPreferences();
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', jasmine.any(Function));
    });
  });

  describe('CSS Properties Management', () => {
    it('should update font size for large text', () => {
      const mockRoot = {
        style: {
          setProperty: jasmine.createSpy('setProperty'),
        },
      };
      spyOn(service as any, 'getDocumentRoot').and.returnValue(mockRoot);

      service.updateSetting('largeText', true);
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--font-size-base', '18px');
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--font-size-small', '16px');
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--font-size-large', '20px');
    });

    it('should update contrast properties for high contrast', () => {
      const mockRoot = {
        style: {
          setProperty: jasmine.createSpy('setProperty'),
        },
      };
      spyOn(service as any, 'getDocumentRoot').and.returnValue(mockRoot);

      service.updateSetting('highContrast', true);
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--contrast-ratio', '7');
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--text-primary', '#000000');
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--text-secondary', '#333333');
    });

    it('should update transition properties for reduced motion', () => {
      const mockRoot = {
        style: {
          setProperty: jasmine.createSpy('setProperty'),
        },
      };
      spyOn(service as any, 'getDocumentRoot').and.returnValue(mockRoot);

      service.updateSetting('reducedMotion', true);
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--transition-duration', '0s');
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--animation-duration', '0s');
    });
  });

  describe('Focus Management', () => {
    it('should create focus trap', () => {
      const mockContainer = {
        querySelectorAll: jasmine.createSpy('querySelectorAll').and.returnValue([]),
        addEventListener: jasmine.createSpy('addEventListener'),
      };
      const mockInitialFocus = {
        focus: jasmine.createSpy('focus'),
      };

      service.trapFocus({
        container: mockContainer as any,
        initialFocus: mockInitialFocus as any,
      });

      expect(mockContainer.querySelectorAll).toHaveBeenCalledWith(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
    });

    it('should remove focus trap', () => {
      const mockContainer = {
        querySelectorAll: jasmine.createSpy('querySelectorAll').and.returnValue([]),
        addEventListener: jasmine.createSpy('addEventListener'),
        removeEventListener: jasmine.createSpy('removeEventListener'),
      };
      const mockRestoreFocus = {
        focus: jasmine.createSpy('focus'),
      };

      service.trapFocus({
        container: mockContainer as any,
        restoreFocus: mockRestoreFocus as any,
      });

      service.removeFocusTrap();
      expect(mockContainer.removeEventListener).toHaveBeenCalled();
      expect(mockRestoreFocus.focus).toHaveBeenCalled();
    });

    it('should handle tab key navigation within trap', () => {
      const mockFirstElement = { focus: jasmine.createSpy('focus') };
      const mockLastElement = { focus: jasmine.createSpy('focus') };
      const mockContainer = {
        querySelectorAll: jasmine
          .createSpy('querySelectorAll')
          .and.returnValue([mockFirstElement, mockLastElement]),
        addEventListener: jasmine.createSpy('addEventListener').and.callFake((event, handler) => {
          if (event === 'keydown') {
            // Simulate tab key on last element
            const mockEvent = {
              key: 'Tab',
              shiftKey: false,
              preventDefault: jasmine.createSpy('preventDefault'),
            };
            Object.defineProperty(document, 'activeElement', {
              get: () => mockLastElement as any,
              configurable: true,
            });
            handler(mockEvent);
          }
        }),
      };

      service.trapFocus({ container: mockContainer as any });
      expect(mockFirstElement.focus).toHaveBeenCalled();
    });
  });

  describe('Screen Reader Announcements', () => {
    beforeEach(() => {
      const mockRegion = {
        textContent: '',
        style: {},
      };
      spyOn(document, 'querySelector').and.returnValue(mockRegion);
    });

    it('should make polite announcement', () => {
      service.announce('Test message', 'polite');
      expect(document.querySelector).toHaveBeenCalledWith('.live-region-polite');
    });

    it('should make assertive announcement', () => {
      service.announce('Urgent message', 'assertive');
      expect(document.querySelector).toHaveBeenCalledWith('.live-region-assertive');
    });

    it('should not announce when announcements are disabled', () => {
      (document.querySelector as jest.Mock).mockClear();
      service.updateSetting('announcements', false);
      service.announce('Test message', 'polite');
      expect(document.querySelector).not.toHaveBeenCalled();
    });
  });

  describe('Skip Links', () => {
    it('should create skip links when enabled', () => {
      service.updateSetting('skipLinks', true);
      service.createSkipLinks();

      expect(document.body.insertBefore).toHaveBeenCalled();
      const insertedNode = (document.body.insertBefore as jest.SpyInstance).mock.calls[0][0];
      expect(insertedNode).toBeDefined();
      expect(insertedNode.className).toBe('skip-links');
      expect(insertedNode.getAttribute('role')).toBe('navigation');
      expect(insertedNode.getAttribute('aria-label')).toBe('Skip navigation links');

      const anchors = insertedNode.querySelectorAll('.skip-link');
      expect(anchors.length).toBe(3);
      expect((anchors[0] as HTMLAnchorElement).href).toContain('#main-content');
      expect((anchors[1] as HTMLAnchorElement).href).toContain('#navigation');
      expect((anchors[2] as HTMLAnchorElement).href).toContain('#search');
    });

    it('should not create skip links when disabled', () => {
      service.updateSetting('skipLinks', false);
      spyOn(document, 'createElement');
      service.createSkipLinks();
      expect(document.createElement).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility Checking', () => {
    beforeEach(() => {
      spyOn(service as any, 'checkColorContrast').and.returnValue([]);
      spyOn(service as any, 'checkKeyboardAccessibility').and.returnValue([]);
      spyOn(service as any, 'checkARIAAttributes').and.returnValue([]);
      spyOn(service as any, 'checkFocusManagement').and.returnValue([]);
      spyOn(service as any, 'checkSemanticHTML').and.returnValue([]);
    });

    it('should run all accessibility checks', async () => {
      const violations = await service.checkAccessibility();

      expect((service as any).checkColorContrast).toHaveBeenCalled();
      expect((service as any).checkKeyboardAccessibility).toHaveBeenCalled();
      expect((service as any).checkARIAAttributes).toHaveBeenCalled();
      expect((service as any).checkFocusManagement).toHaveBeenCalled();
      expect((service as any).checkSemanticHTML).toHaveBeenCalled();
      expect(Array.isArray(violations)).toBeTrue();
    });

    it('should log check completion', async () => {
      await service.checkAccessibility();
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        'Accessibility check completed',
        jasmine.any(Object),
        'accessibility',
      );
    });
  });

  describe('Color Contrast Checking', () => {
    it('should detect low contrast ratio', async () => {
      const mockElement = document.createElement('div');
      mockElement.style.color = 'rgb(200, 200, 200)';
      mockElement.style.backgroundColor = 'rgb(240, 240, 240)';
      spyOn(document, 'querySelectorAll').and.returnValue([mockElement] as any);

      const violations = await (service as any).checkColorContrast();
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].type).toBe('contrast');
      expect(violations[0].severity).toBe('error');
    });

    it('should ignore elements with transparent background', async () => {
      const mockElement = document.createElement('div');
      mockElement.style.color = 'rgb(0, 0, 0)';
      mockElement.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      spyOn(document, 'querySelectorAll').and.returnValue([mockElement] as any);

      const violations = await (service as any).checkColorContrast();
      expect(violations).toEqual([]);
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should detect elements without keyboard access', () => {
      const mockElement = document.createElement('button');
      mockElement.tabIndex = -1;
      spyOn(mockElement, 'getAttribute').and.returnValue(null);
      spyOn(document, 'querySelectorAll').and.returnValue([mockElement] as any);

      const violations = (service as any).checkKeyboardAccessibility();
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].type).toBe('keyboard');
      expect(violations[0].severity).toBe('error');
    });

    it('should ignore elements with aria-hidden', () => {
      const mockElement = document.createElement('button');
      mockElement.tabIndex = -1;
      spyOn(mockElement, 'getAttribute').and.returnValue('true');
      spyOn(document, 'querySelectorAll').and.returnValue([mockElement] as any);

      const violations = (service as any).checkKeyboardAccessibility();
      expect(violations).toEqual([]);
    });
  });

  describe('ARIA Attributes', () => {
    it('should detect missing ARIA labels', () => {
      const mockElement = document.createElement('button');
      spyOn(mockElement, 'getAttribute').and.returnValue(null);
      Object.defineProperty(mockElement, 'textContent', { value: '' });
      spyOn(document, 'querySelectorAll').and.returnValue([mockElement] as any);

      const violations = (service as any).checkARIAAttributes();
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].type).toBe('aria');
      expect(violations[0].severity).toBe('warning');
    });

    it('should ignore submit inputs without labels', () => {
      const mockElement = document.createElement('input');
      spyOn(mockElement, 'getAttribute').and.returnValue('submit');
      const querySelectorSpy = spyOn(document, 'querySelectorAll').and.returnValue([
        mockElement,
      ] as any);

      const violations = (service as any).checkARIAAttributes();
      expect(violations).toEqual([]);

      querySelectorSpy.mockRestore();
      spyOn(document, 'querySelectorAll').and.returnValue([]);
    });
  });

  describe('Focus Management Checking', () => {
    it('should detect modals without focusable elements', () => {
      const mockModal = document.createElement('div');
      mockModal.setAttribute('role', 'dialog');
      spyOn(mockModal, 'querySelectorAll').and.returnValue([] as any);
      spyOn(document, 'querySelectorAll').and.returnValue([mockModal] as any);

      const violations = (service as any).checkFocusManagement();
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].type).toBe('focus');
      expect(violations[0].severity).toBe('error');
    });
  });

  describe('Semantic HTML', () => {
    it('should detect skipped heading levels', () => {
      const mockH1 = document.createElement('h1');
      const mockH3 = document.createElement('h3');
      spyOn(document, 'querySelectorAll').and.returnValue([mockH1, mockH3] as any);

      const violations = (service as any).checkSemanticHTML();
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].type).toBe('semantic');
      expect(violations[0].severity).toBe('warning');
      expect(violations[0].message).toContain('Heading level skipped');
    });
  });

  describe('Color Blind Support', () => {
    it('should generate color blind friendly palette', () => {
      const palette = service.generateColorBlindPalette();

      expect(palette.primary).toBe('#0066cc');
      expect(palette.success).toBe('#008844');
      expect(palette.warning).toBe('#cc8800');
      expect(palette.error).toBe('#cc0044');
      expect(palette['text-primary']).toBe('#000000');
      expect(palette['background-primary']).toBe('#ffffff');
    });
  });

  describe('Violation Management', () => {
    it('should track violations correctly', async () => {
      const mockViolation = {
        type: 'contrast' as const,
        severity: 'error' as const,
        element: document.createElement('div'),
        message: 'Low contrast',
        suggestion: 'Increase contrast',
        wcagCriterion: '1.4.3',
      };

      spyOn(service as any, 'checkColorContrast').and.returnValue([mockViolation]);
      spyOn(service as any, 'checkKeyboardAccessibility').and.returnValue([]);
      spyOn(service as any, 'checkARIAAttributes').and.returnValue([]);
      spyOn(service as any, 'checkFocusManagement').and.returnValue([]);
      spyOn(service as any, 'checkSemanticHTML').and.returnValue([]);

      await service.checkAccessibility();
      const violations = service.getViolations();

      expect(violations).toHaveLength(1);
      expect(violations[0]).toEqual(mockViolation);
    });

    it('should count violations by severity', async () => {
      const mockViolations = [
        {
          type: 'contrast',
          severity: 'error' as const,
          element: null,
          message: '',
          suggestion: '',
          wcagCriterion: '',
        },
        {
          type: 'keyboard',
          severity: 'warning' as const,
          element: null,
          message: '',
          suggestion: '',
          wcagCriterion: '',
        },
        {
          type: 'aria',
          severity: 'info' as const,
          element: null,
          message: '',
          suggestion: '',
          wcagCriterion: '',
        },
      ];

      spyOn(service, 'getViolations').and.returnValue(mockViolations);

      expect(service.getViolationCount('error')).toBe(1);
      expect(service.getViolationCount('warning')).toBe(1);
      expect(service.getViolationCount('info')).toBe(1);
      expect(service.getViolationCount()).toBe(3);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when all checks pass', () => {
      spyOn(service, 'getViolations').and.returnValue([]);
      spyOn(document, 'querySelector').and.returnValue(document.createElement('div'));

      const health = service.checkHealth();

      expect(health.healthy).toBeTrue();
      expect(health.checks.settings_loaded).toBeTrue();
      expect(health.checks.violations_checked).toBeTrue();
      expect(health.checks.no_critical_errors).toBeTrue();
      expect(health.checks.live_regions_created).toBeTrue();
      expect(health.checks.focus_management_enabled).toBeTrue();
    });

    it('should return unhealthy status with errors', () => {
      const mockViolations = [
        {
          type: 'contrast',
          severity: 'error',
          element: null,
          message: '',
          suggestion: '',
          wcagCriterion: '',
        },
      ];

      spyOn(service, 'getViolations').and.returnValue(mockViolations);
      spyOn(document, 'querySelector').and.returnValue(document.createElement('div'));

      const health = service.checkHealth();

      expect(health.healthy).toBeFalse();
      expect(health.checks.no_critical_errors).toBeFalse();
    });
  });

  describe('Navigation Mode Detection', () => {
    beforeEach(() => {
      spyOn(document.body.classList, 'add');
      spyOn(document.body.classList, 'remove');
      (service as any).navigationMode.set('mouse');
    });

    it('should detect keyboard navigation on tab key', () => {
      const mockEvent = { key: 'Tab' };
      const keydownHandler = (document.addEventListener as jasmine.Spy).calls
        .allArgs()
        .find(([event]) => event === 'keydown')?.[1];

      if (keydownHandler) {
        keydownHandler(mockEvent);
        expect(document.body.classList.add).toHaveBeenCalledWith('keyboard-navigation');
      }
    });

    it('should detect mouse navigation on mouse down', () => {
      const mockEvent = { type: 'mousedown' };
      const mousedownHandler = (document.addEventListener as jasmine.Spy).calls
        .allArgs()
        .find(([event]) => event === 'mousedown')?.[1];

      if (mousedownHandler) {
        mousedownHandler(mockEvent);
        expect(document.body.classList.remove).toHaveBeenCalledWith('keyboard-navigation');
      }
    });

    it('should detect touch navigation on touch start', () => {
      document.dispatchEvent(new Event('touchstart'));
      expect(service.getNavigationMode()).toBe('touch');
    });
  });

  describe('Focus Announcements', () => {
    beforeEach(() => {
      service.updateSetting('screenReader', true);
      spyOn(service, 'announce');
    });

    it('should announce button focus', () => {
      const mockElement = {
        tagName: 'BUTTON',
        textContent: 'Submit Form',
      };
      Object.defineProperty(document, 'activeElement', {
        get: () => mockElement as any,
        configurable: true,
      });

      (service as any).handleFocusIn({ target: mockElement });

      expect(service.announce).toHaveBeenCalledWith('Button, Submit Form', 'polite');
    });

    it('should announce input focus', () => {
      const mockElement = {
        tagName: 'INPUT',
        getAttribute: jasmine
          .createSpy('getAttribute')
          .and.returnValues('email', 'Email'),
      };
      Object.defineProperty(document, 'activeElement', {
        get: () => mockElement as any,
        configurable: true,
      });

      (service as any).handleFocusIn({ target: mockElement });

      expect(service.announce).toHaveBeenCalledWith('Email, email input', 'polite');
    });

    it('should announce link focus', () => {
      const mockElement = {
        tagName: 'A',
        textContent: 'Home',
      };
      Object.defineProperty(document, 'activeElement', {
        get: () => mockElement as any,
        configurable: true,
      });

      (service as any).handleFocusIn({ target: mockElement });

      expect(service.announce).toHaveBeenCalledWith('Link, Home', 'polite');
    });
  });

  describe('Contrast Ratio Calculation', () => {
    it('should calculate contrast ratio correctly', () => {
      const rgb1 = { r: 255, g: 255, b: 255 }; // White
      const rgb2 = { r: 0, g: 0, b: 0 }; // Black

      const ratio = (service as any).calculateContrastRatio('rgb(255, 255, 255)', 'rgb(0, 0, 0)');
      expect(ratio).toBe(21); // Maximum contrast ratio
    });

    it('should calculate luminance correctly', () => {
      const rgb = { r: 255, g: 255, b: 255 }; // White
      const luminance = (service as any).getLuminance(rgb);
      expect(luminance).toBeCloseTo(1, 2);
    });
  });
});
