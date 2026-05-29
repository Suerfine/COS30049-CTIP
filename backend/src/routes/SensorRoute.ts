import { Router } from "express";
import * as SensorController from "../controllers/SensorController";
import { auth } from "../middelware/Auth";
import { validate } from "../middelware/Validate";
import { body } from "express-validator";
const sensorRouter = Router();

/**
 * @swagger
 * /api/sensors:
 *   post:
 *     summary: Create a new sensor
 *     description: Creates a new sensor with the provided name, type, longitude, and latitude.
 *     tags: [Sensors]
 *     security:
 *       - OAuth2: ["all"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSensorRequest'
 *     responses:
 *       201:
 *         description: Sensor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sensor created successfully
 *       400:
 *         description: Invalid request data
 */
sensorRouter.post(
  "/",
  [
    body("name").isString().notEmpty(),
    body("type").isString().notEmpty(),
    body("longitude").isNumeric().notEmpty(),
    body("latitude").isNumeric().notEmpty(),
  ],
  validate,
  SensorController.createSensor,
);

/**
 * @swagger
 * /api/sensors:
 *   get:
 *     summary: Get all sensors
 *     description: Returns a paginated list of all sensors. Supports filtering, sorting, and pagination query parameters.
 *     tags: [Sensors]
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
 *           example: name eq Temperature Sensor A
 *         description: Filter expression parsed by backend pagination utility.
 *     responses:
 *       200:
 *         description: Sensors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSensorResponse'
 */
sensorRouter.get("/", SensorController.getAllSensors);

/**
 * @swagger
 * /api/sensors/{id}:
 *   get:
 *     summary: Get a sensor by ID
 *     description: Returns a specific sensor by its ID.
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sensor ID
 *     responses:
 *       200:
 *         description: Sensor retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       404:
 *         description: Sensor not found
 */
sensorRouter.get("/:id", SensorController.getSensorById);

/**
 * @swagger
 * /api/sensors/{id}:
 *   put:
 *     summary: Update a sensor
 *     description: Updates a sensor with the provided fields.
 *     tags: [Sensors]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sensor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSensorRequest'
 *     responses:
 *       200:
 *         description: Sensor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       404:
 *         description: Sensor not found
 */
sensorRouter.put(
  "/:id",
  [
    body("name").optional().isString(),
    body("type").optional().isString(),
    body("location").optional().isString(),
  ],
  validate,
  SensorController.upsertSensor,
);

/**
 * @swagger
 * /api/sensors/{id}:
 *   delete:
 *     summary: Delete a sensor
 *     description: Deletes a sensor by its ID.
 *     tags: [Sensors]
 *     security:
 *       - OAuth2: ["all"]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sensor ID
 *     responses:
 *       200:
 *         description: Sensor deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sensor deleted successfully
 *       404:
 *         description: Sensor not found
 */
sensorRouter.delete("/:id", SensorController.deleteSensor);

export default sensorRouter;
