import { Router } from "express";
import * as SubmissionController from "../controllers/SubmissionController";
import { auth } from "../middelware/Auth";

const submissionRouter = Router();

/**
 * @swagger
 * /api/submissions/{id}:
 *   get:
 *     summary: Get a submission with encrypted assessment payload
 *     tags: [Submissions]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Submission retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Submission not found
 */
submissionRouter.get("/:id", auth, SubmissionController.getSubmissionById);

/**
 * @swagger
 * /api/submissions/{id}/decrypted:
 *   get:
 *     summary: Get decrypted assessment data (admin only)
 *     tags: [Submissions]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Decrypted submission data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Submission not found
 */
submissionRouter.get(
  "/:id/decrypted",
  auth,
  SubmissionController.getDecryptedSubmissionById,
);

export default submissionRouter;
