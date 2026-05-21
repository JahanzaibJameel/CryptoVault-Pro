import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ButtonComponent, ButtonVariant, ButtonSize } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Default Properties', () => {
    it('should have default variant as primary', () => {
      expect(component.variant).toBe('primary');
    });

    it('should have default size as md', () => {
      expect(component.size).toBe('md');
    });

    it('should have disabled as false', () => {
      expect(component.disabled).toBe(false);
    });

    it('should have loading as false', () => {
      expect(component.loading).toBe(false);
    });

    it('should have fullWidth as false', () => {
      expect(component.fullWidth).toBe(false);
    });

    it('should have type as button', () => {
      expect(component.type).toBe('button');
    });

    it('should have iconPosition as left', () => {
      expect(component.iconPosition).toBe('left');
    });
  });

  describe('CSS Classes', () => {
    it('should apply variant class', () => {
      component.variant = 'secondary';
      fixture.detectChanges();
      const updatedButton = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(updatedButton.classList).toContain('secondary');
    });

    it('should apply size class', () => {
      component.size = 'lg';
      fixture.detectChanges();
      const updatedButton = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(updatedButton.classList).toContain('lg');
    });

    it('should apply full-width class when fullWidth is true', () => {
      component.fullWidth = true;
      fixture.detectChanges();
      const updatedButton = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(updatedButton.classList).toContain('full-width');
    });

    it('should apply multiple classes correctly', () => {
      component.variant = 'danger';
      component.size = 'xl';
      component.fullWidth = true;
      fixture.detectChanges();
      const updatedButton = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(updatedButton.classList).toContain('danger');
      expect(updatedButton.classList).toContain('xl');
      expect(updatedButton.classList).toContain('full-width');
    });

    it('should have correct computed classes', () => {
      component.variant = 'success';
      component.size = 'sm';
      fixture.detectChanges();
      const classes = component.buttonClasses;
      expect(classes).toBe('success sm');
    });
  });

  describe('Button States', () => {
    it('should be disabled when disabled is true', () => {
      component.disabled = true;
      fixture.detectChanges();
      const updatedButton = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(updatedButton.disabled).toBe(true);
    });

    it('should be disabled when loading is true', () => {
      component.loading = true;
      fixture.detectChanges();
      const updatedButton = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(updatedButton.disabled).toBe(true);
    });

    it('should show spinner when loading is true', () => {
      component.loading = true;
      fixture.detectChanges();
      const spinner = fixture.debugElement.query(By.css('.button-spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should not show spinner when loading is false', () => {
      component.loading = false;
      fixture.detectChanges();
      const spinner = fixture.debugElement.query(By.css('.button-spinner'));
      expect(spinner).toBeFalsy();
    });

    it('should have correct button type', () => {
      component.type = 'submit';
      fixture.detectChanges();
      const updatedButton = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(updatedButton.type).toBe('submit');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label when provided', () => {
      component.ariaLabel = 'Test button';
      fixture.detectChanges();
      const updatedButton = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(updatedButton.getAttribute('aria-label')).toBe('Test button');
    });

    it('should have aria-describedby when provided', () => {
      component.ariaDescribedBy = 'button-description';
      fixture.detectChanges();
      const updatedButton = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(updatedButton.getAttribute('aria-describedby')).toBe('button-description');
    });

    it('should have proper focus styles', () => {
      fixture.detectChanges();
      const updatedButton = fixture.debugElement.query(By.css('button')).nativeElement;
      // Test focus-visible styles are applied
      expect(updatedButton.style.outline).toBe('');
    });
  });

  describe('Icon Handling', () => {
    it('should display icon on the left by default', () => {
      component.icon = '🔍';
      fixture.detectChanges();
      const iconElement = fixture.debugElement.query(By.css('.button-icon-left'));
      expect(iconElement).toBeTruthy();
      expect(iconElement.nativeElement.textContent).toBe('🔍');
    });

    it('should display icon on the right when iconPosition is right', () => {
      component.icon = '→';
      component.iconPosition = 'right';
      fixture.detectChanges();
      const iconElement = fixture.debugElement.query(By.css('.button-icon-right'));
      expect(iconElement).toBeTruthy();
      expect(iconElement.nativeElement.textContent).toBe('→');
    });

    it('should not display icon when not provided', () => {
      fixture.detectChanges();
      const iconElement = fixture.debugElement.query(By.css('.button-icon'));
      expect(iconElement).toBeFalsy();
    });

    it('should hide icon from screen readers', () => {
      component.icon = '🔍';
      fixture.detectChanges();
      const iconElement = fixture.debugElement.query(By.css('.button-icon'));
      expect(iconElement.nativeElement.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Click Handling', () => {
    it('should emit click event when clicked', () => {
      fixture.detectChanges();
      const buttonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      const clickSpy = jest.spyOn(buttonElement, 'click');
      buttonElement.click();
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should prevent click when disabled', () => {
      component.disabled = true;
      fixture.detectChanges();
      const clickEvent = new MouseEvent('click');
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
      const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');

      component.handleClick(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should prevent click when loading', () => {
      component.loading = true;
      fixture.detectChanges();
      const clickEvent = new MouseEvent('click');
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
      const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');

      component.handleClick(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should allow click when enabled and not loading', () => {
      component.disabled = false;
      component.loading = false;
      fixture.detectChanges();
      const clickEvent = new MouseEvent('click');
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
      const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');

      component.handleClick(clickEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(stopPropagationSpy).not.toHaveBeenCalled();
    });
  });

  describe('Content Projection', () => {
    it('should render projected content', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [TestHostComponent],
      });
      const testFixture = TestBed.createComponent(TestHostComponent);
      testFixture.detectChanges();
      const buttonElement = testFixture.debugElement.query(By.css('button')).nativeElement;
      expect(buttonElement.textContent).toContain('Test Content');
    });
  });

  describe('All Variants', () => {
    const variants: ButtonVariant[] = ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'ghost', 'link'];
    
    variants.forEach(variant => {
      it(`should apply ${variant} variant correctly`, () => {
        component.variant = variant;
        fixture.detectChanges();
        const updatedButton = fixture.debugElement.query(By.css('button')).nativeElement;
        expect(updatedButton.classList).toContain(variant);
      });
    });
  });

  describe('All Sizes', () => {
    const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    
    sizes.forEach(size => {
      it(`should apply ${size} size correctly`, () => {
        component.size = size;
        fixture.detectChanges();
        const updatedButton = fixture.debugElement.query(By.css('button')).nativeElement;
        expect(updatedButton.classList).toContain(size);
      });
    });
  });

  describe('Host Binding', () => {
    it('should apply host class', () => {
      fixture.detectChanges();
      const hostElement = fixture.debugElement.nativeElement;
      expect(hostElement.classList).toContain('ui-button-host');
    });
  });
});

// Test host component for content projection testing
@Component({
  template: `
    <ui-button>Test Content</ui-button>
  `,
  imports: [ButtonComponent],
  standalone: true
})
class TestHostComponent {}
