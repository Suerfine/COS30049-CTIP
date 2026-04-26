import { NextFunction, Request, Response } from "express";
import { Registration } from "../models";
import { DatabaseError, ValidationError } from "sequelize";
import { PaginateRequestParams, PaginateResponse } from "../types/common";
import {
  CreateRegistrationRequest,
  RegistrationResponse,
  UpdateRegistrationRequest,
} from "../types/Registration";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { RegistrationStatus } from "../enum/RegistrationStatus";

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
  req: Request<{}, {}, CreateRegistrationRequest>,
  res: Response<RegistrationResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const created = await Registration.create({
      user_id: req.body.user_id,
      reviewed_by_user_id: req.body.reviewed_by_user_id ?? null,
      status: req.body.status ?? RegistrationStatus.PENDING,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      identification: req.body.identification,
      personal_email: req.body.personal_email,
      tel: req.body.tel,
      admin_remark: req.body.admin_remark ?? null,
      reviewed_at: req.body.reviewed_at ? new Date(req.body.reviewed_at) : null,
    });

    return res.status(201).json(toRegistrationResponse(created));
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ message: err.message });
    }

    if (err instanceof DatabaseError) {
      const dbMessage =
        (err.parent as { message?: string } | undefined)?.message ??
        err.message;
      return res.status(400).json({ message: dbMessage });
    }

    if (err instanceof Error) {
      return res.status(500).json({ message: err.message });
    }

    return res.status(500).json({ message: "Unknown error" });
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
      return res.status(404).json({ message: "Registration not found" });
    }

    return res.json(toRegistrationResponse(registration));
  } catch (err) {
    next(err);
  }
};

export const updateRegistration = async (
  req: Request<{ id: string }, {}, UpdateRegistrationRequest>,
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
      return res.status(404).json({ message: "Registration not found" });
    }

    return res.json({ message: "Registration deleted successfully" });
  } catch (err) {
    next(err);
  }
};
