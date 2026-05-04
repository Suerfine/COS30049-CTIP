import { Router } from "express";
import * as ModuleController from "../controllers/ModuleController";
import { auth } from "../middelware/Auth";

const moduleRouter = Router({ mergeParams: true });

/**
 * @swagger
 * /api/courses/{course_Id}/modules:
 *   get:
 *     summary: Get all modules for a course
 *     description: Returns all modules that belong to the specified course, ordered by module order.
 *     tags: [Modules]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_Id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Modules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Module'
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
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
moduleRouter.get(
  "/courses/:course_Id/modules",
  auth,
  ModuleController.getAllModules,
);

/**
 * @swagger
 * /api/courses/{course_Id}/modules:
 *   post:
 *     summary: Create a module for a course
 *     description: Creates a new module under the specified course.
 *     tags: [Modules]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: course_Id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: '#/components/schemas/CreateModuleRequest'
 *     responses:
 *       201:
 *         description: Module created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Module'
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
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
moduleRouter.post(
  "/courses/:course_Id/modules",
  auth,
  ModuleController.createModule,
);

/**
 * @swagger
 * /api/module/{module_id}:
 *   get:
 *     summary: Get module by ID
 *     description: Retrieves a specific module by its ID within the specified course.
 *     tags: [Modules]
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
 *         description: Module retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Module'
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
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
moduleRouter.get("/module/:module_id", auth, ModuleController.getModuleById);

/**
 * @swagger
 * /api/module/{module_id}:
 *   put:
 *     summary: Update module
 *     description: Updates one or more fields of a module in the specified course.
 *     tags: [Modules]
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
 *             $ref: '#/components/schemas/UpdateModuleRequest'
 *     responses:
 *       200:
 *         description: Module updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Module'
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
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
moduleRouter.put("/module/:module_id", auth, ModuleController.upsertModule);

/**
 * @swagger
 * /api/module/{module_id}:
 *   delete:
 *     summary: Delete module
 *     description: Soft deletes a module in the specified course.
 *     tags: [Modules]
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
 *         description: Module deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Module deleted successfully
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
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
moduleRouter.delete("/module/:module_id", auth, ModuleController.deleteModule);

export default moduleRouter;
