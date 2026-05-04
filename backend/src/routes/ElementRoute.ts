import { Router, Request, Response, NextFunction } from "express";
import * as ElementController from "../controllers/ElementController";
import { auth } from "../middelware/Auth";
import { uploadPrivateDocument } from "../middelware/PrivateDocumentUpload";
import { parseNestedFormData } from "../utils/parseNestedFormData";

const elementRouter = Router({ mergeParams: true });

const uploadElementDocument = uploadPrivateDocument({
  subfolder: "elements/documents",
  allowedMimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ],
});

// Middleware to parse nested form-data structures
const parseNestedForm = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") {
    req.body = parseNestedFormData(req.body);
  }
  next();
};

/**
 * @swagger
 * /api/courses/{course_Id}/modules/{module_id}/pages/{page_id}/elements:
 *   get:
 *     summary: Get all elements for a page
 *     description: Returns all elements that belong to the specified page, ordered by element order.
 *     tags: [Elements]
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
 *         description: Elements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Element'
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
elementRouter.get("/", auth, ElementController.getAllElements);

/**
 * @swagger
 * /api/courses/{course_Id}/modules/{module_id}/pages/{page_id}/elements:
 *   post:
 *     summary: Create a single element
 *     description: Creates a new element in a specified page within the module. Supports optional file upload for FILE type elements.
 *     tags: [Elements]
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
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateElementRequest'
 *     responses:
 *       201:
 *         description: Element created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Element'
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
 *         description: Course, module, or page not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
elementRouter.post(
  "/",
  auth,
  uploadElementDocument.single("file"),
  ElementController.createElement,
);

// /**
//  * @swagger
//  * /api/courses/{course_Id}/modules/{module_id}/pages/{page_id}/elements/bulk:
//  *   post:
//  *     summary: Bulk create elements
//  *     description: Creates multiple elements in a single request. Each element is sent as form-data with nested properties (e.g., elements[0][order], elements[0][type], elements[0][content]). Optional file uploads are supported for FILE type elements using the files field.
//  *     tags: [Elements]
//  *     security:
//  *       - OAuth2: ["all"]
//  *     parameters:
//  *       - in: path
//  *         name: course_Id
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: module_id
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: page_id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             required: ["elements"]
//  *             properties:
//  *               elements:
//  *                 type: array
//  *                 description: Array of elements to create. Each element sent as nested form fields (e.g., elements[0][order], elements[1][order]).
//  *                 items:
//  *                   type: object
//  *                   required: ["order", "type", "content"]
//  *                   properties:
//  *                     order:
//  *                       type: integer
//  *                       example: 1
//  *                       description: Display order within the page.
//  *                     type:
//  *                       type: string
//  *                       enum: ["text", "image", "video", "file", "quiz_objective"]
//  *                       example: "text"
//  *                     content:
//  *                       type: string
//  *                       example: '{"text":"Element content"}'
//  *                       description: JSON content as a string.
//  *                     score:
//  *                       type: integer
//  *                       nullable: true
//  *                       example: 10
//  *               files:
//  *                 type: array
//  *                 items:
//  *                   type: string
//  *                   format: binary
//  *                 description: Optional array of files for FILE type elements. Files are matched by array index.
//  *     responses:
//  *       201:
//  *         description: Elements created successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/Element'
//  *       400:
//  *         description: Invalid request data
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ErrorResponse'
//  *       401:
//  *         description: Unauthorized
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ErrorResponse'
//  *       404:
//  *         description: Course, module, or page not found
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ErrorResponse'
//  */
// elementRouter.post(
//   "/bulk",
//   auth,
//   uploadElementDocument.array("files"),
//   parseNestedForm,
//   ElementController.bulkCreateElements,
// );

