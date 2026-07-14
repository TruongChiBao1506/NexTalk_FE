/**
 * Utility for compressing image files on the client side before uploading to storage/server.
 */
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.82,
    mimeType,
  } = options;

  // Don't compress non-image files or animated GIFs
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  // Skip compressing very small images (< 300KB)
  if (file.size < 300 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Calculate aspect ratio scaling
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          // Draw image to canvas with smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Select target mime type (prefer original mimeType or image/jpeg)
          const targetMimeType = mimeType || (file.type === 'image/png' ? 'image/png' : 'image/jpeg');

          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) {
                // If compressed version is somehow larger or failed, return original file
                resolve(file);
                return;
              }

              // Create a new File instance from the compressed Blob
              const newFileName = file.name.replace(/\.[^/.]+$/, '') + (targetMimeType === 'image/png' ? '.png' : '.jpg');
              const compressedFile = new File([blob], newFileName, {
                type: targetMimeType,
                lastModified: Date.now(),
              });

              console.log(
                `Compressed ${file.name}: ${(file.size / 1024).toFixed(0)}KB -> ${(compressedFile.size / 1024).toFixed(0)}KB`
              );

              resolve(compressedFile);
            },
            targetMimeType,
            quality
          );
        } catch (error) {
          console.warn('Image compression error, falling back to original file:', error);
          resolve(file);
        }
      };

      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
