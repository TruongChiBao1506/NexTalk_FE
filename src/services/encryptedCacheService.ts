import type { ConversationResponse, MessageResponse } from '../types/chat';
import type { GroupResponse } from '../types/group';

export interface CachedConversationData {
  conversations: ConversationResponse[];
  lastMessages: Record<string, MessageResponse>;
  unreadCounts: Record<string, number>;
  groups?: GroupResponse[];
  timestamp: number;
}

const LEGACY_DB_NAME = 'nextalk_encrypted_cache';
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Sensitive chat data is intentionally session-only. Browser storage cannot
 * safely hold a decryption key against XSS or a copied browser profile, and the
 * former userId-derived key was reproducible. This cache keeps the existing
 * async API while retaining values only in process memory.
 */
class EncryptedCacheService {
  private readonly sessionCache = new Map<string, CachedConversationData>();

  constructor() {
    this.removeLegacyPersistentCache();
  }

  async load(userId: string | undefined | null): Promise<CachedConversationData | null> {
    if (!userId) return null;
    const cached = this.sessionCache.get(userId);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      this.sessionCache.delete(userId);
      return null;
    }
    return structuredClone(cached);
  }

  async save(
    userId: string | undefined | null,
    data: Omit<CachedConversationData, 'timestamp'>,
  ): Promise<void> {
    if (!userId) return;
    this.sessionCache.set(userId, structuredClone({ ...data, timestamp: Date.now() }));
  }

  async patch(
    userId: string | undefined | null,
    partial: Partial<Omit<CachedConversationData, 'timestamp'>>,
  ): Promise<void> {
    if (!userId) return;
    const existing = await this.load(userId);
    await this.save(userId, {
      conversations: partial.conversations ?? existing?.conversations ?? [],
      lastMessages: { ...existing?.lastMessages, ...partial.lastMessages },
      unreadCounts: { ...existing?.unreadCounts, ...partial.unreadCounts },
      groups: partial.groups ?? existing?.groups ?? [],
    });
  }

  async clear(userId: string | undefined | null): Promise<void> {
    if (userId) {
      this.sessionCache.delete(userId);
    } else {
      this.sessionCache.clear();
    }
    this.removeLegacyPersistentCache();
  }

  private removeLegacyPersistentCache(): void {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    try {
      window.indexedDB.deleteDatabase(LEGACY_DB_NAME);
    } catch {
      // Cache deletion is best effort; no new persistent sensitive data is written.
    }
  }
}

export const encryptedCacheService = new EncryptedCacheService();
