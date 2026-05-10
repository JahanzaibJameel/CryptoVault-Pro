import { signal, computed, inject } from '@angular/core';
import { LocalStorageService } from '../../../infrastructure/persistence/local-storage.service';

export type Theme = 'light' | 'dark';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY';

export interface UserSettings {
  theme: Theme;
  currency: Currency;
  autoRefresh: boolean;
  refreshInterval: number; // minutes
  notificationsEnabled: boolean;
  priceAlertThreshold: number; // percentage
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  currency: 'USD',
  autoRefresh: true,
  refreshInterval: 5,
  notificationsEnabled: true,
  priceAlertThreshold: 5,
};

export class SettingsStore {
  private localStorage = inject(LocalStorageService);
  
  private state = signal<UserSettings>(DEFAULT_SETTINGS);

  // Selectors
  theme = computed(() => this.state().theme);
  currency = computed(() => this.state().currency);
  autoRefresh = computed(() => this.state().autoRefresh);
  refreshInterval = computed(() => this.state().refreshInterval);
  notificationsEnabled = computed(() => this.state().notificationsEnabled);
  priceAlertThreshold = computed(() => this.state().priceAlertThreshold);
  isDarkTheme = computed(() => this.state().theme === 'dark');

  constructor() {
    this.hydrateFromStorage();
  }

  toggleTheme() {
    const newTheme = this.state().theme === 'light' ? 'dark' : 'light';
    this.updateSetting('theme', newTheme);
    this.applyTheme(newTheme);
  }

  setTheme(theme: Theme) {
    this.updateSetting('theme', theme);
    this.applyTheme(theme);
  }

  setCurrency(currency: Currency) {
    this.updateSetting('currency', currency);
  }

  setAutoRefresh(enabled: boolean) {
    this.updateSetting('autoRefresh', enabled);
  }

  setRefreshInterval(interval: number) {
    this.updateSetting('refreshInterval', Math.max(1, interval)); // Minimum 1 minute
  }

  setNotificationsEnabled(enabled: boolean) {
    this.updateSetting('notificationsEnabled', enabled);
  }

  setPriceAlertThreshold(threshold: number) {
    this.updateSetting('priceAlertThreshold', Math.max(0.1, threshold)); // Minimum 0.1%
  }

  resetToDefaults() {
    this.state.set(DEFAULT_SETTINGS);
    this.saveToStorage();
    this.applyTheme(DEFAULT_SETTINGS.theme);
  }

  exportSettings(): string {
    return JSON.stringify(this.state(), null, 2);
  }

  importSettings(jsonData: string) {
    try {
      const settings = JSON.parse(jsonData);
      // Validate and merge with defaults
      const validatedSettings: UserSettings = {
        ...DEFAULT_SETTINGS,
        ...settings,
        // Ensure theme is valid
        theme: ['light', 'dark'].includes(settings.theme) ? settings.theme : DEFAULT_SETTINGS.theme,
        // Ensure currency is valid
        currency: ['USD', 'EUR', 'GBP', 'JPY'].includes(settings.currency) 
          ? settings.currency 
          : DEFAULT_SETTINGS.currency,
      };
      
      this.state.set(validatedSettings);
      this.saveToStorage();
      this.applyTheme(validatedSettings.theme);
    } catch (error) {
      throw new Error('Invalid settings format');
    }
  }

  private updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    this.state.update(current => ({ ...current, [key]: value }));
    this.saveToStorage();
  }

  private saveToStorage() {
    this.localStorage.set('crypto-vault-settings', JSON.stringify(this.state()));
  }

  private hydrateFromStorage() {
    try {
      const stored = this.localStorage.get('crypto-vault-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        // Merge with defaults to handle any missing properties
        const hydratedSettings: UserSettings = {
          ...DEFAULT_SETTINGS,
          ...settings,
          // Ensure theme is valid
          theme: ['light', 'dark'].includes(settings.theme) ? settings.theme : DEFAULT_SETTINGS.theme,
          // Ensure currency is valid
          currency: ['USD', 'EUR', 'GBP', 'JPY'].includes(settings.currency) 
            ? settings.currency 
            : DEFAULT_SETTINGS.currency,
        };
        
        this.state.set(hydratedSettings);
        this.applyTheme(hydratedSettings.theme);
      }
    } catch (error) {
      console.error('Failed to hydrate settings from storage:', error);
      // Use defaults and save them
      this.saveToStorage();
    }
  }

  private applyTheme(theme: Theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
  }
}
