import multer from "multer";
import path from "path";

const PUBLIC_UPLOAD_STORAGE_PATH =
  process.env.PUBLIC_UPLOAD_STORAGE_PATH ||
  path.resolve(__dirname, "../../storage/uploads/public");

// PUBLIC storage
const publicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PUBLIC_UPLOAD_STORAGE_PATH);
  },
  filename: (_, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const uploadPublic = multer({ storage: publicStorage });
