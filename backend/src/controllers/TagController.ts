import { NextFunction, Request, Response } from "express";
import { Tag } from "../models";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const createTag = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tag = await Tag.create({
      title: req.body.title,
      type: req.body.type,
    });

    return res.status(201).json(tag);
  } catch (err: any) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Tag with the same title and type already exists",
      });
    }

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
};

export const getAllTags = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tags = await Tag.findAll({
      order: [["id", "DESC"]],
    });

    return res.json(tags);
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
};

export const getTagById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tag = await Tag.findByPk(req.params.id);

    if (!tag) {
      throw new HttpError(404, "Tag not found");
    }

    return res.json(tag);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
};

export const upsertTag = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tag = await Tag.findByPk(req.params.id);

    if (!tag) {
      throw new HttpError(404, "Tag not found");
    }

    const updates: Partial<Tag> = {};

    if (typeof req.body.title === "string" && req.body.title.trim() !== "") {
      updates.title = req.body.title;
    }

    if (typeof req.body.type === "string" && req.body.type.trim() !== "") {
      updates.type = req.body.type;
    }

    if (Object.keys(updates).length === 0) {
      throw new HttpError(400, "No valid fields provided to update");
    }

    await tag.update(updates);
    return res.json(tag);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    if (err?.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Tag with the same title and type already exists",
      });
    }

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
};

export const deleteTag = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tag = await Tag.findByPk(req.params.id);

    if (!tag) {
      throw new HttpError(404, "Tag not found");
    }

    await tag.destroy();
    return res.status(200).json({ message: "Tag deleted successfully" });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    return res.status(500).json({
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
};
