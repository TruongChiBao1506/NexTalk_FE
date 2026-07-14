import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/auth';
import { compressImage } from '../utils/imageCompressor';
import axios from 'axios';

export interface FileUploadResponse {
  url: string;
  publicId: string;
  fileName?: string;
  contentType?: string;
  size?: number;
}

interface DirectUploadPrepareResponse {
  deduplicated: boolean;
  file?: FileUploadResponse;
  apiKey?: string;
  timestamp?: number;
  signature?: string;
  publicId?: string;
  resourceType?: string;
  uploadUrl?: string;
}

interface CloudinaryUploadResponse {
  public_id: string;
  resource_type: string;
  secure_url: string;
  signature: string;
  version: number;
  format?: string;
  bytes?: number;
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export const fileService = {
  async uploadFile(
    file: File,
    onUploadProgress?: (progress: number) => void
  ): Promise<ApiResponse<FileUploadResponse>> {
    // Compress image client-side if it's an image file
    const fileToUpload = await compressImage(file);

    const hash = await sha256(fileToUpload);
    const prepare = await apiClient.post<ApiResponse<DirectUploadPrepareResponse>>('/files/direct-upload/prepare', {
      hash,
      fileName: fileToUpload.name,
      contentType: fileToUpload.type || 'application/octet-stream',
      size: fileToUpload.size,
    });

    if (prepare.data.data.deduplicated && prepare.data.data.file) {
      onUploadProgress?.(100);
      return { ...prepare.data, data: prepare.data.data.file };
    }

    const ticket = prepare.data.data;
    if (!ticket.uploadUrl || !ticket.apiKey || !ticket.timestamp || !ticket.signature || !ticket.publicId) {
      throw new Error('Backend returned an incomplete Cloudinary upload signature');
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('api_key', ticket.apiKey);
    formData.append('timestamp', String(ticket.timestamp));
    formData.append('signature', ticket.signature);
    formData.append('public_id', ticket.publicId);
    formData.append('overwrite', 'true');

    const cloudinary = await axios.post<CloudinaryUploadResponse>(ticket.uploadUrl, formData, {
      onUploadProgress: event => {
        if (event.total) onUploadProgress?.(Math.round((event.loaded * 95) / event.total));
      },
    });

    const response = await apiClient.post<ApiResponse<FileUploadResponse>>('/files/direct-upload/confirm', {
      hash,
      publicId: cloudinary.data.public_id,
      resourceType: cloudinary.data.resource_type,
      url: cloudinary.data.secure_url,
      responseSignature: cloudinary.data.signature,
      version: String(cloudinary.data.version),
      format: cloudinary.data.format,
      bytes: cloudinary.data.bytes,
      fileName: fileToUpload.name,
      contentType: fileToUpload.type || 'application/octet-stream',
      size: fileToUpload.size,
    });
    onUploadProgress?.(100);

    return response.data;
  },
};
