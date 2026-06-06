import { Injectable } from '@angular/core';

const DB_NAME = 'crypto-vault-db';
const DB_VERSION = 1;
const STORE_NAMES = [
  'encrypted-data',
  'encryption-keys',
  'cache',
  'watchlist',
  'transactions',
  'settings'
];

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          for (const name of STORE_NAMES) {
            if (!db.objectStoreNames.contains(name)) {
              db.createObjectStore(name);
            }
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  async get(storeName: string, key: string): Promise<any> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async set(storeName: string, key: string, value: any): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const request = tx.objectStore(storeName).put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const request = tx.objectStore(storeName).delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const request = tx.objectStore(storeName).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async keys(storeName: string): Promise<string[]> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }
}
