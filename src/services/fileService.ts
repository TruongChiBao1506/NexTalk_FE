import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import { compressImage } from '../utils/imageCompressor';

export interface FileUploadResponse {
  url: string;
  publicId: string;
  fileName?: string;
  contentType?: string;
  size?: number;
}

const MAX_RAW_FILE_SIZE = 10 * 1024 * 1024;

export const fileService = {
  async uploadFile(
    file: File,
    onUploadProgress?: (progress: number) => void,
    signal?: AbortSignal,
  ): Promise<ApiResponse<FileUploadResponse>> {
    const fileToUpload = await compressImage(file);
    if (fileToUpload.type === 'application/zip' && fileToUpload.size > MAX_RAW_FILE_SIZE) {
      throw new Error('File ZIP vượt quá giới hạn 10 MB.');
    }

    const form = new FormData();
    form.append('file', fileToUpload);
    const response = await apiClient.post<ApiResponse<FileUploadResponse>>('/files/upload', form, {
      signal,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: event => {
        if (event.total) onUploadProgress?.(Math.round((event.loaded * 100) / event.total));
      },
    });
    onUploadProgress?.(100);
    return response.data;
  },
};
