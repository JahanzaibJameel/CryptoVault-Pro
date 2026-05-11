import { Injectable, signal, computed, inject } from '@angular/core';
import { IndexedDbService } from '../../../infrastructure/persistence/indexed-db.service';

// Type declarations for Web Crypto API
interface AesGcmParams {
  name: string;
  iv: Uint8Array;
}

interface Pbkdf2Params {
  name: string;
  salt: Uint8Array;
  iterations: number;
  hash: string;
}

export interface EncryptionKey {
  id: string;
  key: CryptoKey;
  created: number;
  lastUsed: number;
}

export interface EncryptedData {
  data: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  algorithm: string;
  keyId: string;
}

@Injectable({
  providedIn: 'root'
})
export class EncryptedStorageService {
  private indexedDb = inject(IndexedDbService);
  
  private currentKey = signal<EncryptionKey | null>(null);
  private isUnlocked = signal(false);
  private encryptionAlgorithm = 'AES-GCM';
  private keyDerivationAlgorithm = 'PBKDF2';
  
  // Computed properties
  public keyInfo = computed(() => {
    const key = this.currentKey();
    if (!key) return null;
    
    return {
      id: key.id,
      created: key.created,
      lastUsed: key.lastUsed,
      isDeviceKey: key.id.startsWith('device-')
    };
  });
  
  public encryptionStatus = computed(() => ({
    isUnlocked: this.isUnlocked(),
    hasKey: !!this.currentKey(),
    algorithm: this.encryptionAlgorithm
  }));

  constructor() {
    this.initializeEncryption();
  }

  private async initializeEncryption(): Promise<void> {
    try {
      // Try to auto-unlock with device key if available
      await this.tryAutoUnlock();
    } catch (error) {
      console.warn('Failed to auto-unlock encryption:', error);
    }
  }

  private async tryAutoUnlock(): Promise<void> {
    const deviceKeyId = 'device-key';
    const storedKeyData = await this.indexedDb.get('encryption-keys', deviceKeyId);
    
    if (storedKeyData) {
      try {
        const key = await this.importKey(storedKeyData.keyData);
        this.currentKey.set({
          id: deviceKeyId,
          key,
          created: storedKeyData.created,
          lastUsed: Date.now()
        });
        this.isUnlocked.set(true);
      } catch (error) {
        console.warn('Failed to import device key:', error);
        await this.indexedDb.delete('encryption-keys', deviceKeyId);
      }
    }
  }

  async setupEncryption(passphrase: string, useDeviceKey = false): Promise<void> {
    let key: CryptoKey;
    let keyId: string;

    if (useDeviceKey) {
      // Generate device-specific key
      const deviceFingerprint = await this.getDeviceFingerprint();
      const salt = crypto.getRandomValues(new Uint8Array(32));
      
      key = await this.deriveKey(deviceFingerprint + passphrase, salt);
      keyId = 'device-key';
      
      // Store the key data for auto-unlock
      const keyData = await this.exportKey(key);
      await this.indexedDb.set('encryption-keys', keyId, {
        keyData,
        created: Date.now(),
        salt: Array.from(salt)
      });
    } else {
      // Session-only key
      const salt = crypto.getRandomValues(new Uint8Array(32));
      key = await this.deriveKey(passphrase, salt);
      keyId = `session-${Date.now()}`;
    }

    this.currentKey.set({
      id: keyId,
      key,
      created: Date.now(),
      lastUsed: Date.now()
    });
    
    this.isUnlocked.set(true);
  }

  async changePassphrase(oldPassphrase: string, newPassphrase: string): Promise<void> {
    if (!this.isUnlocked()) {
      throw new Error('Encryption is not unlocked');
    }

    // Create new key with new passphrase
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const newKey = await this.deriveKey(newPassphrase, salt);
    
    // Re-encrypt all data with new key
    const allData = await this.indexedDb.getAll('encrypted-data');
    const reencryptedData: Array<{ id: string; data: EncryptedData }> = [];
    
    for (const item of allData) {
      const decryptedData = await this.decrypt(item.data);
      const reencrypted = await this.encrypt(decryptedData, newKey);
      reencryptedData.push({ id: item.id, data: reencrypted });
    }
    
    // Update all encrypted data
    for (const item of reencryptedData) {
      await this.indexedDb.set('encrypted-data', item.id, item.data);
    }
    
    // Update current key
    this.currentKey.update(current => current ? {
      ...current,
      key: newKey,
      lastUsed: Date.now()
    } : null);
  }

  async encrypt(data: any, key?: CryptoKey): Promise<EncryptedData> {
    const encryptionKey = key || this.currentKey()?.key;
    if (!encryptionKey) {
      throw new Error('No encryption key available');
    }

    try {
      // Convert data to JSON string then to ArrayBuffer
      const jsonData = JSON.stringify(data);
      const dataBuffer = new TextEncoder().encode(jsonData);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.encryptionAlgorithm,
          iv: iv
        },
        encryptionKey,
        dataBuffer
      );
      
