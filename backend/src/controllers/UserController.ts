import { Request, Response, NextFunction } from "express";
import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";
import { User } from "../models";
import {
  CreateUserRequest,
  GetAllUserRequest,
  UpdateUserRequest,
  UserResponse,
} from "../types/User";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { PaginateRequestParams, PaginateResponse } from "../types/common";
import { UserRoles } from "../enum/UserRoles";
import { hashPassword } from "../utils/password";

const USER_PFP_DIR = path.resolve(process.cwd(), "storage/public/user/pfp");
const PFP_MAX_WIDTH = Number(process.env.PFP_MAX_WIDTH) || 512;
const PFP_MAX_HEIGHT = Number(process.env.PFP_MAX_HEIGHT) || 512;
const SUPPORTED_PFP_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extensionForMimeType(mimeType: string): string {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }
  if (mimeType === "image/png") {
    return "png";
  }
  if (mimeType === "image/webp") {
    return "webp";
  }
  if (mimeType === "image/gif") {
    return "gif";
  }

  return "";
}

async function saveUserProfilePicture(
  userId: number,
  file?: Express.Multer.File,
): Promise<void> {
  if (!file) {
    return;
  }

  if (!SUPPORTED_PFP_MIME_TYPES.has(file.mimetype)) {
    throw new Error("Unsupported profile image type");
  }

  const extension = extensionForMimeType(file.mimetype);
  if (!extension) {
    throw new Error("Unsupported profile image type");
  }

  await fs.mkdir(USER_PFP_DIR, { recursive: true });

  // Keep a single active profile picture per user regardless of extension.
  const existingFiles = await fs.readdir(USER_PFP_DIR);
  const existingUserFiles = existingFiles.filter((name) =>
    name.startsWith(`${userId}.`),
  );
  await Promise.all(
    existingUserFiles.map((name) => fs.unlink(path.join(USER_PFP_DIR, name))),
  );

  const destination = path.join(USER_PFP_DIR, `${userId}.${extension}`);
  await sharp(file.buffer)
    .resize({
      width: PFP_MAX_WIDTH,
      height: PFP_MAX_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toFile(destination);
}

function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
    role: user.role,
    identification: user.identification,
    personal_email:user.personal_email,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export const getAllUsers = async (
  req: Request<PaginateRequestParams>,
  res: Response<PaginateResponse<UserResponse>>,
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
      users.data.map(toUserResponse),
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
    next(err);
  }
};

export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response<UserResponse | any>,
  next: NextFunction,
) => {
  User.findByPk(req.params.id)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(toUserResponse(user));
    })
    .catch((err) => {
      return res
        .status(500)
        .json({ message: "Internal server error\n" + err.message });
    });
};

export const getCurrentUser = async (
  req: Request & { user?: User },
  res: Response<UserResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.json(toUserResponse(req.user));
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  // Soft delete by setting deleted_at to current timestamp
  User.update({ deleted_at: new Date() }, { where: { id: req.params.id } })
    .then(([affectedRows]) => {
      if (affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    })
    .catch((err) => {
      return res
        .status(500)
        .json({ message: "Internal server error\n" + err.message });
    });
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
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const targetUser = await User.findByPk(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isAdmin = currentUser.role === UserRoles.ADMIN;
    const isSelf = currentUser.id === targetUser.id;

    if (!isAdmin && !isSelf) {
      return res
        .status(403)
        .json({ message: "You can only update your own account" });
    }

    if (!isAdmin && req.body.role && req.body.role !== targetUser.role) {
      return res
        .status(403)
        .json({ message: "You are not allowed to change role" });
    }

    const updates: Partial<User> = {};

    if (
      typeof req.body.username === "string" &&
      req.body.username.trim() !== ""
    ) {
      // Checking if the new username already exists for another user
      const existingUsername = await User.findOne({
        where: { username: req.body.username },
      });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
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
        return res
          .status(400)
          .json({ message: "Identification already exists" });
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

    if (
      typeof req.body.password === "string" &&
      req.body.password.trim() !== ""
    ) {
      updates.password_hash = await hashPassword(req.body.password);
    }

    if (isAdmin && req.body.role) {
      updates.role = req.body.role;
    }

    if (Object.keys(updates).length === 0 && !req.file) {
      return res
        .status(400)
        .json({ message: "No valid fields provided to update" });
    }

    await targetUser.update(updates);
    await saveUserProfilePicture(targetUser.id, req.file);

    return res.json(toUserResponse(targetUser));
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
  } = req.body;
  try {
    if (
      typeof firstname !== "string" ||
      firstname.trim() === "" ||
      typeof lastname !== "string" ||
      lastname.trim() === ""
    ) {
      return res.status(400).json({
        message: "firstname and lastname are required",
      });
    }

    const user_firstname = firstname.trim();
    const user_lastname = lastname.trim();
    const user_identification = identification?.trim();
    const user_personal_email = personal_email?.trim();

    if (!user_identification || !user_personal_email) {
      return res.status(400).json({
        message: "identification and personal_email are required",
      });
    }

    // Checking if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    //Checking if identification already exists
    const existingIdentification = await User.findOne({
      where: { identification: user_identification },
    });
    if (existingIdentification) {
      return res.status(400).json({ message: "Identification already exists" });
    }

    // Hash the password before storing it in the database
    const hashedPassword = await hashPassword(password);

    // Create the new user in the database
    const newUser = await User.create({
      username: username,
      password_hash: hashedPassword,
      role: role,
      firstname: user_firstname,
      lastname: user_lastname,
      identification: user_identification,
      personal_email: user_personal_email,
    });

    await saveUserProfilePicture(newUser.id, req.file);

    // Return the created user (excluding the password hash)
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      role: newUser.role,
      identification: newUser.identification,
      personal_email:newUser.personal_email,
      last_login_at: newUser.last_login_at,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
    });
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.toLowerCase().includes("profile image")
    ) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: "Internal server error\n" + err });
  }
};
