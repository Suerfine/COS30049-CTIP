import { Request, Response, NextFunction } from "express";
import { User } from "../models";
import { GetAllUserRequest, UserResponse } from "../types/User";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { PaginateResponse } from "../types/common";

export const getAllUsers = async (
  req: Request<GetAllUserRequest>,
  res: Response<PaginateResponse<UserResponse>>,
  next: NextFunction,
) => {
  try {
    const users = await paginateModel(User, req.query);
    const baseUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const formattedResponse = formatPaginateResponse(
      users.data.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      })),
      req.query,
      true,
      {
        page: users.page,
        size: users.size,
        totalElements: users.totalElements,
        totalPages: users.totalPages,
        baseUrl,
      }
    );
    res.json(formattedResponse);
  } catch (err) {
    next(err);
  }
};
