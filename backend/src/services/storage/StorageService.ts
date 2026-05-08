// src/services/storage/StorageService.ts
export interface SaveFileOptions {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  folder?: "public" | "private";
  subfolder?: string; // e.g. "avatars", "documents/user123"
}

export interface StorageService {
  save(file: SaveFileOptions): Promise<string>;
  delete(filePath: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  fullPath(filePath: string): string; // Optional helper to get full path from relative
}
