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
 *                     allOf:
  *                       - $ref: '#/components/schemas/Course'
  *                       - type: object
  *                         properties:
  *                           module_count:
  *                             type: integer
  *                             example: 5
  *                             description: Number of modules inside the course
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
 * /api/courses/user:
 *   get:
 *     summary: Get all courses available for user enrollment
 *     description: Retrieves a paginated list of all released courses with enrollment eligibility information. For each course, includes the user's current enrollment status (if any), whether they can enroll, and enrollment details. Uses the canUserEnrollCourse function to determine enrollability based on course prerequisites.
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
 *         name: tags
 *         required: false
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Optional tag filters for courses.
 *     responses:
 *       200:
 *         description: User courses retrieved successfully with enrollment eligibility
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
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: "Introduction to Web Development"
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         example: "Learn the fundamentals of web development"
 *                       status:
 *                         type: string
 *                         enum: [ENROLLED, ACTIVE, COMPLETED, EXPIRED]
 *                         nullable: true
 *                         description: User's enrollment status in this course. Null if not enrolled.
 *                         example: "COMPLETED"
 *                       released_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2026-05-09T00:00:00Z"
 *                       expected_completion_weeks:
 *                         type: integer
 *                         nullable: true
 *                         example: 4
 *                       must_complete_in_weeks:
 *                         type: integer
 *                         nullable: true
 *                         example: 8
 *                       badge_expire_in_months:
 *                         type: integer
 *                         example: 24
 *                       badge_img_url:
 *                         type: string
 *                         nullable: true
 *                         format: uri
 *                         example: "http://localhost:3000/public/courses/badges/badge_1.png"
 *                       cover_img_url:
 *                         type: string
 *                         nullable: true
 *                         format: uri
 *                         example: "http://localhost:3000/public/courses/covers/cover_1.png"
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             title:
 *                               type: string
 *                               example: "Web"
 *                             type:
 *                               type: string
 *                               example: "category"
 *                       is_enrollable:
 *                         type: boolean
 *                         description: Indicates whether the user can enroll in this course (prerequisites met, not already enrolled).
 *                         example: true
 *                       enrollment:
 *                         type: object
 *                         nullable: true
 *                         description: User's enrollment record if exists, null otherwise.
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           user_id:
 *                             type: integer
 *                             example: 5
 *                           course_id:
 *                             type: integer
 *                             example: 1
 *                           status:
 *                             type: string
 *                             enum: [ENROLLED, ACTIVE, COMPLETED, EXPIRED]
 *                             example: "COMPLETED"
 *                           enrolled_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-01-15T10:30:00Z"
 *                           completed_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: "2026-03-20T14:45:00Z"
 *                           reviewed_by_user_id:
 *                             type: integer
 *                             nullable: true
 *                             example: 2
 *                           reviewed_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           reviewed_comment:
 *                             type: string
 *                             nullable: true
 *                           badge_expire_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: "2028-03-20T14:45:00Z"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                       prerequisite_groups:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             course_id:
 *                               type: integer
 *                             prerequisites:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                   course_id:
 *                                     type: integer
 *                                   prerequisite_group_id:
 *                                     type: integer
 *                       final_quiz_max_score:
 *                         type: integer
 *                         nullable: true
 *                         example: 100
 *                       total_max_score:
 *                         type: integer
 *                         nullable: true
 *                         example: 100
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
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
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
courseRouter.get("/user", auth, CourseController.getAllUserCourses);

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
