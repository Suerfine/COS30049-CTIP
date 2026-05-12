/**
 * StorageService provides an abstraction for file storage operations, allowing
 * for different implementations (e.g., local disk, cloud storage) without changing
 * the code that uses it. It defines methods for saving and deleting files, and the
 * getStorage function returns a singleton instance of the StorageService implementation.
 * Currently, it uses DiskStorageService which saves files to the local filesystem under
 * a "storage" directory.
 */

import { DiskStorageService } from "./DiskStorageService";
import { StorageService } from "./StorageService";

let storage: StorageService;

export const getStorage = (): StorageService => {
  if (!storage) {
    // Define here to allow easy swapping of storage implementations in the future (e.g., S3StorageService)
    storage = new DiskStorageService();
  }
  return storage;
};
