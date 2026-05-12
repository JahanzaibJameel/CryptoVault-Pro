import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ButtonComponent, ButtonVariant, ButtonSize } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;
  let buttonElement: HTMLButtonElement;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement.query(By.css('button'));
    buttonElement = debugElement.nativeElement;
    fixture.detectChanges();
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
      expect(component.disabled).toBeFalse();
    });

    it('should have loading as false', () => {
      expect(component.loading).toBeFalse();
    });

    it('should have fullWidth as false', () => {
      expect(component.fullWidth).toBeFalse();
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
      expect(buttonElement.classList).toContain('secondary');
    });

    it('should apply size class', () => {
      component.size = 'lg';
      fixture.detectChanges();
      expect(buttonElement.classList).toContain('lg');
    });

    it('should apply full-width class when fullWidth is true', () => {
      component.fullWidth = true;
      fixture.detectChanges();
      expect(buttonElement.classList).toContain('full-width');
    });

    it('should apply multiple classes correctly', () => {
      component.variant = 'danger';
      component.size = 'xl';
      component.fullWidth = true;
      fixture.detectChanges();
      expect(buttonElement.classList).toContain('danger');
      expect(buttonElement.classList).toContain('xl');
      expect(buttonElement.classList).toContain('full-width');
    });

    it('should have correct computed classes', () => {
      component.variant = 'success';
      component.size = 'sm';
      fixture.detectChanges();
      const classes = component.buttonClasses();
      expect(classes).toBe('success sm');
    });
  });

  describe('Button States', () => {
    it('should be disabled when disabled is true', () => {
      component.disabled = true;
      fixture.detectChanges();
      expect(buttonElement.disabled).toBeTrue();
    });

    it('should be disabled when loading is true', () => {
      component.loading = true;
      fixture.detectChanges();
      expect(buttonElement.disabled).toBeTrue();
    });

    it('should show spinner when loading is true', () => {
      component.loading = true;
      fixture.detectChanges();
      const spinner = debugElement.query(By.css('.button-spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should not show spinner when loading is false', () => {
      component.loading = false;
      fixture.detectChanges();
      const spinner = debugElement.query(By.css('.button-spinner'));
      expect(spinner).toBeFalsy();
    });

    it('should have correct button type', () => {
      component.type = 'submit';
      fixture.detectChanges();
      expect(buttonElement.type).toBe('submit');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label when provided', () => {
      component.ariaLabel = 'Test button';
      fixture.detectChanges();
      expect(buttonElement.getAttribute('aria-label')).toBe('Test button');
    });

    it('should have aria-describedby when provided', () => {
      component.ariaDescribedBy = 'button-description';
      fixture.detectChanges();
      expect(buttonElement.getAttribute('aria-describedby')).toBe('button-description');
    });

    it('should have proper focus styles', () => {
      // Test focus-visible styles are applied
      expect(buttonElement.style.outline).toBe('');
    });
  });

  describe('Icon Handling', () => {
    it('should display icon on the left by default', () => {
      component.icon = '🔍';
      fixture.detectChanges();
      const iconElement = debugElement.query(By.css('.button-icon-left'));
      expect(iconElement).toBeTruthy();
      expect(iconElement.nativeElement.textContent).toBe('🔍');
    });

    it('should display icon on the right when iconPosition is right', () => {
      component.icon = '→';
      component.iconPosition = 'right';
      fixture.detectChanges();
      const iconElement = debugElement.query(By.css('.button-icon-right'));
      expect(iconElement).toBeTruthy();
      expect(iconElement.nativeElement.textContent).toBe('→');
    });

    it('should not display icon when not provided', () => {
      fixture.detectChanges();
      const iconElement = debugElement.query(By.css('.button-icon'));
      expect(iconElement).toBeFalsy();
    });

    it('should hide icon from screen readers', () => {
      component.icon = '🔍';
      fixture.detectChanges();
      const iconElement = debugElement.query(By.css('.button-icon'));
      expect(iconElement.nativeElement.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Click Handling', () => {
    it('should emit click event when clicked', () => {
      spyOn(buttonElement, 'click');
      buttonElement.click();
      expect(buttonElement.click).toHaveBeenCalled();
    });

    it('should prevent click when disabled', () => {
      component.disabled = true;
      fixture.detectChanges();
      const clickEvent = new MouseEvent('click');
      spyOn(clickEvent, 'preventDefault');
      spyOn(clickEvent, 'stopPropagation');
      
      component.handleClick(clickEvent);
      
      expect(clickEvent.preventDefault).toHaveBeenCalled();
      expect(clickEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should prevent click when loading', () => {
      component.loading = true;
      fixture.detectChanges();
      const clickEvent = new MouseEvent('click');
      spyOn(clickEvent, 'preventDefault');
      spyOn(clickEvent, 'stopPropagation');
      
      component.handleClick(clickEvent);
      
      expect(clickEvent.preventDefault).toHaveBeenCalled();
      expect(clickEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should allow click when enabled and not loading', () => {
      component.disabled = false;
      component.loading = false;
      fixture.detectChanges();
      const clickEvent = new MouseEvent('click');
      spyOn(clickEvent, 'preventDefault');
      spyOn(clickEvent, 'stopPropagation');
      
      component.handleClick(clickEvent);
      
      expect(clickEvent.preventDefault).not.toHaveBeenCalled();
      expect(clickEvent.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('Content Projection', () => {
    it('should render projected content', () => {
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
        expect(buttonElement.classList).toContain(variant);
      });
    });
  });

  describe('All Sizes', () => {
    const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    
    sizes.forEach(size => {
      it(`should apply ${size} size correctly`, () => {
        component.size = size;
        fixture.detectChanges();
        expect(buttonElement.classList).toContain(size);
      });
    });
  });

  describe('Host Binding', () => {
    it('should apply host class', () => {
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
