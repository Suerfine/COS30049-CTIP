import express, { Application, Request, Response } from "express";
import path from "path";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import http from "http";
import https from "https";
import sequelize from "./config/Database";
import "./models";
import routes from "./routes";
import swaggerSpec from "./config/Swagger";
import { auditLogger } from "./middelware/AuditLogger";

// Load environment variables from .env file
const dotenv = require("dotenv");
dotenv.config();

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
const publicStoragePath = path.resolve(__dirname, "../storage/public");
const httpsEnabled = parseBooleanFlag(process.env.HTTPS_ENABLED);

function parseBooleanFlag(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function createHttpOrHttpsServer(application: Application): http.Server | https.Server {
  if (!httpsEnabled) {
    return http.createServer(application);
  }

  const keyPath = process.env.HTTPS_KEY_PATH?.trim();
  const certPath = process.env.HTTPS_CERT_PATH?.trim();
  const caPath = process.env.HTTPS_CA_PATH?.trim();

  if (!keyPath || !certPath) {
    throw new Error(
      "HTTPS_ENABLED is true, but HTTPS_KEY_PATH and HTTPS_CERT_PATH are not configured.",
    );
  }

  const httpsOptions: https.ServerOptions = {
    key: fs.readFileSync(path.resolve(keyPath)),
    cert: fs.readFileSync(path.resolve(certPath)),
  };

  if (caPath) {
    httpsOptions.ca = fs.readFileSync(path.resolve(caPath));
  }

  return https.createServer(httpsOptions, application);
}

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

if (parseBooleanFlag(process.env.FORCE_HTTPS_REDIRECT)) {
  app.set("trust proxy", 1);
  app.use((req: Request, res: Response, next) => {
    const forwardedProto = req.headers["x-forwarded-proto"];
    const isForwardedHttps =
      typeof forwardedProto === "string" &&
      forwardedProto.toLowerCase().includes("https");

    if (req.secure || isForwardedHttps) {
      next();
      return;
    }

    const host = req.get("host");
    if (!host) {
      next();
      return;
    }

    res.redirect(301, `https://${host}${req.originalUrl}`);
  });
}

if (httpsEnabled) {
  app.use((req: Request, res: Response, next) => {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });
}

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
  res.send(
    httpsEnabled
      ? "Hello, TypeScript + Express over HTTPS/TLS!"
      : "Hello, TypeScript + Express!",
  );
});

app.get("/api/security/transport", (req: Request, res: Response) => {
  res.json({
    transport: httpsEnabled ? "HTTPS" : "HTTP",
    tlsEnabled: httpsEnabled,
    redirectToHttps: parseBooleanFlag(process.env.FORCE_HTTPS_REDIRECT),
    hstsEnabled: httpsEnabled,
    requestSecure: req.secure,
  });
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
app.use("/api", auditLogger, routes);

const startServer = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    const server = createHttpOrHttpsServer(app);
    server.listen(port, () => {
      const protocol = httpsEnabled ? "https" : "http";
      console.log(`Server is running on ${protocol}://localhost:${port}`);
    });

    const shutdown = () => {
      server.close(() => process.exit(0));
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Error occurred while starting the server:", error);
    process.exit(1);
  }
};

startServer();
