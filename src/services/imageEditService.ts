import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';

export interface ImageEditResult {
  sourceUrl: string;
  url: string;
  publicId: string;
  fileName: string;
  contentType: string;
  size: number;
  model: string;
}

export type ImageEditOperation =
  | 'REMOVE'
  | 'REPLACE'
  | 'RECOLOR'
  | 'BACKGROUND_REPLACE'
  | 'FILL'
  | 'RESTORE';

export interface ImageEditOptions {
  operation: ImageEditOperation;
  subject?: string;
  replacement?: string;
  color?: string;
  prompt?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

export const imageEditService = {
  async edit(
    messageId: string,
    sourceUrl: string,
    options: ImageEditOptions,
  ): Promise<ApiResponse<ImageEditResult>> {
    const response = await apiClient.post<ApiResponse<ImageEditResult>>('/images/edit', {
      messageId,
      sourceUrl,
      ...options,
    });
    return response.data;
  },
};
