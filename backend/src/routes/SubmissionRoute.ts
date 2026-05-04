import { Router } from "express";
import * as SubmissionController from "../controllers/SubmissionController";
import { auth } from "../middelware/Auth";

const submissionRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/element/{element_id}/submissions:
 *   get:
 *     summary: Get all submissions for an element
 *     tags: [Submissions]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: element_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   enrollment_id:
 *                     type: integer
 *                   element_id:
 *                     type: integer
 *                   submission_id:
 *                     type: integer
 *                     nullable: true
 *                   marked_by_user_id:
 *                     type: integer
 *                     nullable: true
 *                   content:
 *                     type: object
 *                   marking_remark:
 *                     type: string
 *                     nullable: true
 *                   earned_grade:
 *                     type: number
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 */
submissionRouter.get(
  "/element/:element_id/submissions",
  auth,
  SubmissionController.getAllSubmissions,
);

/**
 * @swagger
 * /api/submission:
 *   post:
 *     summary: Create a submission
 *     tags: [Submissions]
 *     security:
 *       - OAuth2: ["all"]
 *     responses:
 *       201:
 *         description: Submission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 enrollment_id:
 *                   type: integer
 *                 element_id:
 *                   type: integer
 *                 submission_id:
 *                   type: integer
 *                   nullable: true
 *                 marked_by_user_id:
 *                   type: integer
 *                   nullable: true
 *                 content:
 *                   type: object
 *                 marking_remark:
 *                   type: string
 *                   nullable: true
 *                 earned_grade:
 *                   type: number
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 */
submissionRouter.post(
  "/submission",
  auth,
  SubmissionController.createSubmission,
);

/**
 * @swagger
 * /api/submission/{submission_id}:
 *   get:
 *     summary: Get a submission by id
 *     tags: [Submissions]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: submission_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Submission retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 enrollment_id:
 *                   type: integer
 *                 element_id:
 *                   type: integer
 *                 submission_id:
 *                   type: integer
 *                   nullable: true
 *                 marked_by_user_id:
 *                   type: integer
 *                   nullable: true
 *                 content:
 *                   type: object
 *                 marking_remark:
 *                   type: string
 *                   nullable: true
 *                 earned_grade:
 *                   type: number
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 */
submissionRouter.get(
  "/submission/:submission_id",
  auth,
  SubmissionController.getSubmissionById,
);

/**
 * @swagger
 * /api/submission/{submission_id}:
 *   put:
 *     summary: Update a submission
 *     tags: [Submissions]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: submission_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Submission updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 enrollment_id:
 *                   type: integer
 *                 element_id:
 *                   type: integer
 *                 submission_id:
 *                   type: integer
 *                   nullable: true
 *                 marked_by_user_id:
 *                   type: integer
 *                   nullable: true
 *                 content:
 *                   type: object
 *                 marking_remark:
 *                   type: string
 *                   nullable: true
 *                 earned_grade:
 *                   type: number
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 */
submissionRouter.put(
  "/submission/:submission_id",
  auth,
  SubmissionController.updateSubmission,
);

/**
 * @swagger
 * /api/submission/{submission_id}:
 *   delete:
 *     summary: Delete a submission
 *     tags: [Submissions]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: submission_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Submission deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Submission deleted successfully
 */
submissionRouter.delete(
  "/submission/:submission_id",
  auth,
  SubmissionController.deleteSubmission,
);

/**
 * @swagger
 * /api/submission/{submission_id}/submit:
 *   post:
 *     summary: Submit an attempt for a submission
 *     tags: [Submissions]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: submission_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Submission attempt created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 enrollment_id:
 *                   type: integer
 *                 element_id:
 *                   type: integer
 *                 submission_id:
 *                   type: integer
 *                   nullable: true
 *                 marked_by_user_id:
 *                   type: integer
 *                   nullable: true
 *                 content:
 *                   type: object
 *                 marking_remark:
 *                   type: string
 *                   nullable: true
 *                 earned_grade:
 *                   type: number
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 */
submissionRouter.post(
  "/submission/:submission_id/submit",
  auth,
  SubmissionController.submitSubmission,
);

/**
 * @swagger
 * /api/submission/{submission_id}/mark:
 *   post:
 *     summary: Mark and grade a submission
 *     tags: [Submissions]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: submission_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Submission marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 enrollment_id:
 *                   type: integer
 *                 element_id:
 *                   type: integer
 *                 submission_id:
 *                   type: integer
 *                   nullable: true
 *                 marked_by_user_id:
 *                   type: integer
 *                   nullable: true
 *                 content:
 *                   type: object
 *                 marking_remark:
 *                   type: string
 *                   nullable: true
 *                 earned_grade:
 *                   type: number
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 */
submissionRouter.post(
  "/submission/:submission_id/mark",
  auth,
  SubmissionController.markSubmission,
);

export default submissionRouter;
