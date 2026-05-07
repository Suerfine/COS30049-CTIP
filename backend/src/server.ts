// Load environment variables from .env file FIRST (before all imports)
const dotenv = require("dotenv");
dotenv.config();
console.log("Loaded JWT_SECRET:", Boolean(process.env.JWT_SECRET));

import express, { Application, Request, Response } from "express";
import path from "path";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import sequelize from "./config/Database";
import "./models";
import routes from "./routes";
import swaggerSpec from "./config/Swagger";
import mqttService from "./iot/MqttService";

// Issue with augmeneted Express Request type not being recognized in middleware, so we need to redeclare it here
import { User } from "../src/models";
declare global {
  namespace Express {
    export interface Request {
      user?: User; // Add the user property to the Request interface
    }
  }
}

const app: Application = express();
const port = Number(process.env.PORT) || 5000;

// Configure storage path for public assets (e.g. user profile pictures)
const publicStoragePath = path.resolve(__dirname, "../storage/public");

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes
app.use(
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Serve public storage assets
app.use("/public", express.static(publicStoragePath));

// Basic route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript + Express!");
});

// Swagger docs
app.use(
  "/api/docs",
  swaggerUi.serve,
  // enable persistent authorization in the UI so the "Authorize" dialog
  // correctly applies the Bearer token to Try it Out requests
  swaggerUi.setup(swaggerSpec, undefined, {
    swaggerOptions: { persistAuthorization: true },
  }),
);

// Mount ALL routes on /api
app.use("/api", routes);

const startServer = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Initialize MQTT service
    const isMqttEnabled = process.env.ENABLE_MQTT === "true";

    if (isMqttEnabled) {
      try {
        await mqttService.connect();
        console.log("MQTT service initialized successfully.");
      } catch (mqttError) {
        console.error("Failed to initialize MQTT service:", mqttError);
        // We don't crash the server if MQTT fails
      }
    } else {
      console.log("MQTT service is DISABLED (ENABLE_MQTT is not true).");
    }

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error occurred while starting the server:", error);
    process.exit(1);
  }
};

startServer();
