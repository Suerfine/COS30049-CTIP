import { Request, Response, NextFunction } from "express";
import { PaginateRequestParams, PaginateResponse } from "../types/common";
import {
  EnrollmentResponse,
  MyEnrollmentRequestParams,
} from "../types/Enrollment";
import { Course, Enrollment } from "../models";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { EnrollmentStatus } from "../enum/EnrollmentStatus";
import sequelize from "../config/Database";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function toEnrollmentResponse(enrollment: Enrollment): EnrollmentResponse {
  return {
    id: enrollment.id,
    user_id: enrollment.user_id,
    course_id: enrollment.course_id,
    status: enrollment.status,
    enrolled_at: enrollment.enrolled_at,
    completed_at: enrollment.completed_at,
    reviewed_by_user_id: enrollment.reviewed_by_user_id,
    reviewed_at: enrollment.reviewed_at,
    reviewed_comment: enrollment.reviewed_comment,
    badge_expire_at: enrollment.badge_expire_at,
    created_at: enrollment.created_at,
    updated_at: enrollment.updated_at,
  };
}

export const enrollCourse = async (
  req: Request<{ course_id: string }, any, any>,
  res: Response<EnrollmentResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    // Validate course_id parameter
    const courseId = Number(req.params.course_id);
    if (Course.findByPk(courseId) === null) {
      throw new HttpError(404, "Course not found");
    }

    //Validate the user satisfies the prerequisites for the course.
    //TODO: Implement prerequisite check logic here
    if (!true) {
      throw new HttpError(400, "User does not satisfy course prerequisites");
    }

    //Create the enrollment record
    const enrollment = await Enrollment.create({
      user_id: req.user!.id,
      course_id: courseId,
      status: EnrollmentStatus.IN_PROGRESS,
      enrolled_at: new Date(),
    });
    return res.status(201).json(toEnrollmentResponse(enrollment));
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const getAllEnrollments = async (
  req: Request<PaginateRequestParams>,
  res: Response<PaginateResponse<EnrollmentResponse> | { message: string }>,
  next: NextFunction,
) => {
  try {
    // Determine if we should include soft-deleted records based on the isDeleted query parameter
    const isDeletedRaw = req.query.isDeleted;
    const includeDeleted =
      (typeof isDeletedRaw === "string" &&
        isDeletedRaw.toLowerCase() === "true") ||
      (typeof isDeletedRaw === "boolean" && isDeletedRaw === true);

    //Retrieving enrollments with pagination and optional inclusion of soft-deleted records
    const enrollments = await paginateModel(Enrollment, req.query, {
      paranoid: !includeDeleted,
    });

    // Transforming the retrieved enrollments into the desired response format
    const baseUrl = `${req.protocol}://${req.get("host")}${req.baseUrl}${req.path}`;
    const formattedResponse = formatPaginateResponse(
      enrollments.data.map(toEnrollmentResponse),
      req.query,
      true,
      {
        page: enrollments.page,
        size: enrollments.size,
        totalElements: enrollments.totalElements,
        totalPages: enrollments.totalPages,
        baseUrl,
      },
    );
    return res.status(200).json(formattedResponse);
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const getMyEnrollments = async (
  req: Request<MyEnrollmentRequestParams>,
  res: Response<PaginateResponse<EnrollmentResponse> | { message: string }>,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpError(401, "Unauthorized");
    }

    // Retrieve all enrollments based on the userID and the optional status filter, with pagination and soft-deletion handling
    const statusFilter = req.query.status;
    const enrollments = await paginateModel(Enrollment, req.query, {
      paranoid: !req.query.isDeleted,
      where: {
        user_id: userId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
    });

    // Transform the retrieved enrollments into the desired response format
    const baseUrl = `${req.protocol}://${req.get("host")}${req.baseUrl}${req.path}`;
    const formattedResponse = formatPaginateResponse(
      enrollments.data.map(toEnrollmentResponse),
      req.query,
      true,
      {
        page: enrollments.page,
        size: enrollments.size,
        totalElements: enrollments.totalElements,
        totalPages: enrollments.totalPages,
        baseUrl,
      },
    );
    return res.status(200).json(formattedResponse);
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const updateEnrollmentStatus = async (
  req: Request<
    { id: string; status: EnrollmentStatus },
    any,
    {
      reviewed_comment?: string | null;
    }
  >,
  res: Response<EnrollmentResponse | { message: string }>,
) => {
  const transaction = await sequelize.transaction();
  try {
    const enrollmentId = Number(req.params.id);

    //Check if its a valid enrollment id
    if (Number.isNaN(enrollmentId)) {
      throw new HttpError(400, "Invalid enrollment id");
    }
    const enrollment = await Enrollment.findByPk(enrollmentId);
    if (!enrollment) {
      throw new HttpError(404, "Enrollment not found");
    }

    //Check if the new status is valid
    const newStatus = req.params.status;
    if (!Object.values(EnrollmentStatus).includes(newStatus)) {
      throw new HttpError(400, "Invalid enrollment status");
    }

    //Update the enrollment status
    //TODO: Need to implement business logic to check and verify valid status transitions if necessary
    switch (newStatus) {
      case EnrollmentStatus.FAILED:
        if (
          enrollment.status !== EnrollmentStatus.IN_PROGRESS &&
          enrollment.status !== EnrollmentStatus.IN_REVIEW
        ) {
          throw new HttpError(400, "Invalid enrollment status transition");
        }
        enrollment.reviewed_at = new Date();
        enrollment.reviewed_by_user_id = req.user?.id || null; //By right should be admin who approves
        enrollment.reviewed_comment = req.body.reviewed_comment || null;
        enrollment.status = newStatus;
      case EnrollmentStatus.DROPPED:
        if (enrollment.status !== EnrollmentStatus.IN_PROGRESS) {
          throw new HttpError(400, "Invalid enrollment status transition");
        }
        enrollment.status = newStatus;
        break;
      case EnrollmentStatus.COMPLETED:
        if (enrollment.status !== EnrollmentStatus.IN_REVIEW) {
          throw new HttpError(400, "Invalid enrollment status transition");
        }

        // After a park guide has finished all the courses
        const course = await Course.findByPk(enrollment.course_id);
        if (!course) {
          throw new HttpError(404, "Course not found");
        }
        enrollment.completed_at = new Date();
        enrollment.reviewed_at = new Date();
        enrollment.reviewed_by_user_id = req.user?.id || null; //By right should be admin who approves
        enrollment.status = newStatus;
        enrollment.reviewed_comment = req.body.reviewed_comment || null;
        enrollment.badge_expire_at = course.badge_expire_in_months
          ? new Date(
              Date.now() +
                course.badge_expire_in_months * 30 * 24 * 60 * 60 * 1000,
            )
          : null;
        break;
      case EnrollmentStatus.IN_REVIEW:
        // XXX: Remove this route. The status should only be set to IN_REVIEW by code.
        if (enrollment.status !== EnrollmentStatus.IN_PROGRESS) {
          throw new HttpError(400, "Invalid enrollment status transition");
        }
        enrollment.status = newStatus;
        break;
      // For other statuses, we may want to set completed_at to null as well, depending on the business logic
      default:
        throw new HttpError(400, "Unsupported enrollment status transition");
    }
    await enrollment.save();
    await transaction.commit();
    return res.status(200).json(toEnrollmentResponse(enrollment));
  } catch (err) {
    await transaction.rollback();
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};

export const deleteEnrollment = async (
  req: Request<{ id: string }>,
  res: Response<{ message: string }>,
  next: NextFunction,
) => {
  try {
    const enrollmentId = Number(req.params.id);
    if (Number.isNaN(enrollmentId)) {
      throw new HttpError(400, "Invalid enrollment id");
    }
    const enrollment = await Enrollment.findByPk(enrollmentId);
    if (!enrollment) {
      throw new HttpError(404, "Enrollment not found");
    }
    await enrollment.destroy();
    return res.status(200).json({ message: "Enrollment deleted successfully" });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};
