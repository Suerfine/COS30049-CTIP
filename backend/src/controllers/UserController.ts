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
import { Op } from "sequelize";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toUserResponse(user: User, req: Request<any>): UserResponse {
  const full_url_pfp = user.pfp_url
    ? `${req.protocol}://${req.get("host")}/${user.pfp_url.replace(/\\/g, '/')}`
    : null;

  return {
    id: user.id,
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
    role: user.role,
    identification: user.identification,
    personal_email: user.personal_email,
    tel: user.tel,
    pfp_url: full_url_pfp,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export const getAllUsers = async (
  req: Request<PaginateRequestParams>,
  res: Response<PaginateResponse<UserResponse> | { message: string }>,
  next: NextFunction,
) => {
  try {
    const isDeletedRaw = req.query.isDeleted;
    const includeDeleted =
      (typeof isDeletedRaw === "string" &&
        isDeletedRaw.toLowerCase() === "true") ||
      (typeof isDeletedRaw === "boolean" && isDeletedRaw === true);

    const users = await paginateModel(User, req.query, {
      paranoid: !includeDeleted,
    });
    const baseUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const formattedResponse = formatPaginateResponse(
      users.data.map((user) => toUserResponse(user, req)),
      req.query,
      true,
      {
        page: users.page,
        size: users.size,
        totalElements: users.totalElements,
        totalPages: users.totalPages,
        baseUrl,
      },
    );
    res.json(formattedResponse);
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response<UserResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return res.status(200).json(toUserResponse(user, req));
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const searchUsersByUsername = async (
  req: Request<{ name: string; limit: string }>,
  res: Response<UserResponse[] | { message: string }>,
  next: NextFunction,
) => {
  try {
    const name = req.params.name;
    const limit = parseInt(req.params.limit) || 10;
    const users = await User.findAll({
      where: {
        username: {
          [Op.like]: `%${name}%`,
        },
      },
      limit,
    });
    return res.status(200).json(users.map((user) => toUserResponse(user, req)));
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response<UserResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    return res.status(200).json(toUserResponse(req.user, req));
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    await user.destroy();
    return res.status(200).send();
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const upsertUser = async (
  req: Request<{ id: string }, unknown, UpdateUserRequest> & {
    user?: User;
    file?: Express.Multer.File;
  },
  res: Response<UserResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    // Authorization logic to check if the current user is admin or updating their own account
    const targetUser = await User.findByPk(req.params.id);
    const isAdmin = req.user?.role === UserRoles.ADMIN;
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!isAdmin && req.user?.id !== targetUser.id) {
      throw new HttpError(403, "You can only update your own account");
    }

    if (!isAdmin && req.body.role && req.body.role !== targetUser.role) {
      throw new HttpError(403, "You are not allowed to change role");
    }

    // Build the update object based on provided fields
    const updates: Partial<User> = {};
    if (
      typeof req.body.username === "string" &&
      req.body.username.trim() !== ""
    ) {
      // Checking if the new username already exists for another user
      const existingUsername = await User.findOne({
        where: { username: req.body.username, id: { $ne: targetUser.id } },
      });
      if (existingUsername) {
        throw new HttpError(400, "Username already exists");
      }
      // Only update username if it's provided and not empty
      updates.username = req.body.username;
    }
    if (
      typeof req.body.firstname === "string" &&
      req.body.firstname.trim() !== ""
    ) {
      updates.firstname = req.body.firstname;
    }
    if (
      typeof req.body.lastname === "string" &&
      req.body.lastname.trim() !== ""
    ) {
      updates.lastname = req.body.lastname;
    }
    if (
      typeof req.body.identification === "string" &&
      req.body.identification.trim() !== ""
    ) {
      // Checking if the new identification already exists for another user
      const existingIdentification = await User.findOne({
        where: {
          identification: req.body.identification,
          id: { $ne: targetUser.id },
        },
      });
      if (existingIdentification) {
        throw new HttpError(400, "Identification already exists");
      }

      // Only update identification if it's provided and not empty
      updates.identification = req.body.identification;
    }

    if (
      typeof req.body.personal_email === "string" &&
      req.body.personal_email.trim() !== ""
    ) {
      updates.personal_email = req.body.personal_email;
    }

    if (typeof req.body.tel === "string" && req.body.tel.trim() !== "") {
      updates.tel = req.body.tel;
    }

    if (isAdmin && req.body.role) {
      updates.role = req.body.role;
    }

    if (Object.keys(updates).length === 0 && !req.file) {
      throw new HttpError(400, "No valid fields provided to update");
    }
    await targetUser.update(updates);

    // Handle profile picture update if a new file is provided
    if (req.file) {
      const storage = getStorage();
      const path = await storage.save({
        buffer: req.file.buffer,
        filename: "avatar." + req.file.originalname.split(".").pop(), // preserve original file extension
        mimeType: req.file.mimetype,
        folder: "public",
        subfolder: `users/${targetUser.id}/pfp`,
      });
      targetUser.pfp_url = path.replace(/\\/g, '/'); // normalize before saving
      await targetUser.save();
    }

    return res.status(200).json(toUserResponse(targetUser, req));
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (
  req: Request<{ id: string }, unknown, ChangePasswordRequest> & {
    user?: User;
  },
  res: Response<{ message: string }>,
  next: NextFunction,
) => {
  try {
    //Check if the user exists
    const targetUser = await User.findByPk(req.params.id);
    if (!targetUser) {
      throw new HttpError(404, "User not found");
    }
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }
    if (req.user.id !== targetUser.id) {
      throw new HttpError(403, "You can only change your own password");
    }

    // Check if their old password is correct
    const oldPasswordMatches = verifyPassword(
      req.body.old_password,
      targetUser.password_hash,
    );
    if (!oldPasswordMatches) {
      throw new HttpError(400, "Old password is incorrect");
    }

    //Check if the new password is different from the current password
    const newPasswordMatchesCurrent = verifyPassword(
      req.body.new_password,
      targetUser.password_hash,
    );
    if (newPasswordMatchesCurrent) {
      throw new HttpError(
        400,
        "New password must be different from current password",
      );
    }

    // Hash the new password and update the user's password in the database
    targetUser.password_hash = await hashPassword(req.body.new_password);
    await targetUser.save();
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (
  req: Request<{}, {}, CreateUserRequest> & { file?: Express.Multer.File },
  res: Response<UserResponse | { message: string }>,
  next: NextFunction,
) => {
  const {
    username,
    password,
    role,
    firstname,
    lastname,
    identification,
    personal_email,
    tel,
  } = req.body;
  try {
    const storage = getStorage();
    const user_username = username.trim();
    const user_firstname = firstname.trim();
    const user_lastname = lastname.trim();
    const user_identification = identification.trim();
    const user_personal_email = personal_email.trim();
    const user_tel = tel.trim();

    // Only allow admin to create a user using this route
    if (!req.user || req.user.role !== UserRoles.ADMIN) {
      throw new HttpError(
        403,
        "Only admin can create new user. Public has to do so through registration route.",
      );
    }

    // Checking if username already exists
    const existingUser = await User.findOne({
      where: { username: user_username },
    });
    if (existingUser) {
      throw new HttpError(400, "Username already exists");
    }

    //Checking if identification already exists
    const existingIdentification = await User.findOne({
      where: { identification: user_identification },
    });
    if (existingIdentification) {
      throw new HttpError(400, "Identification already exists");
    }

    //Checking if the email already exists
    const existingEmail = await User.findOne({
      where: { personal_email: user_personal_email },
    });
    if (existingEmail) {
      throw new HttpError(400, "Email already exists");
    }

    // Hash the password before storing it in the database
    const hashedPassword = await hashPassword(password);

    // Create the new user in the database
    const newUser = await User.create({
      username: user_username,
      password_hash: hashedPassword,
      role: role,
      firstname: user_firstname,
      lastname: user_lastname,
      identification: user_identification,
      personal_email: user_personal_email,
      tel: user_tel,
    });

    // Save the profile picture if provided
    if (req.file) {
      const path = await storage.save({
        buffer: req.file.buffer,
        filename: "avatar." + req.file.originalname.split(".").pop(), // preserve original file extension
        mimeType: req.file.mimetype,
        folder: "public",
        subfolder: `users/${newUser.id}/pfp`,
      });
      newUser.pfp_url = path.replace(/\\/g, '/'); // normalize before saving
      await newUser.save();
    }

    return res.status(201).json(toUserResponse(newUser, req));
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};
