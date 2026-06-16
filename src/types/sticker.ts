export interface Sticker {
  id: string;
  packId: string;
  stickerUrl: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface StickerPack {
  id: string;
  name: string;
  coverUrl: string;
  sortOrder?: number;
  isActive?: boolean;
  stickers: Sticker[];
}
