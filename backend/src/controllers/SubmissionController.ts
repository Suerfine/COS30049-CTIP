import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import { Element, Enrollment, Page, Submission } from "../models";
import { UserRoles } from "../enum/UserRoles";
import {
  parseId,
  parseJsonField,
  parseNumberField,
  parseOptionalText,
} from "../utils/parseRequest";
import {
  SubmissionResponse,
  CreateSubmissionRequest,
  UpdateSubmissionRequest,
  MarkSubmissionRequest,
} from "../types/Submission";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const toSubmissionResponse = (submission: Submission): SubmissionResponse => {
  return {
    id: submission.id,
    enrollment_id: submission.enrollment_id,
    element_id: submission.element_id,
    submission_id: submission.submission_id,
    marked_by_user_id: submission.marked_by_user_id,
    content: submission.content,
    marking_remark: submission.marking_remark,
    earned_grade: submission.earned_grade,
    created_at: submission.created_at,
    updated_at: submission.updated_at,
  };
};

/**
 * Checks if the user is either enrolled in the unit or at least an admin
 * @param enrollmentId Enrollment ID to check ownership of
 * @param userId User ID of the requester (optional, if not provided will be treated as unauthenticated)
 * @param userRole User role of the requester (optional, if not provided will be treated as unauthenticated)
 * @returns Promise that resolves if the user is authorized, or rejects with an HttpError if not
 */
const requireOwnershipOrAdmin = async (
  enrollmentId: number,
  userId?: number,
  userRole?: string,
): Promise<void> => {
  if (!userId) {
    throw new HttpError(401, "Unauthorized");
  }

  if (userRole === UserRoles.ADMIN) {
    return;
  }

  const enrollment = await Enrollment.findByPk(enrollmentId);
  if (!enrollment) {
    throw new HttpError(404, "Enrollment not found");
  }

  if (enrollment.user_id !== userId) {
    throw new HttpError(403, "Forbidden");
  }
};

const resolveSubmissionContent = (
  body: unknown,
): Record<string, unknown> | null => {
  if (typeof body === "object" && body !== null && !Array.isArray(body)) {
    const objectBody = body as Record<string, unknown>;

    if (
      Object.keys(objectBody).length === 1 &&
      Object.prototype.hasOwnProperty.call(objectBody, "content")
    ) {
      return parseJsonField(objectBody.content);
    }
  }

  return parseJsonField(body);
};

