import React, { useEffect, useRef, useState } from 'react';
import { X, Palette, Image as ImageIcon, Loader2, UploadCloud } from 'lucide-react';
import { fileService } from '../../services/fileService';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (themeColor?: string, wallpaperUrl?: string) => void;
  currentThemeColor?: string;
  currentWallpaperUrl?: string;
  isLoading?: boolean;
}

const PRESET_COLORS = [
  '#4F46E5', // Indigo (Default)
  '#E11D48', // Rose
  '#059669', // Emerald
  '#D97706', // Amber
  '#7C3AED', // Violet
  '#2563EB', // Blue
  '#DB2777', // Pink
  '#EA580C', // Orange
];

const PRESET_WALLPAPERS = [
  { id: 'none', url: '', label: 'Default (None)' },
  { id: 'space', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80', label: 'Space' },
  { id: 'nature', url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80', label: 'Nature' },
  { id: 'abstract', url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80', label: 'Abstract' },
];

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentThemeColor,
  currentWallpaperUrl,
  isLoading,
}) => {
  const [themeColor, setThemeColor] = useState<string>(currentThemeColor || PRESET_COLORS[0]);
  const [wallpaperUrl, setWallpaperUrl] = useState<string>(currentWallpaperUrl || '');
  const [customUrl, setCustomUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setThemeColor(currentThemeColor || PRESET_COLORS[0]);
    setWallpaperUrl(currentWallpaperUrl || '');
    setCustomUrl('');
    setUploadProgress(0);
    setUploadError(null);
    setIsUploadingWallpaper(false);
  }, [currentThemeColor, currentWallpaperUrl, isOpen]);

  if (!isOpen) return null;

  const handleWallpaperUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn file ảnh.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Ảnh nền không nên lớn hơn 10MB.');
      return;
    }

    setUploadError(null);
    setUploadProgress(0);
    setIsUploadingWallpaper(true);
    try {
      const response = await fileService.uploadFile(file, setUploadProgress);
      if (response.success && response.data?.url) {
        setWallpaperUrl(response.data.url);
        setCustomUrl(response.data.url);
      } else {
        setUploadError(response.message || 'Không thể upload ảnh nền.');
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || 'Không thể upload ảnh nền.');
    } finally {
      setIsUploadingWallpaper(false);
    }
  };

  const handleSave = () => {
    onSave(themeColor, wallpaperUrl || customUrl || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Customize Theme
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Theme Color Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme Color</h3>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setThemeColor(color)}
                  className={`w-full aspect-square rounded-full flex items-center justify-center transition-all ${
                    themeColor === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-indigo-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Wallpaper Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Wallpaper
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {PRESET_WALLPAPERS.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => setWallpaperUrl(wp.url)}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    wallpaperUrl === wp.url ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {wp.url ? (
                    <img src={wp.url} alt={wp.label} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-xs text-gray-500">
                      {wp.label}
                    </div>
                  )}
                  {wallpaperUrl === wp.url && (
                    <div className="absolute inset-0 bg-indigo-500/10" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Or use a custom image URL:</label>
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  if (e.target.value) setWallpaperUrl(e.target.value);
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="mt-3 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleWallpaperUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingWallpaper}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
              >
                {isUploadingWallpaper ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
                <span>{isUploadingWallpaper ? `Uploading ${uploadProgress}%` : 'Upload wallpaper from device'}</span>
              </button>
              {isUploadingWallpaper && (
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              {uploadError && (
                <p className="m-0 text-xs font-medium text-rose-600 dark:text-rose-300">{uploadError}</p>
              )}
              {wallpaperUrl && (
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <img src={wallpaperUrl} alt="Selected wallpaper preview" className="h-24 w-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || isUploadingWallpaper}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Theme
          </button>
        </div>
      </div>
    </div>
  );
};
