import { Router } from "express";
import * as DiscussionController from "../controllers/DiscussionController";
import { auth } from "../middelware/Auth";
import { validate } from "../middelware/Validate";
import { body } from "express-validator";

const discussionRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/courses/{course_id}/discussion:
 *   post:
 *     summary: Create a new discussion
 *     description: Creates a new discussion thread for a course.
 *     tags: [Discussions]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the course containing the discussion.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Discussion on Module 1"
 *               is_public:
 *                 type: boolean
 *                 default: false
 *                 example: true
 *     responses:
 *       201:
 *         description: Discussion created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Discussion'
 *       400:
 *         description: Invalid request data or course ID
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
discussionRouter.post(
  "/",
  auth,
  [
    body("title").isString().notEmpty(),
    body("is_public").optional().isBoolean(),
  ],
  validate,
  DiscussionController.createDiscussion,
);

/**
 * @swagger
 * /api/courses/{course_id}/discussion:
 *   get:
 *     summary: Get all discussions for a course
 *     description: Returns a paginated list of discussions for a specific course with optional filtering and sorting.
 *     tags: [Discussions]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the course.
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
 *         description: When true, include soft-deleted discussions in the result set.
 *     responses:
 *       200:
 *         description: Discussions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Discussion'
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
 *       400:
 *         description: Invalid course ID
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
discussionRouter.get("/", auth, DiscussionController.getAllDiscussions);

/**
 * @swagger
 * /api/courses/{course_id}/discussion/{discussion_id}:
 *   get:
 *     summary: Get discussion by ID
 *     description: Retrieves a specific discussion for a course.
 *     tags: [Discussions]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the course.
 *       - in: path
 *         name: discussion_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the discussion to retrieve.
 *     responses:
 *       200:
 *         description: Discussion retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Discussion'
 *       400:
 *         description: Invalid course or discussion ID
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
 *         description: Discussion not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
discussionRouter.get(
  "/:discussion_id",
  auth,
  DiscussionController.getDiscussionById,
);

/**
 * @swagger
 * /api/courses/{course_id}/discussion/{discussion_id}:
 *   put:
 *     summary: Update discussion
 *     description: Updates an existing discussion for a course.
 *     tags: [Discussions]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the course.
 *       - in: path
 *         name: discussion_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the discussion to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Discussion Title"
 *               is_public:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Discussion updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Discussion'
 *       400:
 *         description: Invalid course or discussion ID
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
 *         description: Discussion not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
discussionRouter.put(
  "/:discussion_id",
  auth,
  [
    body("title").optional().isString().notEmpty(),
    body("is_public").optional().isBoolean(),
  ],
  validate,
  DiscussionController.updateDiscussion,
);

/**
 * @swagger
 * /api/courses/{course_id}/discussion/{discussion_id}:
 *   delete:
 *     summary: Delete discussion
 *     description: Soft deletes a discussion for a course.
 *     tags: [Discussions]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the course.
 *       - in: path
 *         name: discussion_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the discussion to delete.
 *     responses:
 *       200:
 *         description: Discussion deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Discussion deleted successfully"
 *       400:
 *         description: Invalid course or discussion ID
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
 *         description: Discussion not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
discussionRouter.delete(
  "/:discussion_id",
  auth,
  DiscussionController.deleteDiscussion,
);

export default discussionRouter;
