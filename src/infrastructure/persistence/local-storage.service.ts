import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly prefix = 'crypto-vault-';

  get(key: string): string | null {
    try {
      return localStorage.getItem(this.prefix + key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(this.prefix + key, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      throw error;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  getJson<T>(key: string): T | null {
    const value = this.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Error parsing JSON from localStorage:', error);
      return null;
    }
  }

  setJson<T>(key: string, value: T): void {
    try {
      const jsonString = JSON.stringify(value);
      this.set(key, jsonString);
    } catch (error) {
      console.error('Error stringifying JSON for localStorage:', error);
      throw error;
    }
  }

  exists(key: string): boolean {
    return this.get(key) !== null;
  }

  getKeys(): string[] {
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.substring(this.prefix.length));
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }

  getStorageInfo(): {
    used: number;
    available: number;
    total: number;
    percentage: number;
  } {
    try {
      let used = 0;
      const keys = Object.keys(localStorage);
      
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
          }
        }
      }

      // Approximate localStorage limit (usually 5-10MB)
      const total = 5 * 1024 * 1024; // 5MB
      const available = total - used;
      const percentage = (used / total) * 100;

      return { used, available, total, percentage };
    } catch (error) {
      console.error('Error calculating localStorage usage:', error);
      return { used: 0, available: 0, total: 0, percentage: 0 };
    }
  }

  isLocalStorageAvailable(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Utility methods for common data types
  getNumber(key: string, defaultValue = 0): number {
    const value = this.get(key);
    if (!value) return defaultValue;
    
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  setNumber(key: string, value: number): void {
    this.set(key, String(value));
  }

  getBoolean(key: string, defaultValue = false): boolean {
    const value = this.get(key);
    if (!value) return defaultValue;
    
    return value === 'true';
  }

  setBoolean(key: string, value: boolean): void {
    this.set(key, String(value));
  }

  getDate(key: string): Date | null {
    const value = this.get(key);
    if (!value) return null;
    
    try {
      return new Date(value);
    } catch (error) {
      console.error('Error parsing date from localStorage:', error);
      return null;
    }
  }

  setDate(key: string, date: Date): void {
    this.set(key, date.toISOString());
  }

  // Session storage wrapper (for temporary data)
  getSession(key: string): string | null {
    try {
      return sessionStorage.getItem(this.prefix + key);
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return null;
    }
  }

  setSession(key: string, value: string): void {
    try {
      sessionStorage.setItem(this.prefix + key, value);
    } catch (error) {
      console.error('Error writing to sessionStorage:', error);
      throw error;
    }
  }

  removeSession(key: string): void {
    try {
      sessionStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  }

  clearSession(): void {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  }

  getSessionJson<T>(key: string): T | null {
    const value = this.getSession(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Error parsing JSON from sessionStorage:', error);
      return null;
    }
  }

  setSessionJson<T>(key: string, value: T): void {
    try {
      const jsonString = JSON.stringify(value);
      this.setSession(key, jsonString);
    } catch (error) {
      console.error('Error stringifying JSON for sessionStorage:', error);
      throw error;
    }
  }
}