      // Generate salt for key derivation (stored for future reference)
      const salt = crypto.getRandomValues(new Uint8Array(32));
      
      const result: EncryptedData = {
        data: encryptedBuffer,
        iv,
        salt,
        algorithm: this.encryptionAlgorithm,
        keyId: this.currentKey()?.id || 'unknown'
      };
      
      // Update last used time
      this.currentKey.update(current => current ? {
        ...current,
        lastUsed: Date.now()
      } : null);
      
      return result;
    } catch (error) {
      throw new Error(`Encryption failed: ${(error as Error).message}`);
    }
  }

  async decrypt(encryptedData: EncryptedData, key?: CryptoKey): Promise<any> {
    const decryptionKey = key || this.currentKey()?.key;
    if (!decryptionKey) {
      throw new Error('No decryption key available');
    }

    try {
      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.encryptionAlgorithm,
          iv: encryptedData.iv as Uint8Array
        } as AesGcmParams,
        decryptionKey,
        encryptedData.data as ArrayBuffer
      );
      
      // Convert back to JSON
      const decryptedText = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decryptedText);
    } catch (error) {
      throw new Error(`Decryption failed: ${(error as Error).message}`);
    }
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.isUnlocked()) {
      throw new Error('Encryption is not unlocked');
    }

    const encrypted = await this.encrypt(value);
    await this.indexedDb.set('encrypted-data', key, encrypted);
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isUnlocked()) {
      throw new Error('Encryption is not unlocked');
    }

    const encrypted = await this.indexedDb.get('encrypted-data', key);
    if (!encrypted) return null;
    
    return await this.decrypt(encrypted);
  }

  async remove(key: string): Promise<void> {
    await this.indexedDb.delete('encrypted-data', key);
  }

  async clear(): Promise<void> {
    await this.indexedDb.clear('encrypted-data');
  }

  async lock(): Promise<void> {
    this.currentKey.set(null);
    this.isUnlocked.set(false);
  }

  async unlock(passphrase: string): Promise<void> {
    const deviceKeyId = 'device-key';
    const storedKeyData = await this.indexedDb.get('encryption-keys', deviceKeyId);
    
    if (!storedKeyData) {
      throw new Error('No encryption setup found. Please set up encryption first.');
    }
    
    try {
      const deviceFingerprint = await this.getDeviceFingerprint();
      const saltArray = new Uint8Array(storedKeyData.salt as number[]);
      const key = await this.deriveKey(deviceFingerprint + passphrase, saltArray);
      
      // Test the key by trying to decrypt a known value
      const testData = await this.indexedDb.get('encrypted-data', 'test-key');
      if (testData) {
        await this.decrypt(testData, key);
      }
      
      this.currentKey.set({
        id: deviceKeyId,
        key,
        created: storedKeyData.created,
        lastUsed: Date.now()
      });
      
      this.isUnlocked.set(true);
    } catch (error) {
      throw new Error('Invalid passphrase');
    }
  }

  async testEncryption(): Promise<boolean> {
    if (!this.isUnlocked()) return false;
    
    try {
      const testData = { test: 'encryption-test', timestamp: Date.now() };
      await this.set('test-key', testData);
      const decrypted = await this.get('test-key');
      await this.remove('test-key');
      
      return (decrypted as any)?.test === 'encryption-test' && (decrypted as any)?.timestamp === testData.timestamp;
    } catch (error) {
      console.error('Encryption test failed:', error);
      return false;
    }
  }

  getEncryptionInfo(): {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    isSecure: boolean;
  } {
    return {
      algorithm: this.encryptionAlgorithm,
      keyLength: 256, // AES-256
      ivLength: 12, // GCM recommended IV length
      isSecure: this.isUnlocked() && !!this.currentKey()
    };
  }

  private async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: this.keyDerivationAlgorithm,
        salt: salt as Uint8Array,
        iterations: 100000,
        hash: 'SHA-256'
      } as Pbkdf2Params,
      keyMaterial,
      { name: this.encryptionAlgorithm, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async exportKey(key: CryptoKey): Promise<ArrayBuffer> {
    return crypto.subtle.exportKey('raw', key);
  }

  private async importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      'raw',
      keyData,
      this.encryptionAlgorithm,
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async getDeviceFingerprint(): Promise<string> {
    // Create a device fingerprint using available browser APIs
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      const canvasFingerprint = canvas.toDataURL();
      
      // Combine with other available identifiers
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvasFingerprint
      ].join('|');
      
      // Hash the fingerprint
      const encoder = new TextEncoder();
      const data = encoder.encode(fingerprint);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback to simple fingerprint
    return navigator.userAgent + '-' + screen.width + 'x' + screen.height;
  }
}
