import { Router } from "express";
import * as PaymentController from "../controllers/PaymentController";
import { auth } from "../middelware/Auth";
import { validate } from "../middelware/Validate";
import { body, param } from "express-validator";
import { createUploader } from "../middelware/FileUpload";

const paymentRouter = Router();

const uploadReceipt = createUploader({
  access: "private",
  subfolder: "payments/receipts",
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSizeMB: 10,
});

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: List all payments with search and pagination
 *     description: Retrieve all payment records with optional search, status filtering, and pagination.
 *     tags: [Payments]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search by user firstname, lastname, course code, or course title
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [All, pending, paid, failed]
 *         description: Filter payments by status
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: size
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Payment list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *                 page:
 *                   type: integer
 *                 size:
 *                   type: integer
 *                 totalElements:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Unauthorized
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
paymentRouter.get("/", auth, PaymentController.getAllPayments);

/**
 * @swagger
 * /api/payments/user/{userId}:
 *   get:
 *     summary: Get payment history for a specific user
 *     description: Retrieve all payment records belonging to a user ordered by latest payment.
 *     tags: [Payments]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User payment history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Invalid user_id
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
 *         description: User or payment records not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
paymentRouter.get("/user/:userId", auth, PaymentController.getPaymentsByUser);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get single payment details
 *     description: Retrieve payment details by payment ID including user, course, and enrollment information.
 *     tags: [Payments]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Invalid payment_id
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
 *         description: Payment record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
paymentRouter.get("/:id", auth, PaymentController.getPaymentById);

/**
 * @swagger
 * /api/payments/{paymentId}/receipt:
 *   get:
 *     summary: Download payment receipt file
 *     description: Retrieve and download the receipt file associated with a specific payment. Returns the receipt file as a binary attachment.
 *     tags: [Payments]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Receipt file retrieved successfully
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/webp:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid payment_id
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
 *         description: Payment record not found or receipt file not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error retrieving receipt file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
paymentRouter.get(
  "/:paymentId/receipt",
  auth,
  PaymentController.getReceiptFile,
);

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Submit a new payment receipt
 *     description: Create a payment submission with uploaded bank receipt for enrollment verification.
 *     tags: [Payments]
 *     security:
 *       - OAuth2: ["all"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - enrollment_id
 *               - course_id
 *               - amount
 *               - receipt_filepath
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 1
 *               enrollment_id:
 *                 type: integer
 *                 example: 10
 *               course_id:
 *                 type: integer
 *                 example: 5
 *               amount:
 *                 type: number
 *                 example: 150.00
 *               receipt_filepath:
 *                 type: string
 *                 example: uploads/receipts/payment1.jpg
 *     responses:
 *       201:
 *         description: Payment submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Validation error or missing required fields
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
paymentRouter.post(
  "/",
  auth,

  uploadReceipt.single("receipt"),

  [
    body("enrollment_id").isInt().notEmpty(),
    body("course_id").isInt().notEmpty(),
    body("amount").isNumeric().notEmpty(),
  ],

  validate,
  PaymentController.submitPayment,
);

/**
 * @swagger
 * /api/payments/{payment_id}/status/{status}:
 *   patch:
 *     summary: Admin verify or reject payment
 *     description: Update payment verification status and automatically update enrollment status.
 *     tags: [Payments]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: payment_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [paid, failed]
 *         description: Verification status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - admin_id
 *             properties:
 *               admin_id:
 *                 type: integer
 *                 example: 1
 *               admin_remark:
 *                 type: string
 *                 example: Payment receipt verified successfully
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment verified as paid and Enrollment set to IN_PROGRESS
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Invalid payment_id, status, or missing admin_id
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
 *         description: Payment or enrollment not found
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
paymentRouter.patch(
  "/:payment_id/status/:status",
  auth,
  [
    param("status").isIn(["paid", "failed"]),
    body("admin_id").isInt().notEmpty(),
    body("admin_remark").optional().isString(),
  ],
  validate,
  PaymentController.verifyPayment,
);

export default paymentRouter;
