import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

/* =========================
   TYPES
========================= */

type AccessType = "public" | "private";

type UploadOptions = {
  allowedMimeTypes?: string[]; // override allowed types
  maxSizeMB?: number; // override size
};

/* =========================
   DEFAULT CONFIG
========================= */

// Default allowed types (safe baseline)
const DEFAULT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Default max size
const DEFAULT_MAX_SIZE_MB = 5;

/* =========================
   HELPERS
========================= */
// File filter factory
const createFileFilter = (allowedMimeTypes: string[]) => {
  return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error(`Invalid file type. Allowed: ${allowedMimeTypes.join(", ")}`),
      );
    }
    cb(null, true);
  };
};

/* =========================
   MAIN FACTORY
========================= */

export const createUploader = (options: UploadOptions) => {
  const {
    allowedMimeTypes = DEFAULT_MIME_TYPES,
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
  } = options;

  const storage = multer.memoryStorage();

  return multer({
    storage,
    fileFilter: createFileFilter(allowedMimeTypes),
    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
    },
  });
};

/* =========================
   PRESET HELPERS (OPTIONAL)
========================= */

// Common presets so you don’t repeat yourself

export const uploadAvatar = () =>
  createUploader({
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeMB: 5,
  });

export const uploadDocument = () =>
  createUploader({
    allowedMimeTypes: ["application/pdf"],
    maxSizeMB: 10,
  });
