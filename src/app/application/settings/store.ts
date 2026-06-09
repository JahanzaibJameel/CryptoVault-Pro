import { Injectable, signal } from '@angular/core';

export interface AppSettings {
  currency: string;
  locale: string;
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number;
  notificationsEnabled: boolean;
  autoRefresh: boolean;
  priceAlertThreshold: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'usd',
  locale: 'en',
  theme: 'dark',
  refreshInterval: 60,
  notificationsEnabled: true,
  autoRefresh: true,
  priceAlertThreshold: 5
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
  private _notificationsEnabled = signal(true);
  private _autoRefresh = signal(true);
  private _priceAlertThreshold = signal(5);

  currency = this._currency.asReadonly();
  locale = this._locale.asReadonly();
  theme = this._theme.asReadonly();
  refreshInterval = this._refreshInterval.asReadonly();
  notificationsEnabled = this._notificationsEnabled.asReadonly();
  autoRefresh = this._autoRefresh.asReadonly();
  priceAlertThreshold = this._priceAlertThreshold.asReadonly();

  constructor() {
    this.loadFromStorage();
  }

  updateTheme(theme: 'light' | 'dark' | 'auto'): void {
    this._theme.set(theme);
    this.persistSettings();
  }

  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.updateTheme(theme);
  }

  updateCurrency(currency: string): void {
    this._currency.set(currency);
    this.persistSettings();
  }

  setCurrency(currency: string): void {
    this.updateCurrency(currency);
  }

  updateRefreshInterval(interval: number): void {
    this._refreshInterval.set(interval);
    this.persistSettings();
  }

  setRefreshInterval(interval: number): void {
    this.updateRefreshInterval(interval);
  }

  setNotificationsEnabled(enabled: boolean): void {
    this._notificationsEnabled.set(enabled);
    this.persistSettings();
  }

  setAutoRefresh(enabled: boolean): void {
    this._autoRefresh.set(enabled);
    this.persistSettings();
  }

  setPriceAlertThreshold(threshold: number): void {
    this._priceAlertThreshold.set(threshold);
    this.persistSettings();
  }

  resetToDefaults(): void {
    this._currency.set(DEFAULT_SETTINGS.currency);
    this._locale.set(DEFAULT_SETTINGS.locale);
    this._theme.set(DEFAULT_SETTINGS.theme);
    this._refreshInterval.set(DEFAULT_SETTINGS.refreshInterval);
    this._notificationsEnabled.set(DEFAULT_SETTINGS.notificationsEnabled);
    this._autoRefresh.set(DEFAULT_SETTINGS.autoRefresh);
    this._priceAlertThreshold.set(DEFAULT_SETTINGS.priceAlertThreshold);
    this.persistSettings();
  }

  exportSettings(): string {
    return JSON.stringify(this.getSettings(), null, 2);
  }

  toggleTheme(): void {
    const nextTheme = this._theme() === 'dark' ? 'light' : 'dark';
    this.updateTheme(nextTheme);
  }

  updateLocale(locale: string): void {
    this._locale.set(locale);
    this.persistSettings();
  }

  getSettings(): AppSettings {
    return {
      currency: this._currency(),
      locale: this._locale(),
      theme: this._theme(),
      refreshInterval: this._refreshInterval(),
      notificationsEnabled: this._notificationsEnabled(),
      autoRefresh: this._autoRefresh(),
      priceAlertThreshold: this._priceAlertThreshold()
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
        this._notificationsEnabled.set(stored.notificationsEnabled ?? DEFAULT_SETTINGS.notificationsEnabled);
        this._autoRefresh.set(stored.autoRefresh ?? DEFAULT_SETTINGS.autoRefresh);
        this._priceAlertThreshold.set(stored.priceAlertThreshold ?? DEFAULT_SETTINGS.priceAlertThreshold);
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
