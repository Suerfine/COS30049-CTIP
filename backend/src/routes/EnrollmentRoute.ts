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

export default enrollmentRouter;
