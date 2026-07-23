import type { ConversationResponse, MessageResponse } from '../types/chat';

export interface CachedConversationData {
  conversations: ConversationResponse[];
  lastMessages: Record<string, MessageResponse>;
  unreadCounts: Record<string, number>;
  timestamp: number;
}

const DB_NAME = 'nextalk_encrypted_cache';
const DB_VERSION = 1;
const STORE_NAME = 'user_cache';
const KEY_SALT = 'NexTalk_AES_GCM_v1';

class EncryptedCacheService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private keyCache: Map<string, CryptoKey> = new Map();

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this environment'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Derives a 256-bit AES-GCM CryptoKey in RAM for the given userId.
   */
  private async getDeriveKey(userId: string): Promise<CryptoKey> {
    if (this.keyCache.has(userId)) {
      return this.keyCache.get(userId)!;
    }

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(`${userId}_${KEY_SALT}`),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(KEY_SALT),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable from RAM
      ['encrypt', 'decrypt']
    );

    this.keyCache.set(userId, key);
    return key;
  }

  /**
   * Encrypts plaintext JSON data with AES-GCM and returns IV + Ciphertext ArrayBuffers.
   */
  private async encryptData(userId: string, data: any): Promise<{ iv: number[]; cipher: number[] }> {
    const key = await this.getDeriveKey(userId);
    const encoder = new TextEncoder();
    const jsonString = JSON.stringify(data);
    const encoded = encoder.encode(jsonString);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    return {
      iv: Array.from(iv),
      cipher: Array.from(new Uint8Array(cipherBuffer)),
    };
  }

  /**
   * Decrypts AES-GCM cipher data back to JSON.
   */
  private async decryptData<T>(userId: string, encrypted: { iv: number[]; cipher: number[] }): Promise<T | null> {
    try {
      const key = await this.getDeriveKey(userId);
      const iv = new Uint8Array(encrypted.iv);
      const cipherBuffer = new Uint8Array(encrypted.cipher).buffer;

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipherBuffer
      );

      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedBuffer);
      return JSON.parse(jsonString) as T;
    } catch (err) {
      console.warn('[EncryptedCacheService] Decryption failed or cache corrupted:', err);
      return null;
    }
  }

  /**
   * Loads and decrypts cached conversation data for a user (< 2ms).
   */
  async load(userId: string | undefined | null): Promise<CachedConversationData | null> {
    if (!userId) return null;

    try {
      const db = await this.getDB();
      const rawEncrypted = await new Promise<{ iv: number[]; cipher: number[] } | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(userId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (!rawEncrypted || !rawEncrypted.iv || !rawEncrypted.cipher) {
        return null;
      }

      return await this.decryptData<CachedConversationData>(userId, rawEncrypted);
    } catch (err) {
      console.warn('[EncryptedCacheService] Failed to load cache:', err);
      return null;
    }
  }

  /**
   * Encrypts and saves conversation data to IndexedDB.
   */
  async save(userId: string | undefined | null, data: Omit<CachedConversationData, 'timestamp'>): Promise<void> {
    if (!userId) return;

    try {
      const payload: CachedConversationData = {
        ...data,
        timestamp: Date.now(),
      };

      const encrypted = await this.encryptData(userId, payload);
      const db = await this.getDB();

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(encrypted, userId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[EncryptedCacheService] Failed to save cache:', err);
    }
  }

  /**
   * Patches existing encrypted cache with partial updates (e.g. on new incoming message).
   */
  async patch(userId: string | undefined | null, partial: Partial<Omit<CachedConversationData, 'timestamp'>>): Promise<void> {
    if (!userId) return;

    try {
      const existing = await this.load(userId);
      const updated: Omit<CachedConversationData, 'timestamp'> = {
        conversations: partial.conversations ?? existing?.conversations ?? [],
        lastMessages: { ...existing?.lastMessages, ...partial.lastMessages },
        unreadCounts: { ...existing?.unreadCounts, ...partial.unreadCounts },
      };

      await this.save(userId, updated);
    } catch (err) {
      console.warn('[EncryptedCacheService] Failed to patch cache:', err);
    }
  }

  /**
   * Clears encrypted cache for the given user (call on logout).
   */
  async clear(userId: string | undefined | null): Promise<void> {
    if (userId) {
      this.keyCache.delete(userId);
    }

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = userId ? store.delete(userId) : store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[EncryptedCacheService] Failed to clear cache:', err);
    }
  }
}

export const encryptedCacheService = new EncryptedCacheService();
