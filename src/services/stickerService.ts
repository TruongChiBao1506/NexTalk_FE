import { apiClient } from '../api/apiClient';
import type { StickerPack } from '../types/sticker';
import type { ApiResponse } from '../types/auth';

export const stickerService = {
  // Public APIs
  async getStickerPacks(): Promise<StickerPack[]> {
    const response = await apiClient.get<ApiResponse<StickerPack[]>>('/stickers/packs');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  },

  // Admin APIs
  async createPack(name: string, coverUrl: string): Promise<StickerPack> {
    const response = await apiClient.post<ApiResponse<StickerPack>>('/stickers/packs', {
      name,
      coverUrl
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Lỗi tạo bộ sticker');
    }
    return response.data.data;
  },

  async addStickersToPack(packId: string, stickerUrls: string[]): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(`/stickers/packs/${packId}/stickers`, {
      stickerUrls
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Lỗi thêm stickers');
    }
  },

  async togglePackActive(packId: string, isActive: boolean): Promise<void> {
    const response = await apiClient.patch<ApiResponse<void>>(`/stickers/packs/${packId}/toggle`, {
      isActive
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Lỗi cập nhật bộ sticker');
    }
  },

  async toggleStickerActive(packId: string, stickerId: string, isActive: boolean): Promise<void> {
    const response = await apiClient.patch<ApiResponse<void>>(`/stickers/packs/${packId}/stickers/${stickerId}/toggle`, {
      isActive
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Lỗi cập nhật sticker');
    }
  },

  async deleteSticker(packId: string, stickerId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/stickers/packs/${packId}/stickers/${stickerId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Lỗi xóa sticker');
    }
  }
};
