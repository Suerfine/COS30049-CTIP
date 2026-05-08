import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

/* =========================
   TYPES
========================= */

type AccessType = "public" | "private";

type UploadOptions = {
  access: AccessType; // public or private
  subfolder: string; // e.g. "avatars", "documents/user123"
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

// Ensure directory exists
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Build full path
const buildPath = (access: AccessType, subfolder: string) => {
  return path.join("uploads", access, subfolder);
};

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
    access,
    subfolder,
    allowedMimeTypes = DEFAULT_MIME_TYPES,
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
  } = options;

  const uploadPath = buildPath(access, subfolder);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      ensureDir(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, unique + ext);
    },
  });

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
    access: "public",
    subfolder: "avatars",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeMB: 5,
  });

export const uploadDocument = (subfolder: string) =>
  createUploader({
    access: "private",
    subfolder,
    allowedMimeTypes: ["application/pdf"],
    maxSizeMB: 10,
  });
