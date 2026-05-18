// Load environment variables from .env file FIRST (before all imports)
const dotenv = require("dotenv");
dotenv.config();
console.log("Loaded JWT_SECRET:", Boolean(process.env.JWT_SECRET));

import express, { Application, NextFunction, Request, Response } from "express";
import path from "path";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import sequelize from "./config/Database";
import "./models/ArModel";
import routes from "./routes";
import swaggerSpec from "./config/Swagger";
import mqttService from "./iot/MqttService";
import { registerJobs } from "./jobs";
import * as ArModelController from "./controllers/ArModelController";

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

// Enable URL-encoded form data parsing with a 200mb limit
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

// Middleware to parse JSON bodies (annotated anomaly frames are base64-encoded and can be large)
app.use(express.json({ limit: "50mb" }));

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

app.get("/ar-viewer/:id", ArModelController.getArViewer);

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

app.use(
  (
    err: Error & { status?: number },
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (
      err.name === "MulterError" ||
      err.message.startsWith("Invalid file type.")
    ) {
      return res.status(400).json({ message: err.message });
    }

    if (typeof err.status === "number") {
      return res.status(err.status).json({ message: err.message });
    }

    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  },
);

const startServer = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Initialize MQTT service if enabled (but don't crash the server if it fails)
    if (process.env.ENABLE_MQTT === "true") {
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

    // Register all jobs
    registerJobs();

    // Sync database schemas (creates missing tables, won't alter existing ones)
    await sequelize.sync();
    console.log("Database tables synchronized successfully.");

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
      // Also log the local network IP address for easier access from other devices
      const getLocalIpAddress = (): string => {
        const interfaces = require("os").networkInterfaces();
        for (const name of Object.keys(interfaces)) {
          for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
              return iface.address;
            }
          }
        }
        return "localhost";
      };
      console.log(
        `Local network access: http://${getLocalIpAddress()}:${port}`,
      );
    });
  } catch (error) {
    console.error("Error occurred while starting the server:", error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  void startServer();
}

export default app; // Export the app for testing purposes
