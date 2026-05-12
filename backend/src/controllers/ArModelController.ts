import { NextFunction, Request, Response } from "express";
import path from "path";
import { ArModel } from "../models";
import { ErrorResponse, PaginateRequestParams, PaginateResponse } from "../types/common";
import { ArModelResponse, CreateArModelRequest } from "../types/ArModel";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { getStorage } from "../services/storage";

// Increased size limit to 200MB
const MAX_MODEL_SIZE_BYTES = 200 * 1024 * 1024;
const ALLOWED_MODEL_EXTENSIONS = new Set([".glb", ".gltf"]);
const ALLOWED_MODEL_MIME_TYPES = new Set([
  "model/gltf-binary",
  "model/gltf+json",
  "application/octet-stream",
  "application/json",
]);
const ALLOWED_PATTERN_EXTENSIONS = new Set([".patt"]);

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const buildPublicUrl = (req: Request, filePath?: string | null) => {
  if (!filePath) {
    return null;
  }
  const normalized = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `${req.protocol}://${req.get("host")}${normalized}`;
};

const toArModelResponse = (
  model: ArModel,
  req: Request<any, any, any, any>,
): ArModelResponse => {
  const modelUrl = buildPublicUrl(req, model.model_path) || "";
  const patternUrl = buildPublicUrl(req, model.pattern_path);
  const arViewerUrl = `${req.protocol}://${req.get("host")}/ar-viewer/${model.id}`;

  return {
    id: model.id,
    title: model.title,
    description: model.description ?? null,
    model_format: model.model_format,
    model_size_bytes: model.model_size_bytes,
    original_filename: model.original_filename,
    mime_type: model.mime_type,
    model_url: modelUrl,
    pattern_url: patternUrl,
    ar_viewer_url: arViewerUrl,
    created_by_user_id: model.created_by_user_id ?? null,
    created_at: model.created_at,
    updated_at: model.updated_at,
  };
};

const validateModelFile = (file: Express.Multer.File) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isExtAllowed = ALLOWED_MODEL_EXTENSIONS.has(ext);
  const isMimeAllowed = ALLOWED_MODEL_MIME_TYPES.has(file.mimetype);

  if (!isExtAllowed && !isMimeAllowed) {
    throw new HttpError(400, "Only .glb or .gltf files are supported");
  }

  if (file.size > MAX_MODEL_SIZE_BYTES) {
    throw new HttpError(400, "3D model exceeds the 200MB size limit");
  }

  return ext;
};

const validatePatternFile = (file: Express.Multer.File) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_PATTERN_EXTENSIONS.has(ext)) {
    throw new HttpError(400, "Only .patt pattern files are supported");
  }
  return ext;
};

export const createArModel = async (
  req: Request<{}, {}, CreateArModelRequest> & { file?: Express.Multer.File },
  res: Response<ArModelResponse | ErrorResponse>,
  next: NextFunction,
) => {
  try {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const description =
      typeof req.body.description === "string" && req.body.description.trim() !== ""
        ? req.body.description.trim()
        : null;

    if (!title) {
      throw new HttpError(400, "Title is required");
    }

    if (!req.file) {
      throw new HttpError(400, "3D model file is required");
    }

    const ext = validateModelFile(req.file);

    const storage = getStorage();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `ar_model_${uniqueSuffix}${ext}`;

    const modelPath = await storage.save({
      buffer: req.file.buffer,
      filename,
      mimeType: req.file.mimetype,
      folder: "public",
      subfolder: "ar/models",
    });

    const model = await ArModel.create({
      title,
      description,
      model_path: modelPath,
      model_format: ext.replace(".", ""),
      model_size_bytes: req.file.size,
      mime_type: req.file.mimetype,
      original_filename: req.file.originalname,
      created_by_user_id: req.user?.id ?? null,
    });

    return res.status(201).json(toArModelResponse(model, req));
  } catch (err: any) {
    console.error("=== DATABASE INSERTION ERROR ===");
    console.error("Database Error Name:", err?.name);
    console.error("Database Error Message:", err?.message);
    console.error("Full Error Object:", err);
    console.error("================================");
    
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

export const getAllArModels = async (
  req: Request<PaginateRequestParams>,
  res: Response<PaginateResponse<ArModelResponse> | ErrorResponse>,
  next: NextFunction,
) => {
  try {
    const models = await paginateModel(ArModel, req.query);
    const baseUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

    const formatted = formatPaginateResponse(
      models.data.map((model) => toArModelResponse(model, req)),
      req.query,
      true,
      {
        page: models.page,
        size: models.size,
        totalElements: models.totalElements,
        totalPages: models.totalPages,
        baseUrl,
      },
    );

    return res.json(formatted);
  } catch (err) {
    next(err);
  }
};

export const getArModelById = async (
  req: Request<{ id: string }>,
  res: Response<ArModelResponse | ErrorResponse>,
  next: NextFunction,
) => {
  try {
    const modelId = Number(req.params.id);
    if (!Number.isFinite(modelId)) {
      throw new HttpError(400, "Invalid model id");
    }

    const model = await ArModel.findByPk(modelId);
    if (!model) {
      throw new HttpError(404, "AR model not found");
    }

    return res.json(toArModelResponse(model, req));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

export const uploadPattern = async (
  req: Request<{ id: string }> & { file?: Express.Multer.File },
  res: Response<ArModelResponse | ErrorResponse>,
  next: NextFunction,
) => {
  try {
    const modelId = Number(req.params.id);
    if (!Number.isFinite(modelId)) {
      throw new HttpError(400, "Invalid model id");
    }

    const model = await ArModel.findByPk(modelId);
    if (!model) {
      throw new HttpError(404, "AR model not found");
    }

    if (!req.file) {
      throw new HttpError(400, "Pattern file is required");
    }

    const ext = validatePatternFile(req.file);

    const storage = getStorage();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `ar_pattern_${model.id}_${uniqueSuffix}${ext}`;

    const patternPath = await storage.save({
      buffer: req.file.buffer,
      filename,
      mimeType: req.file.mimetype,
      folder: "public",
      subfolder: "ar/patterns",
    });

    model.pattern_path = patternPath;
    await model.save();

    return res.json(toArModelResponse(model, req));
  } catch (err: any) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};

export const deleteArModel = async (
  req: Request<{ id: string }>,
  res: Response<{ message: string } | ErrorResponse>,
  next: NextFunction,
) => {
  try {
    const modelId = Number(req.params.id);
    if (!Number.isFinite(modelId)) {
      throw new HttpError(400, "Invalid model id");
    }

    const model = await ArModel.findByPk(modelId);
    if (!model) {
      throw new HttpError(404, "AR model not found");
    }

    await model.destroy();

    return res.json({ message: "AR model deleted successfully" });
  } catch (err: any) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
};