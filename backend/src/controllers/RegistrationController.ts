import { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Registration } from "../models";
import { DatabaseError, Op, ValidationError } from "sequelize";
import { PaginateRequestParams, PaginateResponse } from "../types/common";
import {
  CreateRegistrationRequest,
  RegistrationResponse,
  UpdateRegistrationRequest,
} from "../types/Registration";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { RegistrationStatus } from "../enum/RegistrationStatus";
import { User } from "../models";
import { UserRoles } from "../enum/UserRoles";
import {
  ApproveRegistrationRequest,
  RejectRegistrationRequest,
  ApproveRegistrationResponse,
} from "../types/Registration";
import { hashPassword } from "../utils/password";
import { PRIVATE_UPLOAD_STORAGE_PATH } from "../middelware/PrivateDocumentUpload";
import { UserResponse } from "../types/User";
import { getStorage } from "../services/storage";
import { th } from "@faker-js/faker";
import { sendNotification } from "../utils/sendNotification";
import { logger } from "../utils/logger";
import sequelize from "../config/Database";
import { NotificationCategory } from "../enum/NotificationCategory";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toUserResponse(user: User, req: Request<any>): UserResponse {
  let full_url_pfp = user.pfp_url
    ? `${req.protocol}:\\${req.get("host")}\\${user.pfp_url}`
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
    totp_enabled: user.totp_enabled ?? false,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function toRegistrationResponse(
  registration: Registration,
): RegistrationResponse {
  return {
    id: registration.id,
    user_id: registration.user_id,
    reviewed_by_user_id: registration.reviewed_by_user_id,
    status: registration.status,
    firstname: registration.firstname,
    lastname: registration.lastname,
    identification: registration.identification,
    personal_email: registration.personal_email,
    tel: registration.tel,
    admin_remark: registration.admin_remark,
    reviewed_at: registration.reviewed_at,
    created_at: registration.created_at,
    updated_at: registration.updated_at,
  };
}

export const createRegistration = async (
  req: Request<{}, {}, CreateRegistrationRequest> & {
    file?: Express.Multer.File;
  },
  res: Response<RegistrationResponse | { message: string }>,
  next: NextFunction,
) => {
  const transaction = await sequelize.transaction();
  try {
    // Check if there's already a pending registration with the same firstname and lastname, identification or personal_email
    const existingUser = await User.findOne({
    where: {
      [Op.or]: [
        { identification: req.body.identification },
        { personal_email: req.body.personal_email },
      ],
    },
  });

  if (existingUser) {
    throw new HttpError(
      400,
      "A user with this identification or email already exists",
    );
  }

  // Check all existing registrations (including rejected/approved)
  const existingRegistration = await Registration.findOne({
    where: {
      [Op.or]: [
        { identification: req.body.identification },
        { personal_email: req.body.personal_email },
      ],
    },
    paranoid: false,
  });
    if (existingRegistration) {
      if (existingRegistration.status === RegistrationStatus.PENDING) {
        throw new HttpError(
          400,
          "A pending registration already exists",
        );
      }

      if (existingRegistration.status === RegistrationStatus.APPROVED) {
        throw new HttpError(
          400,
          "This registration has already been approved",
        );
      }

      if (existingRegistration.status === RegistrationStatus.REJECTED) {
        throw new HttpError(
          400,
          "This identification or email has already submitted a registration",
        );
      }
    }

    // Validate file upload
    if (req.file) {
      const allowedMimeTypes = ["application/pdf"];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        throw new HttpError(
          400,
          "Invalid file type. Only PDF files are allowed.",
        );
      }
    } else {
      throw new HttpError(400, "Document file is required.");
    }

    // Create the registration record
    const registration = await Registration.create({
      user_id: null,
      reviewed_by_user_id: null,
      status: RegistrationStatus.PENDING,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      identification: req.body.identification,
      personal_email: req.body.personal_email,
      tel: req.body.tel,
      document_filepath: "",
      admin_remark: null,
      reviewed_at: null,
    });

    // Move the file to the private storage if it exists and update the registration record with the new path
    const storage = getStorage();
    const path = await storage.save({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      folder: "private",
      subfolder: "registrations/" + registration.id + "/documents/",
    });
    await registration.update({ document_filepath: path });

    // Notify all admins about the new registration
    await sendNotification(
      "admin",
      "New Park Guide Registration",
      `A new park guide registration has been submitted by ${registration.firstname} ${registration.lastname}. Please review it as soon as possible.`,
      transaction,
      undefined,
      true,
      NotificationCategory.REGISTRATION_REVIEW,
      "/registrations",
    );
    await transaction.commit();
    return res.status(200).json(toRegistrationResponse(registration));
  } catch (err) {
    await transaction.rollback();
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      logger.error("Internal server error", { error: err });
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const getAllRegistrations = async (
  req: Request<PaginateRequestParams>,
  res: Response<PaginateResponse<RegistrationResponse>>,
  next: NextFunction,
) => {
  try {
    const isDeletedRaw = req.query.isDeleted;
    const includeDeleted =
      (typeof isDeletedRaw === "string" &&
        isDeletedRaw.toLowerCase() === "true") ||
      (typeof isDeletedRaw === "boolean" && isDeletedRaw === true);

    const registrations = await paginateModel(Registration, req.query, {
      paranoid: !includeDeleted,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const formattedResponse = formatPaginateResponse(
      registrations.data.map(toRegistrationResponse),
      req.query,
      true,
      {
        page: registrations.page,
        size: registrations.size,
        totalElements: registrations.totalElements,
        totalPages: registrations.totalPages,
        baseUrl,
      },
    );

    return res.json(formattedResponse);
  } catch (err) {
    next(err);
  }
};

export const getRegistrationById = async (
  req: Request<{ id: string }>,
  res: Response<RegistrationResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const registration = await Registration.findByPk(req.params.id);

    if (!registration) {
      throw new HttpError(404, "Registration not found");
    }

    return res.json(toRegistrationResponse(registration));
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
    next(err);
  }
};

export const updateRegistration = async (
  req: Request<{ id: string }, {}, UpdateRegistrationRequest> & {
    file?: Express.Multer.File;
  },
  res: Response<RegistrationResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const registration = await Registration.findByPk(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const updates: Partial<Registration> = {};

    if (req.body.user_id !== undefined) {
      updates.user_id = req.body.user_id;
    }
    if (req.body.reviewed_by_user_id !== undefined) {
      updates.reviewed_by_user_id = req.body.reviewed_by_user_id;
    }
    if (req.body.status !== undefined) {
      updates.status = req.body.status;
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
    if (req.body.admin_remark !== undefined) {
      updates.admin_remark = req.body.admin_remark;
    }
    if (req.body.reviewed_at !== undefined) {
      updates.reviewed_at = req.body.reviewed_at
        ? new Date(req.body.reviewed_at)
        : null;
    }
    if (req.file) {
      updates.document_filepath = req.file.path;
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided to update" });
    }

    await registration.update(updates);

    return res.json(toRegistrationResponse(registration));
  } catch (err) {
    next(err);
  }
};

export const getRegistrationDocument = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Retrieve the registration model
    const registration = await Registration.findByPk(req.params.id);
    if (!registration) {
      throw new HttpError(404, "Registration not found");
    }

    // Check if document exists
    const storage = getStorage();
    if (!(await storage.exists(registration.document_filepath || ""))) {
      throw new HttpError(404, "Document not found");
    }

    // Retrieve the file and send
    const fileBuffer = await storage.retrieve(
      registration.document_filepath || "",
    );
    const originalFilename = path.basename(
      registration.document_filepath || "",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${originalFilename}"`,
    );
    res.type(path.extname(originalFilename));
    return res.send(fileBuffer);
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
    next(err);
  }
};

export const deleteRegistration = async (
  req: Request<{ id: string }>,
  res: Response<{ message: string }>,
  next: NextFunction,
) => {
  try {
    const deletedCount = await Registration.destroy({
      where: { id: req.params.id },
    });

    if (deletedCount === 0) {
      throw new HttpError(404, "Registration not found");
    }

    return res
      .status(200)
      .json({ message: "Registration deleted successfully" });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
    next(err);
  }
};

export const approveRegistration = async (
  req: Request<{ id: string }, {}, ApproveRegistrationRequest> & {
    user?: User;
  },
  res: Response<ApproveRegistrationResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    // TODO: Move this authentication check to an authoritzation middleware in the future.
    // Check if admin
    if (!req.user || req.user.role !== UserRoles.ADMIN) {
      throw new HttpError(403, "Admin access required");
    }

    // Get registration
    const registration = await Registration.findByPk(req.params.id);
    if (!registration) {
      throw new HttpError(404, "Registration not found");
    }

    // Check if user_id already exists
    if (registration.user_id) {
      throw new HttpError(
        400,
        "Registration already has an associated user. Cannot approve.",
      );
    }

    // Create new ParkGuide with a default username and password
    const temporary_password = "SFC@" + registration.identification.slice(-4);
    const username =
      `${registration.firstname}#${Math.floor(1000 + Math.random() * 9000)}`.toLowerCase();
    const user = await User.create({
      username,
      firstname: registration.firstname,
      lastname: registration.lastname,
      identification: registration.identification,
      personal_email: registration.personal_email,
      tel: registration.tel,
      role: UserRoles.PARK_GUIDE,
      password_hash: hashPassword(temporary_password),
    });

    // Update registration with user_id and approved status
    await registration.update({
      user_id: user.id,
      status: RegistrationStatus.APPROVED,
      reviewed_by_user_id: req.user.id,
      reviewed_at: new Date(),
    });

    // Return the created user and registration details (excluding password hash)
    return res.status(200).json({
      registration: toRegistrationResponse(registration),
      user: toUserResponse(user, req),
    });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
    next(err);
  }
};

export const rejectRegistration = async (
  req: Request<{ id: string }, {}, RejectRegistrationRequest> & { user?: User },
  res: Response<RegistrationResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    // TODO: Move this authentication check to an authoritzation middleware in the future.
    // Check if admin
    if (!req.user || req.user.role !== UserRoles.ADMIN) {
      throw new HttpError(403, "Admin access required");
    }

    // Get registration
    const registration = await Registration.findByPk(req.params.id);
    if (!registration) {
      throw new HttpError(404, "Registration not found");
    }

    // Update registration with rejection status and message
    await registration.update({
      status: RegistrationStatus.REJECTED,
      admin_remark: req.body.message,
      reviewed_by_user_id: req.user.id,
      reviewed_at: new Date(),
    });

    return res.json(toRegistrationResponse(registration));
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
    next(err);
  }
};
