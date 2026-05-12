# ADR-001: Adopt Angular Standalone Components

## Status
Accepted

## Context
Decision to adopt Angular standalone components as the primary architectural pattern for the CryptoVault Pro application, moving away from the traditional NgModule-based approach.

## Problem
The traditional NgModule-based architecture in Angular introduces several challenges:
- Increased bundle size due to module dependencies
- Complex dependency injection trees
- Slower compilation times
- More boilerplate code for component registration
- Difficulty in tree-shaking unused code
- Complex testing setup with TestBed and module imports

## Decision
Adopt Angular standalone components as the default pattern for all new components and gradually migrate existing components to standalone.

## Consequences
### Positive
- **Reduced Bundle Size**: Eliminates NgModule overhead, enabling better tree-shaking
- **Improved Performance**: Faster compilation and smaller initial bundles
- **Simplified Testing**: Easier unit testing without TestBed module setup
- **Better Developer Experience**: Cleaner component definitions and imports
- **Future-Proof**: Aligns with Angular's recommended architecture
- **Lazy Loading**: Native support for deferrable views

### Negative
- **Migration Effort**: Requires updating existing components
- **Learning Curve**: Team needs to learn standalone patterns
- **Tooling Updates**: Some build tools may need updates

## Implementation
1. **New Components**: All new components must be standalone
2. **Migration Strategy**: Gradually migrate existing components based on priority
3. **Import Strategy**: Use direct imports instead of NgModule declarations
4. **Testing Strategy**: Leverage standalone testing utilities
5. **Documentation**: Update component creation guidelines

## Migration Plan
### Phase 1: Core Components (Week 1-2)
- [ ] ButtonComponent ✅
- [ ] InputComponent
- [ ] ModalComponent
- [ ] LoadingComponent

### Phase 2: Feature Components (Week 3-4)
- [ ] DashboardComponent
- [ ] PortfolioComponent
- [ ] MarketDataComponent
- [ ] WatchlistComponent

### Phase 3: Layout Components (Week 5-6)
- [ ] HeaderComponent
- [ ] SidebarComponent
- [ ] FooterComponent

## Guidelines
### Component Definition
```typescript
@Component({
  selector: 'app-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...],
  template: './component.html',
  styleUrl: './component.scss'
})
export class Component {
  // Component logic
}
```

### Import Strategy
```typescript
// Instead of importing via NgModule
import { Component } from './component.component';

// Direct import in parent component
@Component({
  imports: [Component]
})
export class ParentComponent {}
```

### Testing Strategy
```typescript
// Standalone component testing
describe('Component', () => {
  it('should create component', () => {
    TestBed.configureTestingModule({
      imports: [Component]
    });
    
    const fixture = TestBed.createComponent(Component);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

## Rationale
The standalone approach aligns with Angular's direction and provides significant benefits for our enterprise-grade application:
- **Performance**: Critical for cryptocurrency portfolio management
- **Bundle Size**: Important for mobile users and fast loading
- **Maintainability**: Cleaner code structure
- **Scalability**: Better support for large codebases

## References
- [Angular Standalone Components Documentation](https://angular.dev/guide/standalone-components)
- [Angular Performance Best Practices](https://angular.dev/guide/performance)
- [Bundle Optimization Guide](https://web.dev/bundle-optimization)

---
**Decision Date**: 2024-01-15
**Decision Made By**: Development Team
**Status**: Accepted
