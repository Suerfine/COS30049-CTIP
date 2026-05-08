import { Router } from "express";
import { body } from "express-validator";
import { auth } from "../middelware/Auth";
import { isAdmin } from "../middelware/Role";
import { validate } from "../middelware/Validate";
import { createUploader } from "../config/multer";
import * as ArModelController from "../controllers/ArModelController";

const arModelRouter = Router();

// Increased maxSizeMB to 200
const uploadArModel = createUploader({
  allowedMimeTypes: [
    "model/gltf-binary",
    "model/gltf+json",
    "application/octet-stream",
    "application/json",
  ],
  maxSizeMB: 200,
});

const uploadPattern = createUploader({
  allowedMimeTypes: ["text/plain", "application/octet-stream"],
  maxSizeMB: 1,
});

arModelRouter.post(
  "/",
  auth,
  isAdmin,
  uploadArModel.single("model"),
  [body("title").isString().notEmpty(), body("description").optional().isString()],
  validate,
  ArModelController.createArModel,
);

arModelRouter.get("/", auth, isAdmin, ArModelController.getAllArModels);
arModelRouter.get("/:id", ArModelController.getArModelById);
arModelRouter.delete("/:id", auth, isAdmin, ArModelController.deleteArModel);

arModelRouter.post(
  "/:id/pattern",
  auth,
  isAdmin,
  uploadPattern.single("pattern"),
  ArModelController.uploadPattern,
);

export default arModelRouter;