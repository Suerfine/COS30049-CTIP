import { Router } from "express";
import * as PageController from "../controllers/PageController";
import { auth } from "../middelware/Auth";
import elementRouter from "./ElementRoute";

const pageRouter = Router({ mergeParams: true });

pageRouter.use("/:page_id/elements", elementRouter);

/**
 * @swagger
 * /api/courses/{course_Id}/modules/{module_id}/pages:
 *   get:
 *     summary: Get all pages for a module
 *     description: Returns all pages that belong to the specified module, ordered by page order.
 *     tags: [Pages]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_Id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: module_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Page'
 *       400:
 *         description: Invalid path parameters
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
 *         description: Course or module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pageRouter.get("/", auth, PageController.getAllPages);

/**
 * @swagger
 * /api/courses/{course_Id}/modules/{module_id}/pages:
 *   post:
 *     summary: Create a page for a module
 *     description: Creates a new page under the specified module.
 *     tags: [Pages]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_Id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: module_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: '#/components/schemas/CreatePageRequest'
 *     responses:
 *       201:
 *         description: Page created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Page'
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
 *       404:
 *         description: Course or module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pageRouter.post("/", auth, PageController.createPage);

/**
 * @swagger
 * /api/courses/{course_Id}/modules/{module_id}/pages/{page_id}:
 *   get:
 *     summary: Get page by ID
 *     description: Retrieves a specific page by its ID within the specified module.
 *     tags: [Pages]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_Id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: module_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: page_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Page'
 *       400:
 *         description: Invalid path parameters
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
 *         description: Course, module, or page not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pageRouter.get("/:page_id", auth, PageController.getPageById);

/**
 * @swagger
 * /api/courses/{course_Id}/modules/{module_id}/pages/{page_id}:
 *   put:
 *     summary: Update page
 *     description: Updates one or more fields of a page in the specified module.
 *     tags: [Pages]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_Id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: module_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: page_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePageRequest'
 *     responses:
 *       200:
 *         description: Page updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Page'
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
 *         description: Course, module, or page not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pageRouter.put("/:page_id", auth, PageController.upsertPage);

/**
 * @swagger
 * /api/courses/{course_Id}/modules/{module_id}/pages/{page_id}:
 *   delete:
 *     summary: Delete page
 *     description: Soft deletes a page in the specified module.
 *     tags: [Pages]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_Id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: module_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: page_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Page deleted successfully
 *       400:
 *         description: Invalid path parameters
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
 *         description: Course, module, or page not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
pageRouter.delete("/:page_id", auth, PageController.deletePage);

export default pageRouter;
