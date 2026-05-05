import { Router } from "express";
import * as SensorLogController from "../controllers/SensorLogController";
import { auth } from "../middelware/Auth";
import { body, param } from "express-validator";
import { validate } from "../middelware/Validate";

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/sensors/{sensor_id}/logs:
 *   post:
 *     summary: Create a new sensor log
 *     description: Creates a new log entry for a specific sensor with status and optional data.
 *     tags: [Sensor Logs]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: sensor_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sensor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSensorLogRequest'
 *     responses:
 *       201:
 *         description: Sensor log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SensorLog'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Sensor not found
 */
router.post(
  "/sensors/:sensor_id/logs",
  auth,
  [
    param("sensor_id").isInt(),
    body("status").isString().notEmpty(),
    body("data").optional(),
  ],
  validate,
  SensorLogController.createLog,
);

/**
 * @swagger
 * /api/sensors/logs:
 *   get:
 *     summary: Get all sensor logs
 *     description: Returns a paginated list of all sensor logs across all sensors.
 *     tags: [Sensor Logs]
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
 *           example: created_at desc
 *       - in: query
 *         name: filter
 *         required: false
 *         schema:
 *           type: string
 *           example: status eq normal
 *         description: Filter expression parsed by backend pagination utility.
 *     responses:
 *       200:
 *         description: Sensor logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSensorLogResponse'
 */
router.get("/sensors/logs", SensorLogController.getAllLogs);

/**
 * @swagger
 * /api/sensors/{sensor_id}/logs:
 *   get:
 *     summary: Get all logs for a specific sensor
 *     description: Returns a paginated list of logs for a specific sensor.
 *     tags: [Sensor Logs]
 *     parameters:
 *       - in: path
 *         name: sensor_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sensor ID
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
 *         description: Sort expression format "attribute asc|desc".
 *         schema:
 *           type: string
 *           example: created_at desc
 *     responses:
 *       200:
 *         description: Sensor logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSensorLogResponse'
 */
router.get("/sensors/:sensor_id/logs", SensorLogController.getAllSensorLogs);

/**
 * @swagger
 * /api/logs/{id}:
 *   get:
 *     summary: Get a sensor log by ID
 *     description: Returns a specific sensor log entry by its ID.
 *     tags: [Sensor Logs]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sensor log ID
 *     responses:
 *       200:
 *         description: Sensor log retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SensorLog'
 *       404:
 *         description: Sensor log not found
 */
router.get(
  "/logs/:id",
  auth,
  [param("id").isInt()],
  validate,
  SensorLogController.getLogById,
);

/**
 * @swagger
 * /api/logs/{id}:
 *   put:
 *     summary: Update a sensor log
 *     description: Updates a sensor log entry with new status and/or data.
 *     tags: [Sensor Logs]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sensor log ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSensorLogRequest'
 *     responses:
 *       200:
 *         description: Sensor log updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SensorLog'
 *       404:
 *         description: Sensor log not found
 */
router.put(
  "/logs/:id",
  auth,
  [
    param("id").isInt(),
    body("status").optional().isString(),
    body("data").optional(),
  ],
  validate,
  SensorLogController.updateLog,
);

/**
 * @swagger
 * /api/logs/{id}:
 *   delete:
 *     summary: Delete a sensor log
 *     description: Deletes a sensor log entry by its ID.
 *     tags: [Sensor Logs]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sensor log ID
 *     responses:
 *       200:
 *         description: Sensor log deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sensor log deleted successfully
 *       404:
 *         description: Sensor log not found
 */
router.delete(
  "/logs/:id",
  auth,
  [param("id").isInt()],
  validate,
  SensorLogController.deleteLog,
);

export default router;
