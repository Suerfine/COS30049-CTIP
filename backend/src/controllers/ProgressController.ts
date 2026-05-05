import { Request, Response, NextFunction } from "express";
import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";
import { User } from "../models";
import {
  ChangePasswordRequest,
  CreateUserRequest,
  GetAllUserRequest,
  UpdateUserRequest,
  UserResponse,
} from "../types/User";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { PaginateRequestParams, PaginateResponse } from "../types/common";
import { UserRoles } from "../enum/UserRoles";
import { hashPassword, verifyPassword } from "../utils/password";
import { getStorage } from "../services/storage";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ProgressResponse {
  score: number;
  maxScore: number;
}

export const courseProgress = async (
  req: Request<{ courseId: string }>,
  res: Response<ProgressResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    return res.status(200).json({
      score: Math.floor(Math.random() * 101), // Random score between 0 and 100
      maxScore: 100,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const moduleProgress = async (
  req: Request<{ moduleId: string }>,
  res: Response<ProgressResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    return res.status(200).json({
      score: Math.floor(Math.random() * 101),
      maxScore: 100,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const elementProgress = async (
  req: Request<{ courseId: string }>,
  res: Response<ProgressResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    return res.status(200).json({
      score: Math.floor(Math.random() * 101),
      maxScore: 100,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};
