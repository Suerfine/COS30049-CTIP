import { Router } from "express";
import * as ProgressController from "../controllers/ProgressController";
import { auth } from "../middelware/Auth";

const ProgressRouter = Router();

/**
 * @swagger
 * /api/progress/course/{courseId}:
 *   get:
 *     summary: Get course progress
 *     description: Returns the current progress score for a course.
 *     tags: [Progress]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: integer
 *                   example: 75
 *                 maxScore:
 *                   type: integer
 *                   example: 100
 */
ProgressRouter.get(
  "/course/:courseId",
  auth,
  ProgressController.courseProgress,
);

/**
 * @swagger
 * /api/progress/module/{moduleId}:
 *   get:
 *     summary: Get module progress
 *     description: Returns the current progress score for a module.
 *     tags: [Progress]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: integer
 *                   example: 75
 *                 maxScore:
 *                   type: integer
 *                   example: 100
 */
ProgressRouter.get(
  "/module/:moduleId",
  auth,
  ProgressController.moduleProgress,
);

/**
 * @swagger
 * /api/progress/element/{elementId}:
 *   get:
 *     summary: Get element progress
 *     description: Returns the current progress score for an element.
 *     tags: [Progress]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: elementId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Element progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: integer
 *                   example: 75
 *                 maxScore:
 *                   type: integer
 *                   example: 100
 */
ProgressRouter.get(
  "/element/:elementId",
  auth,
  ProgressController.elementProgress,
);
export default ProgressRouter;
