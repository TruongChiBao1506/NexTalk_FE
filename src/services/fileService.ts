import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';

export interface FileUploadResponse {
  url: string;
  publicId: string;
  fileName?: string;
  contentType?: string;
  size?: number;
}

export const fileService = {
  async uploadFile(
    file: File,
    onUploadProgress?: (progress: number) => void
  ): Promise<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<FileUploadResponse>>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },
};
