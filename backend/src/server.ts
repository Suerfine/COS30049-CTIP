import express, { Application, Request, Response } from "express";
import cors from "cors";
import sequelize from "./config/Database";
import "./models";
import routes from "./routes";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/Swagger";

const app: Application = express();
const port = Number(process.env.PORT) || 5000;

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Basic route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript + Express!");
});

// Swagger docs
app.get("/api/docs.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount ALL routes on /api
app.use("/api", routes);

const startServer = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error occurred while starting the server:", error);
    process.exit(1);
  }
};

startServer();
