import { Router } from "express";
import * as CourseController from "../controllers/CourseController";
import { auth } from "../middelware/Auth";
import { uploadPrivateDocument } from "../middelware/PrivateDocumentUpload";
import moduleRouter from "./ModuleRoute";
import discussionRouter from "./DiscussionRoute";
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
courseRouter.use("/:id/discussion", discussionRouter);

/**
 * @swagger
 * /api/courses/user:
 *   get:
 *     summary: Get courses for the authenticated user
 *     description: Retrieves a paginated list of courses, including the user's enrollment status for each.
 *     tags: [Courses]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number to retrieve.
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items per page.
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *         style: form
 *         explode: true
 *         description: An array of tag IDs to filter courses by.
 *     responses:
 *       200:
 *         description: A paginated list of the user's courses with enrollment status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserCourseEnrollmentResponse'
 *                 page:
 *                   type: integer
 *                 size:
 *                   type: integer
 *                 totalElements:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 first:
 *                   type: boolean
 *                 last:
 *                   type: boolean
 */
courseRouter.get("/user", auth, CourseController.getAllUserCourses);

function parseNumericIdArray(value: unknown): number[] {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  let parsedValue: unknown;
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (trimmedValue === "") {
      return [];
    }

    if (trimmedValue.startsWith("[")) {
      parsedValue = JSON.parse(trimmedValue);
    } else if (trimmedValue.includes(",")) {
      parsedValue = trimmedValue
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part !== "");
    } else {
      parsedValue = [trimmedValue];
    }
  } else if (Array.isArray(value)) {
    parsedValue = value;
  } else if (typeof value === "number") {
    parsedValue = [value];
  } else {
    throw new Error("tag_ids must be an array");
  }

  if (!Array.isArray(parsedValue)) {
    throw new Error("tag_ids must be an array");
  }

  return parsedValue.map((id) => {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw new Error("tag_ids must contain positive integers");
    }
    return parsedId;
  });
}

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     description: Creates a course with optional badge image, status, release timestamp, and prerequisites (flat `prerequisite_course_ids`, works like `tag_ids`).
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
  uploadCourseBadge.fields([
    { name: "badge", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  [
    body("title").isString().notEmpty(),
    body("description").optional().isString(),
    body("status").optional().isIn(Object.values(CourseStatus)),
    body("tag_ids")
      .optional()
      .custom((value) => {
        parseNumericIdArray(value);
        return true;
      }),
    body("prerequisite_course_ids")
      .optional()
      .custom((value) => {
        parseNumericIdArray(value);
        return true;
      }),
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
 *     description: Updates an existing course with one or more fields, including status, release timestamp, prerequisites (flat `prerequisite_course_ids`, works like `tag_ids`), and optional badge image.
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
