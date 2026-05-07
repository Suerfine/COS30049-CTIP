import { Router } from "express";
import * as EnrollmentController from "../controllers/EnrollmentController";
import { auth } from "../middelware/Auth";

const enrollmentRouter = Router();

/**
 * @swagger
 * /api/enrollments/{course_id}/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Enrollments]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the course to enroll in
 *     responses:
 *       201:
 *         description: Successfully enrolled in the course
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enrollment'
 */
enrollmentRouter.post(
  "/:course_id/enroll",
  auth,
  EnrollmentController.enrollCourse,
);

/**
 * @swagger
 * /api/enrollments:
 *   get:
 *     summary: Get all enrollments
 *     tags: [Enrollments]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records per page
 *       - in: query
 *         name: isDeleted
 *         schema:
 *           type: boolean
 *         description: Include soft-deleted enrollments
 *     responses:
 *       200:
 *         description: Successfully retrieved all enrollments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedEnrollmentResponse'
 */
enrollmentRouter.get("/", auth, EnrollmentController.getAllEnrollments);

/**
 * @swagger
 * /api/enrollments/my-enrollments:
 *   get:
 *     summary: Get current user's enrollments
 *     tags: [Enrollments]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by enrollment status
 *       - in: query
 *         name: isDeleted
 *         schema:
 *           type: boolean
 *         description: Include soft-deleted enrollments
 *     responses:
 *       200:
 *         description: Successfully retrieved user's enrollments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedEnrollmentResponse'
 */
enrollmentRouter.get(
  "/my-enrollments",
  auth,
  EnrollmentController.getMyEnrollments,
);

/**
 * @swagger
 * /api/enrollments/{id}/status/{status}:
 *   patch:
 *     summary: Update enrollment status
 *     tags: [Enrollments]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Enrollment ID
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         description: New enrollment status
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewed_comment:
 *                 type: string
 *                 description: Optional review comment
 *     responses:
 *       200:
 *         description: Successfully updated enrollment status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enrollment'
 */
enrollmentRouter.patch(
  "/:id/status/:status",
  auth,
  EnrollmentController.updateEnrollmentStatus,
);

/**
 * @swagger
 * /api/enrollments/{id}:
 *   delete:
 *     summary: Delete an enrollment
 *     tags: [Enrollments]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Successfully deleted enrollment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Enrollment deleted successfully
 */
enrollmentRouter.delete("/:id", auth, EnrollmentController.deleteEnrollment);

/**
 * @swagger
 * /api/enrollments/submissions/summaries:
 *   get:
 *     summary: Get all enrollment submission summaries (Admin)
 *     description: Returns a paginated list of enrollments with user and course details
 *     tags:
 *       - Enrollments
 *     security:
 *       - OAuth2: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Successfully retrieved submission summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       course_id:
 *                         type: integer
 *                       status:
 *                         type: string
 *                       user_fullname:
 *                         type: string
 *                         example: Fam Sin Mim
 *                       course_code:
 *                         type: string
 *                         example: ICT30001
 *                       course_name:
 *                         type: string
 *                         example: SFC Digital Park Guide Training
 *                       badge_url:
 *                         type: string
 *                         nullable: true
 *                       completed_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *             example:
 *               data:
 *                 - id: 1
 *                   user_id: 10
 *                   course_id: 5
 *                   status: in_review
 *                   user_fullname: Fam Sin Mim
 *                   course_code: ICT30001
 *                   course_name: SFC Digital Park Guide Training
 *                   badge_url: https://api.sigmamed.com/badges/park-guide.png
 *                   completed_at: null
 *                   created_at: 2026-05-07T10:00:00Z
 */
enrollmentRouter.get(
  "/submissions/summaries",
  auth,
  EnrollmentController.getSubmissionSummaries,
);

/**
 * @swagger
 * /api/enrollments/{id}/audit:
 *   get:
 *     summary: Get enrollment audit details
 *     description: Returns a deeply nested structure containing modules, pages, elements, and submissions
 *     tags:
 *       - Enrollments
 *     security:
 *       - OAuth2: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Enrollment ID to audit
 *     responses:
 *       200:
 *         description: Successfully retrieved audit data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 status:
 *                   type: string
 *                 Course:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                 Modules:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       Pages:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             title:
 *                               type: string
 *                             final_quiz:
 *                               type: boolean
 *                 Elements:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       Submissions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             earned_grade:
 *                               type: number
 *                             created_at:
 *                               type: string
 *                               format: date-time
 *             example:
 *               id: 1
 *               status: in_review
 *               Course:
 *                 title: SFC Digital Park Guide Training
 *               Modules:
 *                 - title: Safety Protocol
 *                   Pages:
 *                     - title: Emergency Procedures
 *                       final_quiz: true
 *               Elements:
 *                 - id: 101
 *                   Submissions:
 *                     - earned_grade: 95
 *                       created_at: 2026-05-07T11:00:00Z
 *       404:
 *         description: Enrollment not found
 */
enrollmentRouter.get(
  "/:id/audit",
  auth,
  EnrollmentController.getEnrollmentAudit,
);

/**
 * @swagger
 * /api/enrollments/{id}/approve:
 *   patch:
 *     summary: Approve enrollment and issue badge
 *     description: Validates completion and issues badge if eligible
 *     tags:
 *       - Enrollments
 *     security:
 *       - OAuth2: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Enrollment approved and badge issued
 *       400:
 *         description: Final quiz verification failed
 */
enrollmentRouter.patch(
  "/:id/approve",
  auth,
  EnrollmentController.approveBadge,
);

export default enrollmentRouter;
