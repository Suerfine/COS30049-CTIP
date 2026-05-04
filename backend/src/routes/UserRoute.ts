import { Router, Request, Response } from "express";
import * as UserController from "../controllers/UserController";
import { auth } from "../middelware/Auth";
import profilePictureUpload from "../middelware/UserPfpUpload";
import { validate } from "../middelware/Validate";
import { body } from "express-validator";
import { UserRoles } from "../enum/UserRoles";
import { uploadAvatar } from "../config/multer";

const userRouter = Router();
const pfpUploader = uploadAvatar();
const userPfpUpload = profilePictureUpload.single("pfp");
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Creates a user using form inputs in Swagger UI.
 *     tags: [Users]
 *     security:
 *       - OAuth2: ["all"]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
userRouter.post(
  "/",
  auth,
  pfpUploader.single("pfp"),
  [
    body("username").isString().notEmpty(),
    body("password").isString().isLength({ min: 6 }),
    body("role").isIn(Object.values(UserRoles)),
    body("firstname").isString().notEmpty(),
    body("lastname").isString().notEmpty(),
    body("identification").isString().notEmpty(),
    body("personal_email").isEmail(),
    body("tel").isString().notEmpty(),
  ],
  validate,
  UserController.createUser,
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Returns a paginated list of users. Supports filtering, sorting, and pagination query parameters.
 *     tags: [Users]
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
 *         description: Sort expression format "attribute asc|desc". Multiple sort criteria can be separated by commas.
 *         schema:
 *           type: string
 *           example: id desc
 *       - in: query
 *         name: filter
 *         required: false
 *         schema:
 *           type: string
 *           example: role eq park_guide
 *         description: Filter expression parsed by backend pagination utility.
 *       - in: query
 *         name: isDeleted
 *         required: false
 *         description: When true, include soft-deleted users in the result set. Defaults to false.
 *         schema:
 *           type: boolean
 *           default: false
 *           example: false
 *     responses:
 *       200:
 *         description: Users retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 size:
 *                   type: integer
 *                   example: 10
 *                 totalElements:
 *                   type: integer
 *                   example: 42
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 _links:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                     nullable: true
 */
userRouter.get("/", auth, UserController.getAllUsers);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get the currently logged in user
 *     description: Returns the profile of the authenticated user associated with the current request.
 *     tags: [Users]
 *     security:
 *       - OAuth2: ["all"]
 *     responses:
 *       200:
 *         description: Current user retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
userRouter.get("/me", auth, UserController.getCurrentUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Read single user
userRouter.get("/:id", auth, UserController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Admin can update any user. Non-admin can update only their own account. Pass in attributes to update in form inputs in Swagger UI. Only include the "pfp" field if you want to update the profile picture. If "pfp" is included, it will replace the existing profile picture.
 *     tags: [Users]
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
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
// Update user
userRouter.put(
  "/:id",
  auth,
  pfpUploader.single("pfp"),
  [
    body("username").isString().optional().notEmpty(),
    body("role").isIn(Object.values(UserRoles)).optional(),
    body("firstname").isString().optional().notEmpty(),
    body("lastname").isString().optional().notEmpty(),
    body("identification").isString().optional().notEmpty(),
    body("personal_email").isEmail().optional(),
    body("tel").isString().optional().notEmpty(),
  ],
  UserController.upsertUser,
);

/**
 * @swagger
 * /api/users/{id}/change-password:
 *   put:
 *     summary: Change user password
 *     description: Changes the password for the authenticated user's account. The current password must be provided.
 *     tags: [Users]
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Invalid request or old password mismatch
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
userRouter.put(
  "/:id/change-password",
  auth,
  [
    body("old_password").isString().notEmpty(),
    body("new_password").isString().isLength({ min: 6 }),
  ],
  validate,
  UserController.changePassword,
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Soft deletes a user by setting deleted_at.
 *     tags: [Users]
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
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 */
// Delete user
userRouter.delete("/:id", UserController.deleteUser);

export default userRouter;
