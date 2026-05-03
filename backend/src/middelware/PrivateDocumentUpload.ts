import { randomUUID } from "crypto";
import fs from "fs";
import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";

export const PRIVATE_UPLOAD_STORAGE_PATH =
  process.env.PRIVATE_UPLOAD_STORAGE_PATH ||
  path.resolve(__dirname, "../../storage/uploads/private");

export type UploadPrivateDocumentOptions = {
  subfolder?: string;
  allowedMimeTypes?: string[];
};

const createPrivateStorage = (subfolder?: string) => {
  const uploadPath = subfolder
    ? path.join(PRIVATE_UPLOAD_STORAGE_PATH, subfolder)
    : PRIVATE_UPLOAD_STORAGE_PATH;

  fs.mkdirSync(uploadPath, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
      const safeOriginalName = file.originalname
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_");
      cb(null, `${randomUUID()}-${safeOriginalName}`);
    },
  });
};

const createFileFilter = (allowedMimeTypes: string[]) => {
  return (
    _req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback,
  ) => {
    if (
      allowedMimeTypes.length > 0 &&
      !allowedMimeTypes.includes(file.mimetype)
    ) {
      callback(new Error(`Unsupported file type: ${file.mimetype}`));
      return;
    }

    callback(null, true);
  };
};

/**
 * Middleware for handling private document uploads. Files will be stored in a secure location and can be accessed only by authorized users. The middleware allows for optional subfolder organization and MIME type restrictions to ensure that only specific types of documents are uploaded.
 * @param options - Configuration options for the private document upload, including subfolder and allowed MIME types.
 * @param options.subfolder - Optional subfolder within the private storage directory to organize uploaded documents.
 * @param options.allowedMimeTypes - Optional array of allowed MIME types for uploaded documents. If provided, only files with these MIME types will be accepted.
 * @returns Multer instance configured for private document uploads.
 */
export const uploadPrivateDocument = ({
  subfolder,
  allowedMimeTypes = [],
}: UploadPrivateDocumentOptions = {}) =>
  multer({
    storage: createPrivateStorage(subfolder),
    fileFilter: createFileFilter(allowedMimeTypes),
  });
