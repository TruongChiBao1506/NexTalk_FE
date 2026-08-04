import { create } from 'zustand';
import { stickerService } from '../services/stickerService';
import type { StickerPack } from '../types/sticker';

interface StickerState {
  packs: StickerPack[];
  adminPacks: StickerPack[];
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  fetchPacks: (force?: boolean) => Promise<void>;
  fetchAllPacks: () => Promise<void>;
  createPack: (name: string, coverUrl: string) => Promise<void>;
  addStickers: (packId: string, stickerUrls: string[]) => Promise<void>;
  togglePack: (packId: string, isActive: boolean) => Promise<void>;
  toggleSticker: (packId: string, stickerId: string, isActive: boolean) => Promise<void>;
  deleteSticker: (packId: string, stickerId: string) => Promise<void>;
}

export const useStickerStore = create<StickerState>((set, get) => ({
  packs: [],
  adminPacks: [],
  isLoading: false,
  error: null,
  hasFetched: false,

  fetchPacks: async (force = false) => {
    const { hasFetched, isLoading } = get();
    if (!force && (hasFetched || isLoading)) return;

    set({ isLoading: true, error: null });
    try {
      const packs = await stickerService.getStickerPacks();
      const activePacks = packs
        .filter(pack => pack.isActive !== false)
        .map(pack => ({
          ...pack,
          stickers: pack.stickers.filter(s => s.isActive !== false)
        }));
      
      set({ packs: activePacks, adminPacks: packs, isLoading: false, hasFetched: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tải danh sách sticker';
      set({ error: message, isLoading: false });
    }
  },

  fetchAllPacks: async () => {
    set({ isLoading: true, error: null });
    try {
      const packs = await stickerService.getStickerPacks();
      set({ adminPacks: packs, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tải danh sách admin';
      set({ error: message, isLoading: false });
    }
  },

  createPack: async (name, coverUrl) => {
    await stickerService.createPack(name, coverUrl);
    await get().fetchAllPacks();
    await get().fetchPacks(true);
  },

  addStickers: async (packId, stickerUrls) => {
    await stickerService.addStickersToPack(packId, stickerUrls);
    await get().fetchAllPacks();
    await get().fetchPacks(true);
  },

  togglePack: async (packId, isActive) => {
    await stickerService.togglePackActive(packId, isActive);
    await get().fetchAllPacks();
    await get().fetchPacks(true);
  },

  toggleSticker: async (packId, stickerId, isActive) => {
    await stickerService.toggleStickerActive(packId, stickerId, isActive);
    await get().fetchAllPacks();
    await get().fetchPacks(true);
  },

  deleteSticker: async (packId, stickerId) => {
    await stickerService.deleteSticker(packId, stickerId);
    await get().fetchAllPacks();
    await get().fetchPacks(true);
  }
}));
