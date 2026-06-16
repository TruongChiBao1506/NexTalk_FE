import { FileText, Image, Video, File, FileArchive, FileCode, FileSpreadsheet, FileJson, FileAudio, FileBadge2 } from 'lucide-react';
import React from 'react';

export const formatFileSize = (bytes?: number | null): string => {
  if (bytes == null || isNaN(bytes)) return '';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getFileIconConfig = (fileName: string): { icon: React.ElementType; colorClass: string; bgColorClass: string } => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  switch (extension) {
    case 'pdf':
      return { icon: FileText, colorClass: 'text-red-500', bgColorClass: 'bg-red-50 dark:bg-red-500/10' };
    case 'doc':
    case 'docx':
      return { icon: FileText, colorClass: 'text-blue-500', bgColorClass: 'bg-blue-50 dark:bg-blue-500/10' };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return { icon: FileSpreadsheet, colorClass: 'text-green-500', bgColorClass: 'bg-green-50 dark:bg-green-500/10' };
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return { icon: FileArchive, colorClass: 'text-yellow-500', bgColorClass: 'bg-yellow-50 dark:bg-yellow-500/10' };
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'html':
    case 'css':
    case 'json':
      return { icon: FileCode, colorClass: 'text-purple-500', bgColorClass: 'bg-purple-50 dark:bg-purple-500/10' };
    case 'mp3':
    case 'wav':
    case 'ogg':
      return { icon: FileAudio, colorClass: 'text-pink-500', bgColorClass: 'bg-pink-50 dark:bg-pink-500/10' };
    default:
      return { icon: File, colorClass: 'text-gray-500', bgColorClass: 'bg-gray-50 dark:bg-gray-500/10' };
  }
};

export const downloadFile = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    // Fallback: just open in a new tab if fetch fails
    window.open(url, '_blank');
  }
};
