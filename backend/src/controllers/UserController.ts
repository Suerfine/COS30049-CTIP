import { Request, Response, NextFunction } from "express";
import { User, Registration} from "../models";
import { CreateUserRequest, GetAllUserRequest, UpdateUserRequest, UserResponse } from "../types/User";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { PaginateRequestParams, PaginateResponse } from "../types/common";
import { UserRoles } from "../enum/UserRoles";
import { hashPassword } from "../utils/password";

function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
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
    const users = await paginateModel(User, req.query);
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
      }
    );
    res.json(formattedResponse);
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req: Request<{ id: string }>, res: Response<UserResponse|any>, next: NextFunction) => {
  User.findByPk(req.params.id)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(toUserResponse(user));
    }
    ).catch((err) => {
      return res.status(500).json({ message: "Internal server error\n"+ err.message });
    });
};

export const deleteUser = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  // Soft delete by setting deleted_at to current timestamp
  User.update(
    { deleted_at: new Date() },
    { where: { id: req.params.id } }
  ).then(([affectedRows]) => {
      if (affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    }
    ).catch((err) => {
      return res.status(500).json({ message: "Internal server error\n"+ err.message });
    }
  );
}

export const upsertUser = async (
  req: Request<{ id: string }, unknown, UpdateUserRequest>,
  res: Response<UserResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const currentUser = req.user as User | undefined;

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
      return res.status(403).json({ message: "You can only update your own account" });
    }

    if (!isAdmin && req.body.role && req.body.role !== targetUser.role) {
      return res.status(403).json({ message: "You are not allowed to change role" });
    }

    const updates: Partial<User> = {};

    if (typeof req.body.username === "string" && req.body.username.trim() !== "") {
      updates.username = req.body.username;
    }

    if (typeof req.body.identification === "string" && req.body.identification.trim() !== "") {
      updates.identification = req.body.identification;
    }

    if (typeof req.body.personal_email === "string" && req.body.personal_email.trim() !== "") {
      updates.personal_email = req.body.personal_email;
    }

    if (typeof req.body.password === "string" && req.body.password.trim() !== "") {
      updates.password_hash = await hashPassword(req.body.password);
    }

    if (isAdmin && req.body.role) {
      updates.role = req.body.role;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided to update" });
    }

    await targetUser.update(updates);

    return res.json(toUserResponse(targetUser));
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req: Request<{},{},CreateUserRequest>, res: Response<UserResponse|{"message": string}>, next: NextFunction) => {
  const { username, password, role, registration_id, identification, personal_email } = req.body;
  try {
    let user_identification:string = "";
    let user_personal_email:string = "";

    // Checking if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    // If the user being created is not an admin then we need to check if the registration_id is valid
    if (role !== UserRoles.ADMIN) {
      if (!registration_id) {
        return res.status(400).json({ message: "registration_id is required for non-admin users" });
      }
      // Check if the registration_id exists in the database
      const registration = await Registration.findByPk(registration_id);
      if (!registration) {
        return res.status(400).json({ message: "Invalid registration_id" });
      }
      user_identification = registration.identification;
      user_personal_email = registration.personal_email;
    } else {
      // If the user is an admin, we need to check for identification and personal_email
      if (!identification || !personal_email) {
        return res.status(400).json({ message: "identification and personal_email are required for admin users" });
      }
      user_identification = identification;
      user_personal_email = personal_email;
    }

    // Hash the password before storing it in the database
    const hashedPassword = await hashPassword(password);
    
    // Create the new user in the database
    const newUser = await User.create({
      username: username,
      password_hash: hashedPassword,
      role: role,
      identification: user_identification,
      personal_email: user_personal_email,
    });
  
    // If the user was a non-admin, we should also update the registration to link it to the new user
    if (role !== UserRoles.ADMIN) {
      await Registration.update(
        { user_id: newUser.id },
        { where: { id: registration_id } }
      );
    }
    
    // Return the created user (excluding the password hash)
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error\n"+ err });
  }
};
  