export const getAllSubmissions = async (
  req: Request<{ element_id: string }>,
  res: Response<SubmissionResponse[] | { message: string }>,
  next: NextFunction,
) => {
  try {
    const elementId = parseId(req.params.element_id);

    if (elementId === null) {
      throw new HttpError(400, "Invalid element_id");
    }

    const element = await Element.findByPk(elementId);
    if (!element) {
      throw new HttpError(404, "Element not found");
    }

    const submissions = await Submission.findAll({
      where: { element_id: elementId },
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"],
      ],
    });

    return res.status(200).json(submissions.map(toSubmissionResponse));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const getSubmissionById = async (
  req: Request<{ submission_id: string }>,
  res: Response<SubmissionResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const submissionId = parseId(req.params.submission_id);

    if (submissionId === null) {
      throw new HttpError(400, "Invalid submission_id");
    }

    const submission = await Submission.findByPk(submissionId);

    if (!submission) {
      throw new HttpError(404, "Submission not found");
    }

    return res.status(200).json(toSubmissionResponse(submission));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const createSubmission = async (
  req: Request<{}, {}, CreateSubmissionRequest>,
  res: Response<SubmissionResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const enrollmentId = parseNumberField(req.body.enrollment_id);
    const elementId = parseNumberField(req.body.element_id);
    const submissionIdField = req.body.submission_id;
    const earnedGrade = req.body.earned_grade !== undefined ? Number(req.body.earned_grade) : 0;
    if (
      enrollmentId === null ||
      !Number.isInteger(enrollmentId) ||
      enrollmentId <= 0
    ) {
      throw new HttpError(
        400,
        "enrollment_id is required and must be a positive integer",
      );
    }

    if (elementId === null || !Number.isInteger(elementId) || elementId <= 0) {
      throw new HttpError(
        400,
        "element_id is required and must be a positive integer",
      );
    }

    const content = resolveSubmissionContent(req.body.content ?? req.body);
    if (content === null) {
      throw new HttpError(400, "content must be a valid JSON object");
    }

    const enrollment = await Enrollment.findByPk(enrollmentId);
    if (!enrollment) {
      throw new HttpError(404, "Enrollment not found");
    }

    const element = await Element.findByPk(elementId);
    if (!element) {
      throw new HttpError(404, "Element not found");
    }

    await requireOwnershipOrAdmin(enrollmentId, req.user?.id, req.user?.role);

    let parentSubmissionId: number | null = null;
    if (submissionIdField !== undefined && submissionIdField !== null) {
      const parsedParent = parseNumberField(submissionIdField);
      if (
        parsedParent === null ||
        !Number.isInteger(parsedParent) ||
        parsedParent <= 0
      ) {
        throw new HttpError(
          400,
          "submission_id must be a positive integer when provided",
        );
      }

      const parentSubmission = await Submission.findByPk(parsedParent);
      if (!parentSubmission) {
        throw new HttpError(404, "Parent submission not found");
      }

      parentSubmissionId = parsedParent;
    }

    const submission = await Submission.create({
      enrollment_id: enrollmentId,
      element_id: elementId,
      submission_id: parentSubmissionId,
      content,
      earned_grade: earnedGrade,
      marking_remark: null,
    });

    return res.status(201).json(toSubmissionResponse(submission));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const updateSubmission = async (
  req: Request<{ submission_id: string }, {}, UpdateSubmissionRequest>,
  res: Response<SubmissionResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const submissionId = parseId(req.params.submission_id);

    if (submissionId === null) {
      throw new HttpError(400, "Invalid submission_id");
    }

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      throw new HttpError(404, "Submission not found");
    }

    await requireOwnershipOrAdmin(
      submission.enrollment_id,
      req.user?.id,
      req.user?.role,
    );

    const updates: Partial<Submission> = {};

    if (req.body.content !== undefined) {
      const content = parseJsonField(req.body.content);
      if (content === null) {
        throw new HttpError(400, "content must be a valid JSON object");
      }

      updates.content = content;
    }

    if (req.body.marking_remark !== undefined) {
      updates.marking_remark =
        parseOptionalText(req.body.marking_remark) ?? null;
    }

    if (req.body.earned_grade !== undefined) {
      const earnedGrade = parseNumberField(req.body.earned_grade);
      if (earnedGrade === null || !Number.isFinite(earnedGrade)) {
        throw new HttpError(400, "earned_grade must be a valid number");
      }

      updates.earned_grade = earnedGrade;
    }

    if (Object.keys(updates).length === 0) {
      throw new HttpError(400, "No valid fields provided to update");
    }

    await submission.update(updates);

    return res.status(200).json(toSubmissionResponse(submission));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const deleteSubmission = async (
  req: Request<{ submission_id: string }>,
  res: Response<{ message: string }>,
  next: NextFunction,
) => {
  try {
    const submissionId = parseId(req.params.submission_id);
    if (submissionId === null) {
      throw new HttpError(400, "Invalid submission_id");
    }
    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      throw new HttpError(404, "Submission not found");
    }
    await requireOwnershipOrAdmin(
      submission.enrollment_id,
      req.user?.id,
      req.user?.role,
    );

    await submission.destroy();

    return res.status(200).json({ message: "Submission deleted successfully" });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const submitSubmission = async (
  req: Request<{ submission_id: string }, {}, Record<string, unknown>>,
  res: Response<SubmissionResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const submissionId = parseId(req.params.submission_id);
    if (submissionId === null) {
      throw new HttpError(400, "Invalid submission_id");
    }
    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      throw new HttpError(404, "Submission not found");
    }
    await requireOwnershipOrAdmin(
      submission.enrollment_id,
      req.user?.id,
      req.user?.role,
    );

    const element = await Element.findByPk(submission.element_id);
    if (!element) {
      throw new HttpError(404, "Element not found");
    }

    const page = await Page.findByPk(element.page_id);
    if (!page) {
      throw new HttpError(404, "Page not found");
    }

    // Check max tries if applicable
    const rootSubmissionId = submission.submission_id ?? submission.id;
    const currentAttemptCount = await Submission.count({
      where: {
        [Op.or]: [
          { id: rootSubmissionId },
          { submission_id: rootSubmissionId },
        ],
      },
    });
    if (page.max_tries !== null && currentAttemptCount >= page.max_tries) {
      throw new HttpError(
        400,
        "Maximum number of attempts reached for this question",
      );
    }

    const content = resolveSubmissionContent(req.body);
    if (content === null) {
      throw new HttpError(
        400,
        "Request body must be a valid JSON content object",
      );
    }

    //TODO: Add mark gradding logic here based on element.score and content, for now we just random between 0 and max score
    const earnedGrade = Math.random() * (element.score ?? 0);

    const submittedAttempt = await Submission.create({
      enrollment_id: submission.enrollment_id,
      element_id: submission.element_id,
      submission_id: rootSubmissionId,
      content,
      earned_grade: earnedGrade,
      marking_remark: null,
    });

    return res.status(201).json(toSubmissionResponse(submittedAttempt));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};

export const markSubmission = async (
  req: Request<{ submission_id: string }, {}, MarkSubmissionRequest>,
  res: Response<SubmissionResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    // Only allow admins to mark submissions
    if (req.user?.role !== UserRoles.ADMIN) {
      throw new HttpError(403, "Only admin can mark submissions");
    }

    //Checking if submission exists
    const submissionId = parseId(req.params.submission_id);
    if (submissionId === null) {
      throw new HttpError(400, "Invalid submission_id");
    }
    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      throw new HttpError(404, "Submission not found");
    }

    // Validate and update earned_grade and marking_remark
    const earnedGrade = parseNumberField(req.body.earned_grade);
    if (earnedGrade === null || !Number.isFinite(earnedGrade)) {
      throw new HttpError(
        400,
        "earned_grade is required and must be a valid number",
      );
    }
    submission.earned_grade = earnedGrade;
    submission.marking_remark =
      parseOptionalText(req.body.marking_remark) ?? null;
    submission.marked_by_user_id = req.user.id;
    await submission.save();
    return res.status(200).json(toSubmissionResponse(submission));
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    next(err);
  }
};
