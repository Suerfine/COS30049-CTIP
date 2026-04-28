import express, { Application, Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { QueryTypes } from "sequelize";
import sequelize from "./config/Database";
import "./models";
import routes from "./routes";
import swaggerSpec from "./config/Swagger";

const app: Application = express();
const port = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: "http://localhost:8081",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Basic route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript + Express!");
});

// Swagger docs
app.get("/api/docs.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Mount ALL routes on /api
app.use("/api", routes);

const ensureSqliteUsersSchema = async (): Promise<void> => {
  if (sequelize.getDialect() !== "sqlite") {
    return;
  }

  const userColumns = (await sequelize.query("PRAGMA table_info(users);", {
    type: QueryTypes.SELECT,
  })) as Array<{ name?: string }>;

  const hasLastLoginAt = userColumns.some(
    (column) => column.name === "last_login_at",
  );

  if (!hasLastLoginAt) {
    await sequelize.query(
      "ALTER TABLE users ADD COLUMN last_login_at DATETIME;",
    );
    console.log(
      "Added missing users.last_login_at column for SQLite schema compatibility.",
    );
  }
};

const startServer = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    await ensureSqliteUsersSchema();

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error occurred while starting the server:", error);
    process.exit(1);
  }
};

startServer();
