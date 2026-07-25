const MAX_SOURCE_SIZE = 250 * 1024 * 1024;
const MAX_ZIP_SIZE = 50 * 1024 * 1024;
const MAX_FILE_COUNT = 5_000;

type FileHandleLike = {
  kind: 'file';
  name: string;
  getFile: () => Promise<File>;
};

type DirectoryHandleLike = {
  kind: 'directory';
  name: string;
  values: () => AsyncIterableIterator<FileHandleLike | DirectoryHandleLike>;
};

type FolderEntry = {
  file: File;
  relativePath: string;
};

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options?: { id?: string; mode?: 'read' | 'readwrite' }) => Promise<DirectoryHandleLike>;
};

const safeArchiveName = (name: string) => {
  const sanitized = Array.from(name, (character) => (
    character.charCodeAt(0) < 32 || /[<>:"/\\|?*]/.test(character) ? '_' : character
  )).join('').trim();
  return `${sanitized || 'folder'}.zip`;
};

const normalizeRelativePath = (relativePath: string) => {
  return relativePath.replaceAll('\\', '/')
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/');
};

const collectDirectoryFiles = async (
  directory: DirectoryHandleLike,
  parentPath: string,
  entries: FolderEntry[]
) => {
  for await (const handle of directory.values()) {
    const relativePath = `${parentPath}/${handle.name}`;
    if (handle.kind === 'file') {
      entries.push({ file: await handle.getFile(), relativePath });
    } else {
      await collectDirectoryFiles(handle, relativePath, entries);
    }
  }
};

const createZip = async (entries: FolderEntry[], rootFolder: string): Promise<File> => {
  if (entries.length === 0) {
    throw new Error('Thư mục không có tệp để gửi.');
  }
  if (entries.length > MAX_FILE_COUNT) {
    throw new Error(`Thư mục có quá nhiều tệp. Giới hạn hiện tại là ${MAX_FILE_COUNT.toLocaleString('vi-VN')} tệp.`);
  }

  const sourceSize = entries.reduce((total, entry) => total + entry.file.size, 0);
  if (sourceSize > MAX_SOURCE_SIZE) {
    throw new Error('Tổng dung lượng thư mục vượt quá 250 MB nên không thể nén an toàn trên trình duyệt.');
  }

  // Load the compressor only when the user actually selects a folder.
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const entry of entries) {
    const relativePath = normalizeRelativePath(entry.relativePath);
    if (relativePath) zip.file(relativePath, entry.file);
  }

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
};

export const supportsDirectoryPicker = () => (
  typeof (window as DirectoryPickerWindow).showDirectoryPicker === 'function'
);

export async function pickAndZipFolder(): Promise<File> {
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
  if (!picker) {
    throw new Error('Trình duyệt không hỗ trợ chọn thư mục trực tiếp.');
  }

  const directory = await picker({ id: 'nextalk-folder-upload', mode: 'read' });
  const entries: FolderEntry[] = [];
  await collectDirectoryFiles(directory, directory.name, entries);
  return createZip(entries, directory.name);
}

export async function zipFolder(files: File[]): Promise<File> {
  if (files.some((file) => !file.webkitRelativePath)) {
    throw new Error('Trình duyệt này không cung cấp đường dẫn thư mục. Hãy thử lại bằng Chrome hoặc Edge.');
  }

  const entries = files.map((file) => ({
    file,
    relativePath: file.webkitRelativePath,
  }));
  const rootFolder = normalizeRelativePath(files[0]?.webkitRelativePath ?? '').split('/')[0] || 'folder';
  return createZip(entries, rootFolder);
}
