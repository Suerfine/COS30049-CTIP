import { Router } from "express";
import { body } from "express-validator";
import * as TagController from "../controllers/TagController";
import { auth } from "../middelware/Auth";
import { validate } from "../middelware/Validate";

const tagRouter = Router();

/**
 * @swagger
 * /api/tags:
 *   post:
 *     summary: Create a tag
 *     tags: [Tags]
 *     security:
 *       - OAuth2: ["all"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Safety
 *               type:
 *                 type: string
 *                 example: course
 *     responses:
 *       201:
 *         description: Tag created
 */
tagRouter.post(
  "/",
  auth,
  [body("title").isString().notEmpty(), body("type").isString().notEmpty()],
  validate,
  TagController.createTag,
);

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: Get all tags
 *     tags: [Tags]
 *     security:
 *       - OAuth2: ["all"]
 *     responses:
 *       200:
 *         description: List of tags
 */
tagRouter.get("/", auth, TagController.getAllTags);

/**
 * @swagger
 * /api/tags/{id}:
 *   get:
 *     summary: Get a tag by ID
 *     tags: [Tags]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tag
 *       404:
 *         description: Tag not found
 */
tagRouter.get("/:id", auth, TagController.getTagById);

/**
 * @swagger
 * /api/tags/{id}:
 *   put:
 *     summary: Update a tag
 *     tags: [Tags]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Compliance
 *               type:
 *                 type: string
 *                 example: course
 *     responses:
 *       200:
 *         description: Tag updated
 *       404:
 *         description: Tag not found
 */
tagRouter.put(
  "/:id",
  auth,
  [
    body("title").optional().isString().notEmpty(),
    body("type").optional().isString().notEmpty(),
  ],
  validate,
  TagController.upsertTag,
);

/**
 * @swagger
 * /api/tags/{id}:
 *   delete:
 *     summary: Delete a tag
 *     tags: [Tags]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tag deleted
 *       404:
 *         description: Tag not found
 */
tagRouter.delete("/:id", auth, TagController.deleteTag);

export default tagRouter;