/**
 * @swagger
 * /api/courses/{course_Id}/modules/{module_id}/pages/{page_id}/elements/{element_id}:
 *   get:
 *     summary: Get element by ID
 *     description: Retrieves a specific element by its ID within the specified page.
 *     tags: [Elements]
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
 *       - in: path
 *         name: element_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Element retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Element'
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
 *         description: Course, module, or element not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
elementRouter.get("/:element_id", auth, ElementController.getElementById);

/**
 * @swagger
 * /api/courses/{course_Id}/modules/{module_id}/pages/{page_id}/elements/{element_id}:
 *   put:
 *     summary: Update a single element
 *     description: Updates one or more fields of an element. Supports optional file upload for FILE type elements.
 *     tags: [Elements]
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
 *       - in: path
 *         name: element_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateElementRequest'
 *     responses:
 *       200:
 *         description: Element updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Element'
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
 *         description: Course, module, or element not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
elementRouter.put(
  "/:element_id",
  auth,
  uploadElementDocument.single("file"),
  ElementController.updateElement,
);

// /**
//  * @swagger
//  * /api/courses/{course_Id}/modules/{module_id}/pages/{page_id}/elements/bulk:
//  *   put:
//  *     summary: Bulk update elements
//  *     description: Updates multiple elements in a single request. Each element must include an id field. Element updates are sent as nested form fields (e.g., elements[0][id], elements[0][order]). Optional file uploads are supported for FILE type elements using the files field.
//  *     tags: [Elements]
//  *     security:
//  *       - OAuth2: ["all"]
//  *     parameters:
//  *       - in: path
//  *         name: course_Id
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: module_id
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: page_id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             required: ["elements"]
//  *             properties:
//  *               elements:
//  *                 type: array
//  *                 description: Array of elements to update. Each element sent as nested form fields (e.g., elements[0][id], elements[0][order]). Only id is required; other fields are optional.
//  *                 items:
//  *                   type: object
//  *                   required: ["id"]
//  *                   properties:
//  *                     id:
//  *                       type: integer
//  *                       example: 1
//  *                       description: ID of the element to update (required).
//  *                     order:
//  *                       type: integer
//  *                       example: 2
//  *                       description: Updated display order (optional).
//  *                     content:
//  *                       type: string
//  *                       example: '{"text":"Updated content"}'
//  *                       description: Updated JSON content as a string (optional).
//  *                     score:
//  *                       type: integer
//  *                       nullable: true
//  *                       example: 15
//  *                       description: Updated points (optional).
//  *               files:
//  *                 type: array
//  *                 items:
//  *                   type: string
//  *                   format: binary
//  *                 description: Optional array of files for FILE type elements. Files are matched by array index.
//  *     responses:
//  *       200:
//  *         description: Elements updated successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/Element'
//  *       400:
//  *         description: Invalid update payload
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ErrorResponse'
//  *       401:
//  *         description: Unauthorized
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ErrorResponse'
//  *       404:
//  *         description: Course, module, or element not found
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ErrorResponse'
//  */
// // elementRouter.put(
// //   "/bulk",
// //   auth,
// //   uploadElementDocument.array("files"),
// //   parseNestedForm,
// //   ElementController.bulkUpdateElements,
// // );

/**
 * @swagger
 * /api/courses/{course_Id}/modules/{module_id}/pages/{page_id}/elements/{element_id}:
 *   delete:
 *     summary: Delete element
 *     description: Soft deletes an element in the specified page.
 *     tags: [Elements]
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
 *       - in: path
 *         name: element_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Element deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Element deleted successfully
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
 *         description: Course, module, or element not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
elementRouter.delete("/:element_id", auth, ElementController.deleteElement);

/**
 * @swagger
 * /api/courses/{course_Id}/modules/{module_id}/pages/{page_id}/elements/{element_id}/file:
 *   get:
 *     summary: Download element file
 *     description: Downloads the file associated with an element. Only available for elements with file_id set.
 *     tags: [Elements]
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
 *       - in: path
 *         name: element_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
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
 *         description: Element or associated file not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
elementRouter.get("/:element_id/file", auth, ElementController.getElementFile);


// /**
//  * @swagger
//  * /api/courses/{course_Id}/modules/{module_id}/pages/{page_id}/elements/{element_id}/register:
//  *   patch:
//  *     summary: Register for a workshop session
//  *     description: Decrements the available slots and adds the user registration (user_id and timestamp) into the element's content JSON.
//  *     tags: [Elements]
//  *     security:
//  *       - OAuth2: ["all"]
//  *     parameters:
//  *       - in: path
//  *         name: course_Id
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: module_id
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: page_id
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: element_id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: ["sessionId", "userId"]
//  *             properties:
//  *               sessionId:
//  *                 type: string
//  *                 description: The unique ID of the session the user is picking.
//  *               userId:
//  *                 type: integer
//  *                 description: The ID of the Park Guide registering.
//  *     responses:
//  *       200:
//  *         description: Successfully registered for the workshop
//  *       400:
//  *         description: No slots available or already registered
//  */
// elementRouter.patch(
//   "/:element_id/register",
//   auth,
//   ElementController.registerForWorkshop
// );

// /**
//  * @swagger
//  * /api/courses/{course_Id}/workshops:
//  *   get:
//  *     summary: Get a summary of all workshops for a course
//  *     description: Returns all elements of type 'workshop' belonging to the specified course, regardless of module.
//  *     tags: [Elements]
//  *     security:
//  *       - OAuth2: ["all"]
//  *     parameters:
//  *       - in: path
//  *         name: course_Id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Course workshop summary retrieved successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/Element'
//  */
// elementRouter.get(
//   "/course-summary", // Renamed to avoid conflict with module-level routes
//   auth,
//   ElementController.getCourseWorkshopsSummary
// );

export default elementRouter;
