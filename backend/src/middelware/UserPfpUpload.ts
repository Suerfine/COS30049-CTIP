import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

const PFP_MAX_FILE_SIZE =
  Number(process.env.PFP_MAX_FILE_SIZE) || 2 * 1024 * 1024;
const SUPPORTED_PFP_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const profilePictureUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: PFP_MAX_FILE_SIZE,
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback,
  ) => {
    if (!SUPPORTED_PFP_MIME_TYPES.has(file.mimetype)) {
      callback(new Error("Unsupported profile image type"));
      return;
    }

    callback(null, true);
  },
});

export default profilePictureUpload;
