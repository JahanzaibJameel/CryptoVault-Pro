# ADR 0001: Use Angular Signals instead of NgRx

## Status
Accepted

## Context
We need to choose a state management solution for CryptoVault Pro that supports:
- Reactive state management
- Performance optimization with OnPush change detection
- TypeScript-first development
- Minimal bundle size impact
- Easy testing and debugging
- Framework-agnostic domain logic

## Decision
Use Angular Signals (`signal`, `computed`) with custom store classes instead of NgRx.

## Consequences

### Positive
- **Smaller Bundle Size**: Signals are built into Angular 17+, no additional library needed (~30KB savings vs NgRx)
- **Better TypeScript Support**: Signals provide excellent type inference without complex typing
- **Simpler Learning Curve**: No need to learn RxJS operators, selectors, and effects patterns
- **Framework Integration**: Native Angular integration with optimal change detection
- **Easier Testing**: Plain TypeScript classes are easier to unit test than NgRx reducers/effects
- **Domain Isolation**: Domain layer remains completely framework-agnostic
- **Performance**: Signals are optimized for Angular's change detection mechanism

### Negative
- **Less Ecosystem**: Fewer devtools and community patterns compared to mature NgRx ecosystem
- **Manual Implementation**: Need to build our own store patterns and debugging tools
- **Limited Time Travel**: No built-in time-travel debugging (can be added manually if needed)
- **Team Knowledge**: Most Angular developers are more familiar with NgRx patterns

### Neutral
- **Reactive Paradigm**: Both solutions are reactive and handle async operations well
- **Scalability**: Both can scale to large applications with proper architecture
- **Developer Experience**: Both provide good DX for different reasons

## Implementation Details

### Store Pattern
```typescript
export class PortfolioStore {
  private state = signal<PortfolioState>({...});

  // Selectors
  holdings = computed(() => this.state().holdings);
  currentValue = computed(() => this.state().currentValue);

  // Commands
  async addTransaction(tx: Transaction) {
    this.state.update(s => this.computeNewState(s, tx));
    await this.persist();
  }
}
```

### Component Usage
```typescript
@Component({...})
export class PortfolioComponent {
  private store = inject(PortfolioStore);
  
  holdings = this.store.holdings; // Computed signal
  currentValue = this.store.currentValue;
}
```

## Alternatives Considered

### NgRx
- **Pros**: Mature ecosystem, great devtools, time-travel debugging, extensive community
- **Cons**: Larger bundle size, steeper learning curve, more boilerplate

### Simple Services with Subjects
- **Pros**: Minimal setup, familiar pattern
- **Cons**: Manual subscription management, potential memory leaks, less optimized

### Akita
- **Pros**: Good balance of simplicity and features
- **Cons**: Additional dependency, less Angular-specific optimization

## Rationale

### Performance Requirements
CryptoVault Pro targets Lighthouse scores ≥ 95 and bundle size < 150KB. Signals directly integrate with Angular's change detection, providing optimal performance without the overhead of additional state management libraries.

### Domain-Driven Design
The blueprint explicitly requires a framework-agnostic domain layer. Signals allow us to keep domain logic completely pure while providing reactive state management at the application layer.

### Simplicity and Maintainability
For a portfolio tracker, we need straightforward state operations (add transaction, update prices, calculate metrics). Signals provide the right level of abstraction without over-engineering.

### Future Compatibility
Signals are the future direction of Angular reactivity. Adopting them now positions us well for future Angular versions and ecosystem development.

## Migration Strategy

If NgRx becomes necessary in the future:
1. Keep store interfaces the same
2. Replace signal-based implementation with NgRx stores
3. Update component injections (minimal changes)
4. Add NgRx devtools integration

## Related Decisions

- [ADR 0002]: Offline-first persistence - Signals work well with async persistence operations
- [ADR 0003]: API resilience - Signal stores can easily integrate with resilient API patterns

## References

- [Angular Signals Documentation](https://angular.dev/guide/signals)
- [NgRx Documentation](https://ngrx.io/)
- [Angular Performance Best Practices](https://angular.dev/guide/performance)
