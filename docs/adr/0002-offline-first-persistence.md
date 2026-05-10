# ADR 0002: Offline-First Persistence Strategy

## Status
Accepted

## Context
CryptoVault Pro needs to provide a fully functional experience when users are offline or have poor connectivity. Users should be able to:
- View their portfolio and holdings
- Add/edit transactions
- Manage watchlist
- Access historical data
- Use the app without network dependency

## Decision
Implement an offline-first persistence strategy using IndexedDB for structured data and localStorage for settings, with optimistic UI updates and background synchronization.

## Consequences

### Positive
- **Full Offline Functionality**: Users can perform all core actions without internet
- **Instant UI Updates**: Optimistic updates provide immediate feedback
- **Data Integrity**: Local storage prevents data loss during network issues
- **Progressive Enhancement**: Online features enhance rather than replace offline functionality
- **Background Sync**: Automatic synchronization when connectivity returns
- **Large Storage Capacity**: IndexedDB supports gigabytes of data
- **Cross-Session Persistence**: Data survives browser restarts

### Negative
- **Storage Limitations**: Browser storage limits vary by device and browser
- **Sync Complexity**: Need to handle conflict resolution for concurrent edits
- **Data Migration**: Schema changes require careful migration strategies
- **Memory Usage**: Large datasets in memory can impact performance
- **Testing Complexity**: Need to test various offline/online scenarios

### Neutral
- **Implementation Complexity**: Requires careful state management and error handling
- **User Experience**: Similar to native mobile apps with offline capabilities
- **Development Overhead**: Additional code for sync and conflict resolution

## Implementation Details

### Storage Architecture
```
IndexedDB (crypto-vault-db)
├── transactions (user transactions)
├── watchlist (user watchlist)
├── priceHistory (historical price data)
└── settings (app preferences)

localStorage
├── theme (light/dark preference)
├── cache settings
└── debug flags
```

### Data Flow
1. **User Action** → Update local state immediately
2. **Persist** → Save to IndexedDB/localStorage
3. **UI Update** → Show optimistic update
4. **Sync Queue** → Add to background sync queue
5. **Network Check** → Attempt sync when online
6. **Conflict Resolution** → Handle server conflicts if needed

### Store Integration
```typescript
export class PortfolioStore {
  async addTransaction(tx: Transaction) {
    // 1. Update local state immediately
    this.state.update(s => this.computeNewState(s, tx));
    
    // 2. Persist locally
    await this.indexedDb.saveTransaction(tx);
    
    // 3. Queue for sync
    this.syncQueue.add(tx);
    
    // 4. Attempt background sync
    await this.attemptSync();
  }
}
```

### Sync Strategy
- **Immediate Sync**: Try to sync immediately if online
- **Retry Logic**: Exponential backoff for failed syncs
- **Conflict Resolution**: Last-write-wins with user notification
- **Batch Processing**: Group multiple updates for efficiency

## Offline Detection

### Network Monitoring
```typescript
export class OfflineService {
  private isOnline = signal(navigator.onLine);
  
  private setupListeners() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }
}
```

### Fallback Strategies
1. **Cache Fallback**: Serve stale data when network unavailable
2. **Queue Actions**: Store user actions for later sync
3. **Graceful Degradation**: Disable non-essential features
4. **User Notification**: Inform users about offline status

## Data Migration Strategy

### Schema Versioning
```typescript
interface CryptoVaultDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    version: 1;
  };
}
```

### Migration Process
1. **Check Version**: Compare current vs expected schema
2. **Backup Data**: Export existing data
3. **Transform Schema**: Apply migration logic
4. **Restore Data**: Import transformed data
5. **Update Version**: Set new schema version

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Load data on-demand
- **Pagination**: Large datasets in chunks
- **Indexing**: Efficient IndexedDB indexes
- **Compression**: Compress large text data
- **Cleanup**: Remove old/unnecessary data

### Storage Management
```typescript
export class StorageManager {
  async checkQuota(): Promise<StorageQuota> {
    const usage = await navigator.storage.estimate();
    return {
      used: usage.usage,
      available: usage.quota - usage.usage,
      percentage: (usage.usage / usage.quota) * 100
    };
  }
}
```

## Testing Strategy

### Offline Scenarios
1. **Initial Load**: App starts offline
2. **Network Loss**: Connection drops during use
3. **Slow Connection**: Poor network performance
4. **Recovery**: Connection restoration
5. **Storage Limits**: Browser storage quota exceeded

### Test Cases
```typescript
describe('Offline Persistence', () => {
  it('should work completely offline', async () => {
    // Simulate offline mode
    await simulateOffline();
    
    // Add transaction
    await store.addTransaction(mockTransaction);
    
    // Verify local state
    expect(store.transactions()).toContain(mockTransaction);
    
    // Verify persistence
    const persisted = await indexedDb.getTransaction(mockTransaction.id);
    expect(persisted).toEqual(mockTransaction);
  });
});
```

## Security Considerations

### Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **Access Control**: Browser storage isolation
- **Data Sanitization**: Validate all data before storage
- **Backup Strategy**: Export/import functionality

### Privacy
- **Local Only**: No data sent to third parties
- **User Control**: Clear data option
- **Transparent Usage**: Clear data usage policies

## Monitoring and Analytics

### Offline Metrics
```typescript
export class OfflineAnalytics {
  trackOfflineSession(duration: number, actions: number) {
    // Track offline usage patterns
  }
  
  trackSyncFailure(reason: string, retryCount: number) {
    // Monitor sync reliability
  }
}
```

## Related Decisions

- [ADR 0001]: Signals - Work well with async persistence operations
- [ADR 0003]: API Resilience - Complements offline-first approach

## Future Enhancements

### Advanced Features
- **Background Sync**: Service Worker for background synchronization
- **Conflict Resolution UI**: User interface for resolving conflicts
- **Predictive Caching**: Cache likely-to-be-accessed data
- **Offline Indicators**: Visual indicators for cached vs live data

### Cross-Device Sync
- **Account System**: Optional user accounts for sync across devices
- **Cloud Backup**: Encrypted cloud storage option
- **Conflict Resolution**: Advanced merge strategies

## References

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Progressive Web Apps](https://web.dev/progressive-web-apps/)
- [Offline First Architecture](https://web.dev/offline-first/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
