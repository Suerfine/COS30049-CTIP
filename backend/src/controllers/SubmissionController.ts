import { NextFunction, Request, Response } from "express";
import { Submission } from "../models";
import { decryptAssessmentDataForRole } from "../utils/assessmentData";

type SubmissionRequest = Request<{ id: string }> & {
  user?: Express.Request["user"];
};

function parseSubmissionId(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export const getSubmissionById = async (
  req: SubmissionRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const submissionId = parseSubmissionId(req.params.id);
    if (submissionId === null) {
      return res.status(400).json({ message: "Invalid submission id" });
    }

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    return res.json({
      id: submission.id,
      enrollment_id: submission.enrollment_id,
      element_id: submission.element_id,
      submission_id: submission.submission_id,
      marked_by_user_id: submission.marked_by_user_id,
      data: submission.data,
      earned_grade: submission.earned_grade,
      created_at: submission.created_at,
      updated_at: submission.updated_at,
    });
  } catch (error) {
    next(error);
  }
};

export const getDecryptedSubmissionById = async (
  req: SubmissionRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const submissionId = parseSubmissionId(req.params.id);
    if (submissionId === null) {
      return res.status(400).json({ message: "Invalid submission id" });
    }

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    try {
      const decryptedData = decryptAssessmentDataForRole(
        submission.data,
        req.user?.role,
      );

      return res.json({
        id: submission.id,
        enrollment_id: submission.enrollment_id,
        element_id: submission.element_id,
        submission_id: submission.submission_id,
        marked_by_user_id: submission.marked_by_user_id,
        data: decryptedData,
        earned_grade: submission.earned_grade,
        created_at: submission.created_at,
        updated_at: submission.updated_at,
      });
    } catch {
      return res.status(403).json({
        message: "Forbidden: only admins can decrypt assessment data",
      });
    }
  } catch (error) {
    next(error);
  }
};
