// src/services/storage/DiskStorageService.ts
import fs from "fs/promises";
import path from "path";
import { StorageService, SaveFileOptions } from "./StorageService";
import { logger } from "sequelize/lib/utils/logger";

export class DiskStorageService implements StorageService {
  private basePath = path.join(process.cwd(), "storage");

  async save({
    buffer,
    filename,
    folder = "public",
    subfolder = "",
  }: SaveFileOptions) {
    const targetDir = path.join(this.basePath, folder, subfolder);
    await fs.mkdir(targetDir, { recursive: true });
    const filePath = path.join(targetDir, filename);
    await fs.writeFile(filePath, buffer);

    // return relative path (store this in DB)
    return path.relative(this.basePath, filePath);
  }

  async delete(filePath: string) {
    const fullPath = path.join(this.basePath, filePath);

    try {
      await fs.unlink(fullPath);
    } catch (err) {
      // Avoid crashing if file doesn't exist
      console.warn("File deletion failed:", err);
    }
  }

  async exists(filePath: string) {
    const fullPath = path.join(this.basePath, filePath);
    logger.warn("Checking file existence:" + fullPath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async retrieve(filePath: string) {
    const fullPath = path.join(this.basePath, filePath);
    return await fs.readFile(fullPath);
  }

  fullPath(filePath: string) {
    return path.join(this.basePath, filePath);
  }
}
