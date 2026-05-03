import { Router } from "express";
import * as CourseController from "../controllers/CourseController";
import { auth } from "../middelware/Auth";
import { uploadPrivateDocument } from "../middelware/PrivateDocumentUpload";
import moduleRouter from "./ModuleRoute";
import { uploadBadgeImg } from "../config/multer";
import { validate } from "../middelware/Validate";
import { body } from "express-validator/lib/middlewares/validation-chain-builders";
import { CourseStatus } from "../enum/CourseStatus";

const privateCourseBadgeUpload = uploadPrivateDocument({
  subfolder: "courses/badges",
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
}).single("badge");
const uploadCourseBadge = uploadBadgeImg();

const courseRouter = Router();
courseRouter.use("/:course_Id/modules", moduleRouter);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     description: Creates a course with optional badge image, status, release timestamp, and prerequisite groups.
 *     tags: [Courses]
 *     security:
 *       - OAuth2: ["all"]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateCourseRequest'
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
courseRouter.post(
  "/",
  auth,
  uploadCourseBadge.single("badge"),
  [
    body("title").isString().notEmpty(),
    body("description").optional().isString(),
    body("status").optional().isIn(Object.values(CourseStatus)),
  ],
  validate,
  CourseController.createCourse,
);

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     description: Returns a paginated list of courses with optional filtering, sorting, and soft-deleted records.
 *     tags: [Courses]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         description: Page number to retrieve.
 *       - in: query
 *         name: size
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *         description: Number of records per page.
 *       - in: query
 *         name: orderBy
 *         required: false
 *         schema:
 *           type: string
 *           example: created_at desc
 *         description: Sort expression format "attribute asc|desc".
 *       - in: query
 *         name: filter
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter expression parsed by backend pagination utility.
 *       - in: query
 *         name: isDeleted
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *           example: false
 *         description: When true, include soft-deleted courses in the result set.
      - in: query
        name: tags
        required: false
        schema:
          type: array
          items:
            type: string
        description: Filter courses by tags. Provide one or more tag strings.
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 size:
 *                   type: integer
 *                   example: 10
 *                 totalElements:
 *                   type: integer
 *                   example: 25
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                 _links:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                     nullable: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
courseRouter.get("/", auth, CourseController.getAllCourses);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
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
 *         description: Course retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
courseRouter.get("/:id", auth, CourseController.getCourseById);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update course
 *     description: Updates an existing course with one or more fields, including status, release timestamp, prerequisites, and optional badge image.
 *     tags: [Courses]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCourseRequest'
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       400:
 *         description: Invalid update payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
courseRouter.put(
  "/:id",
  auth,
  privateCourseBadgeUpload,
  CourseController.upsertCourse,
);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete course
 *     description: Soft deletes a course record.
 *     tags: [Courses]
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
 *         description: Course deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Course deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
courseRouter.delete("/:id", auth, CourseController.deleteCourse);

export default courseRouter;
