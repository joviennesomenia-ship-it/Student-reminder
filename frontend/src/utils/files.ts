export function fileIcon(mimeType: string | null, name: string): string {
  const n = name.toLowerCase();
  if (mimeType?.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf' || n.endsWith('.pdf')) return '📕';
  if (/\.(docx?)$/.test(n)) return '📝';
  if (/\.(pptx?)$/.test(n)) return '📊';
  if (/\.(xlsx?)$/.test(n)) return '📈';
  if (/youtu\.?be/.test(n)) return '▶️';
  return '📄';
}

export function linkIcon(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url)) return '▶️';
  if (/drive\.google|docs\.google/.test(url)) return '🗂️';
  return '🔗';
}

export function formatSize(bytes: number | null): string {
  if (bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Adds ?download=1 for files served by our own backend so the browser saves instead of previewing. */
export function downloadHref(url: string): string {
  return url.includes('/uploads/') ? `${url}${url.includes('?') ? '&' : '?'}download=1` : url;
}

// Keep in sync with the backend (services/fileValidation.ts and MAX_UPLOAD_MB).
export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
export const MAX_UPLOAD_MB = 15;

/** Returns a friendly reason the file cannot be uploaded, or null if it looks fine. */
export function checkClientFile(file: File): string | null {
  const dot = file.name.lastIndexOf('.');
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `"${file.name}" is not allowed. Use PDF, Word, PowerPoint, Excel, TXT or an image (png, jpg, gif, webp).`;
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `"${file.name}" is bigger than ${MAX_UPLOAD_MB} MB. Compress it or share a Drive link instead.`;
  }
  return null;
}
