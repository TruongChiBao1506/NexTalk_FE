const MAX_SOURCE_SIZE = 250 * 1024 * 1024;
const MAX_ZIP_SIZE = 50 * 1024 * 1024;
const MAX_FILE_COUNT = 5_000;

const safeArchiveName = (name: string) => {
  const sanitized = Array.from(name, (character) => (
    character.charCodeAt(0) < 32 || /[<>:"/\\|?*]/.test(character) ? '_' : character
  )).join('').trim();
  return `${sanitized || 'folder'}.zip`;
};

const normalizeRelativePath = (file: File) => {
  const relativePath = file.webkitRelativePath.replaceAll('\\', '/');
  return relativePath
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/');
};

export async function zipFolder(files: File[]): Promise<File> {
  if (files.length === 0) {
    throw new Error('Thư mục không có tệp để gửi.');
  }
  if (files.length > MAX_FILE_COUNT) {
    throw new Error(`Thư mục có quá nhiều tệp. Giới hạn hiện tại là ${MAX_FILE_COUNT.toLocaleString('vi-VN')} tệp.`);
  }
  if (files.some((file) => !file.webkitRelativePath)) {
    throw new Error('Trình duyệt này không cung cấp đường dẫn thư mục. Hãy thử lại bằng Chrome hoặc Edge.');
  }

  const sourceSize = files.reduce((total, file) => total + file.size, 0);
  if (sourceSize > MAX_SOURCE_SIZE) {
    throw new Error('Tổng dung lượng thư mục vượt quá 250 MB nên không thể nén an toàn trên trình duyệt.');
  }

  // Load the compressor only when the user actually selects a folder.
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const file of files) {
    const relativePath = normalizeRelativePath(file);
    if (relativePath) zip.file(relativePath, file);
  }

  const rootFolder = normalizeRelativePath(files[0]).split('/')[0] || 'folder';
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    streamFiles: true,
  });

  if (blob.size > MAX_ZIP_SIZE) {
    throw new Error('File ZIP sau khi nén vượt quá giới hạn upload 50 MB.');
  }

  return new File([blob], safeArchiveName(rootFolder), {
    type: 'application/zip',
    lastModified: Date.now(),
  });
}
