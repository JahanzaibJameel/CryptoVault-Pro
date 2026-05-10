# CryptoVault Pro Architecture Diagram

```mermaid
graph TB
    subgraph "Presentation Layer"
        UI[Angular Components]
        UI --> |"injects stores"| APP
    end
    
    subgraph "Application Layer"
        APP[Feature Stores]
        PS[PortfolioStore]
        MS[MarketDataStore]
        WS[WatchlistStore]
        SS[SettingsStore]
        APP --> PS
        APP --> MS
        APP --> WS
        APP --> SS
    end
    
    subgraph "Domain Layer"
        DM[Domain Models]
        VO[Value Objects]
        PF[Pure Functions]
        APP --> |"uses"| DM
        APP --> |"uses"| VO
        APP --> |"uses"| PF
    end
    
    subgraph "Infrastructure Layer"
        API[API Services]
        DB[Persistence]
        RES[Resilience Layer]
        APP --> |"commands"| API
        APP --> |"commands"| DB
        API --> RES
    end
    
    subgraph "External"
        CG[CoinGecko API]
        IDB[IndexedDB]
        LS[LocalStorage]
        API --> CG
        DB --> IDB
        DB --> LS
    end
    
    style PS fill:#e1f5fe
    style MS fill:#e1f5fe
    style WS fill:#e1f5fe
    style SS fill:#e1f5fe
    style DM fill:#f3e5f5
    style VO fill:#f3e5f5
    style PF fill:#f3e5f5
    style API fill:#e8f5e8
    style DB fill:#e8f5e8
    style RES fill:#fff3e0
```

## Layer Responsibilities

### Presentation Layer
- Angular standalone components
- Lazy-loaded routes
- OnPush change detection
- UI state management

### Application Layer  
- Signal-based feature stores
- Business logic orchestration
- State management commands
- Computed selectors

### Domain Layer
- Pure TypeScript models
- Value objects with validation
- Business calculation functions
- Framework-agnostic logic

### Infrastructure Layer
- External API integration
- Data persistence
- Error handling & resilience
- Browser API abstractions
