import { Request, Response, NextFunction } from "express";
import { PaginateRequestParams, PaginateResponse } from "../types/common";
import {
  EnrollmentResponse,
  MyEnrollmentRequestParams,
} from "../types/Enrollment";
import { Course, Enrollment, User, Module, Page, Submission, Element } from "../models";
import { formatPaginateResponse, paginateModel } from "../utils/paginate";
import { EnrollmentStatus } from "../enum/EnrollmentStatus";
import sequelize from "../config/Database";
import { Op, WhereOptions } from "sequelize";
import { sendNotification } from "../utils/sendNotification";
import { NotificationCategory } from "../enum/NotificationCategory";

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
      // status: EnrollmentStatus.IN_REVIEW,
      status: EnrollmentStatus.PENDING_PAYMENT,
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
    const enrollment = await Enrollment.findByPk(enrollmentId, { transaction });
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
        break;
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
        const course = await Course.findByPk(enrollment.course_id, {
          transaction,
        });
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
        await sendNotification(
          "single",
          "New Badge Awarded",
          `Congratulations! You received a new badge for "${course.title}".`,
          transaction,
          enrollment.user_id,
          false,
          NotificationCategory.BADGE_AWARDED,
          "/badges",
        );
        break;
      case EnrollmentStatus.IN_REVIEW:
        // XXX: Remove this route. The status should only be set to IN_REVIEW by code.
        if (enrollment.status !== EnrollmentStatus.IN_PROGRESS && enrollment.status !== EnrollmentStatus.DROPPED) {
          throw new HttpError(400, "Invalid enrollment status transition");
        }
        enrollment.status = newStatus;
        break;
      case EnrollmentStatus.IN_PROGRESS:
        if (
          // enrollment.status !== EnrollmentStatus.IN_REVIEW
          enrollment.status !== EnrollmentStatus.APPLIED &&
          enrollment.status !== EnrollmentStatus.PENDING_PAYMENT
        ) {
          throw new HttpError(400, "Invalid enrollment status transition");
        }
        enrollment.status = newStatus;
        await sendNotification(
          "single",
          "Enrollment Approved",
          "Your course enrollment has been approved. You can now start learning.",
          transaction,
          enrollment.user_id,
          false,
          NotificationCategory.ENROLLMENT_SUCCESS,
          `/courses/${enrollment.course_id}`,
        );
        break;
      // NEW: transition to pending payment
      case EnrollmentStatus.PENDING_PAYMENT:
        if (enrollment.status !== null) {
          throw new HttpError(400, "Invalid enrollment status transition");
        }
        enrollment.status = newStatus;
        break;
      // NEW: transition to applied
      case EnrollmentStatus.APPLIED:
        if (
          enrollment.status !== EnrollmentStatus.PENDING_PAYMENT
        ) {
          throw new HttpError(400, "Invalid enrollment status transition");
        }
        enrollment.status = newStatus;
        break;
      default:
        throw new HttpError(400, "Unsupported enrollment status transition");
    }
    await enrollment.save({ transaction });
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

export const getSubmissionSummaries = async (
  req: Request<PaginateRequestParams>,
  res: Response<PaginateResponse<any> | { message: string }>
): Promise<Response> => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : "All";

    const orderBy =
      typeof req.query.orderBy === "string"
        ? req.query.orderBy
        : "id ASC";

    const whereClause: any = {};

    if (status !== "All") {
      whereClause.status = status;
    } else {
      whereClause.status = {
        [Op.notIn]: ["pending_payment", "in_review"]
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { "$user.firstname$": { [Op.like]: `%${search}%` } },
        { "$user.lastname$": { [Op.like]: `%${search}%` } },
        { "$course.title$": { [Op.like]: `%${search}%` } },
      ];
    }

    const summaries = await paginateModel(
      Enrollment,
      {
        ...req.query,
      },
      {
        where: whereClause,
        include: [
          {
            model: User,
            as: "user",
          },
          {
            model: Course,
            as: "course",
          },
        ],
        paranoid: true,
        subQuery: false
      }
    );

    const baseUrl = `${req.protocol}://${req.get("host")}${req.baseUrl}${req.path}`;

    const formattedResponse = formatPaginateResponse(
      summaries.data.map((enrollment: any) => {
        const user = enrollment.user;
        const course = enrollment.course;

        let badgeExpiryOn: string | null = null;

        if (enrollment.completed_at && course?.badge_expire_in_months) {
          const completionDate = new Date(enrollment.completed_at);

          completionDate.setMonth(
            completionDate.getMonth() +
              Number(course.badge_expire_in_months)
          );

          badgeExpiryOn = completionDate.toISOString();
        }

        return {
          ...toEnrollmentResponse(enrollment),

          user_fullname: user
            ? `${user.firstname} ${user.lastname}`
            : "Unknown User",

          course_details: course ?? null,

          badge_expire_at: badgeExpiryOn,
        };
      }),

      req.query, 
      true,
      {
        page: summaries.page,
        size: summaries.size,
        totalElements: summaries.totalElements,
        totalPages: summaries.totalPages,
        baseUrl,
      }
    );

    return res.status(200).json(formattedResponse);
  } catch (err: any) {
    console.error("Summaries Fetch Error:", err);

    return res.status(500).json({
      message: "Internal server error\n" + (err?.message || err),
    });
  }
};

