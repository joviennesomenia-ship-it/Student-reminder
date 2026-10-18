export interface UploadInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  extension: string; // lowercase, with dot, e.g. ".pdf"
}

export interface StoredFile {
  url: string; // public URL students open
  key: string; // what the driver needs to delete it later
}

/** Implement this interface to add another storage provider (for example S3). */
export interface StorageDriver {
  save(file: UploadInput): Promise<StoredFile>;
  remove(key: string): Promise<void>;
}
