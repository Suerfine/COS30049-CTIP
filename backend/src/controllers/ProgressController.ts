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
import {Course, Module, Page, Element, Submission, Enrollment} from "../models";
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

const calculateProgress = async (userId: number, courseId: number, moduleId?: number) => {
  const whereClause: any = { course_id: courseId };
  if (moduleId) whereClause.id = moduleId;

  const modules = await Module.findAll({
    where: whereClause,
    subQuery: false, 
    include: [{
      model: Page,
      as: 'pages',
      include: [{
        model: Element,
        as: 'elements',
        include: [{
          model: Submission,
          as: 'submissions',
          required: false,
          include: [{
            model: Enrollment,
            as: 'enrollment',
            where: { user_id: userId }, 
            required: false 
          }]
        }]
      }]
    }]
  });

  let totalEarned = 0;
  let totalPossible = 0;

  modules.forEach((m) => {
    m.pages?.forEach((p) => {
      p.elements?.forEach((e) => {
        const elementScore = Number(e.score) || 0;
        totalPossible += elementScore;

        const hasValidSubmission = e.submissions?.some(sub => 
            sub.enrollment && Number(sub.enrollment.user_id) === Number(userId)
        );

        if (hasValidSubmission) {
          totalEarned += elementScore;
        }
      });
    });
  });

  return { 
    score: totalEarned, 
    maxScore: totalPossible 
  };
};

export const courseProgress = async (
  req: Request<{ courseId: string }>,
  res: Response<ProgressResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id; 
    if (!userId) throw new HttpError(401, "Unauthorized");

    const courseId = Number(req.params.courseId);
    if (isNaN(courseId)) throw new HttpError(400, "Invalid Course ID");

    const result = await calculateProgress(userId, courseId);
    return res.status(200).json(result);
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
    const userId = req.user?.id;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const moduleId = Number(req.params.moduleId);
    const courseId = Number(req.query.courseId); 
    
    if (isNaN(moduleId) || isNaN(courseId)) {
        throw new HttpError(400, "Module ID and Course ID are required");
    }

    const result = await calculateProgress(userId, courseId, moduleId);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const elementProgress = async (
  req: Request<{ elementId: string }>,
  res: Response<ProgressResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const elementId = Number(req.params.elementId);
    if (isNaN(elementId)) throw new HttpError(400, "Invalid Element ID");

    const element = await Element.findByPk(elementId, {
      include: [{
        model: Submission,
        as: 'submissions',
        required: false,
        include: [{
          model: Enrollment,
          as: 'enrollment',
          where: { user_id: userId },
          required: false
        }]
      }]
    });

    if (!element) throw new HttpError(404, "Element not found");

    const maxScore = Number(element.score) || 0;
    
    const userSubmissions = element.submissions?.filter(sub => 
      sub.enrollment && Number(sub.enrollment.user_id) === Number(userId)
    ) || [];

    const earned = userSubmissions.reduce((sum, sub) => {
      return sum + (Number(sub.earned_grade) || 0);
    }, 0);

    return res.status(200).json({
      score: Number(earned),
      maxScore: maxScore,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};