export const getEnrollmentAudit = async (
  req: Request<{ id: string }>,
  res: Response<any | { message: string }>,
) => {
  try {
    const enrollmentId = Number(req.params.id);

    if (isNaN(enrollmentId)) {
      throw new HttpError(400, "Invalid enrollment ID");
    }

    const audit = await Enrollment.findByPk(enrollmentId, {
      include: [
        {
          model: Course,
          as: "course",
          include: [
            {
              model: Module,
              as: "modules",
              include: [
                {
                  model: Page,
                  as: "pages",
                  include: [
                    {
                      model: Element,
                      as: "elements",
                      include: [
                        {
                          model: Submission,
                          as: "submissions",
                          where: { enrollment_id: enrollmentId },
                          required: false,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ] as any[],
    });
    if (!audit) {
      throw new HttpError(404, "Enrollment not found");
    }

    return res.status(200).json(audit);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    return res
      .status(500)
      .json({ message: "Internal server error\n" + err });
  }
};

export const approveBadge = async (
  req: Request<{ id: string }>,
  res: Response<EnrollmentResponse | { message: string }>,
) => {
  const transaction = await sequelize.transaction();
  
  try {
    const enrollmentId = Number(req.params.id);
    if (Number.isNaN(enrollmentId)) throw new HttpError(400, "Invalid enrollment id");

    const enrollment = await Enrollment.findByPk(enrollmentId, { 
      include: [{ model: Course }],
      transaction 
    }) as (Enrollment & { Course: Course; course_id: number }) | null; 

    if (!enrollment) throw new HttpError(404, "Enrollment not found");

    if (enrollment.status !== EnrollmentStatus.IN_REVIEW) {
      throw new HttpError(400, "Only enrollments 'In Review' can be approved.");
    }

    const finalQuizPages = await Page.findAll({
      where: { 
        course_id: enrollment.course_id, 
        final_quiz: true 
      } as any, 
      include: [{ model: Element }],
      transaction
    }) as any[];

    for (const page of finalQuizPages) {
      for (const element of page.Elements || []) {
        const submission = await Submission.findOne({
          where: { 
            enrollment_id: enrollmentId,
            element_id: element.id
          },
          transaction
        });

        const requiredScore = (page as any).passing_score || 80;
        if (!submission || (submission as any).earned_grade < requiredScore) {
          throw new HttpError(
            400, 
            `Verification failed: Final Quiz on page "${page.title}" not passed.`
          );
        }
      }
    }

    const courseData = (enrollment as any).Course; 
    
    enrollment.status = EnrollmentStatus.COMPLETED;
    enrollment.completed_at = new Date();
    enrollment.reviewed_at = new Date();
    enrollment.reviewed_by_user_id = req.user?.id || null;
    
    if (courseData && (courseData as any).badge_expire_in_months) {
      const expireDate = new Date();
      expireDate.setMonth(expireDate.getMonth() + (courseData as any).badge_expire_in_months);
      enrollment.badge_expire_at = expireDate;
    }

    await enrollment.save({ transaction });
    await sendNotification(
      "single",
      "New Badge Awarded",
      `Congratulations! You received a new badge for "${courseData?.title || "your course"}".`,
      transaction,
      enrollment.user_id,
      false,
      NotificationCategory.BADGE_AWARDED,
      "/badges",
    );
    await transaction.commit();

    return res.status(200).json(toEnrollmentResponse(enrollment));
  } catch (err) {
    if (transaction) await transaction.rollback();
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal server error\n" + err });
    }
  }
};
