import { Injectable, signal } from '@angular/core';

export interface AppSettings {
  currency: string;
  locale: string;
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'usd',
  locale: 'en',
  theme: 'dark',
  refreshInterval: 60
};

const STORAGE_KEY = 'crypto-vault-settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsStore {
  private _currency = signal('usd');
  private _locale = signal('en');
  private _theme = signal<'light' | 'dark' | 'auto'>('dark');
  private _refreshInterval = signal(60);

  currency = this._currency.asReadonly();
  locale = this._locale.asReadonly();
  theme = this._theme.asReadonly();
  refreshInterval = this._refreshInterval.asReadonly();

  constructor() {
    this.loadFromStorage();
  }

  updateCurrency(currency: string): void {
    this._currency.set(currency);
    this.persistSettings();
  }

  updateTheme(theme: 'light' | 'dark' | 'auto'): void {
    this._theme.set(theme);
    this.persistSettings();
  }

  updateLocale(locale: string): void {
    this._locale.set(locale);
    this.persistSettings();
  }

  updateRefreshInterval(interval: number): void {
    this._refreshInterval.set(interval);
    this.persistSettings();
  }

  getSettings(): AppSettings {
    return {
      currency: this._currency(),
      locale: this._locale(),
      theme: this._theme(),
      refreshInterval: this._refreshInterval()
    };
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: AppSettings = JSON.parse(raw);
        this._currency.set(stored.currency ?? DEFAULT_SETTINGS.currency);
        this._locale.set(stored.locale ?? DEFAULT_SETTINGS.locale);
        this._theme.set(stored.theme ?? DEFAULT_SETTINGS.theme);
        this._refreshInterval.set(stored.refreshInterval ?? DEFAULT_SETTINGS.refreshInterval);
      }
    } catch {
      // Storage unavailable, use defaults
    }
  }

  private persistSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.getSettings()));
    } catch {
      // Storage unavailable
    }
  }
}
