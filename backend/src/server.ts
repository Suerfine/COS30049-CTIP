import express, { Application, Request, Response } from "express";
import path from "path";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import sequelize from "./config/Database";
import "./models/ArModel";
import { ArModel } from "./models";
import routes from "./routes";
import swaggerSpec from "./config/Swagger";

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

// Configure storage path for public assets (e.g. user profile pictures)
const publicStoragePath = path.resolve(__dirname, "../storage/public");

// Enable URL-encoded form data parsing with a 200mb limit
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

// Middleware to parse JSON bodies with a 200mb limit
app.use(express.json({ limit: "200mb" }));

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

app.get("/ar-viewer/:id", async (req: Request, res: Response) => {
  const modelId = Number(req.params.id);
  if (!Number.isFinite(modelId)) {
    res.status(400).send("Invalid model id");
    return;
  }

  const model = await ArModel.findByPk(modelId);
  if (!model) {
    res.status(404).send("AR model not found");
    return;
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const modelUrl = model.model_path.startsWith("/")
    ? `${baseUrl}${model.model_path}`
    : `${baseUrl}/${model.model_path}`;
      const patternUrl = model.pattern_path
        ? model.pattern_path.startsWith("/")
          ? `${baseUrl}${model.pattern_path}`
          : `${baseUrl}/${model.pattern_path}`
        : null;

      const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <title>${model.title.replace(/</g, "&lt;")}</title>
    <script src="https://aframe.io/releases/1.3.0/aframe.min.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.2/aframe/build/aframe-ar.js"></script>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background-color: transparent; }
      #overlay { position: fixed; top: 12px; left: 12px; right: 12px; z-index: 2; color: #fff; font-family: Arial, sans-serif; }
      #status { background: rgba(0,0,0,0.6); padding: 10px 12px; border-radius: 8px; max-width: 520px; }
      #hint { margin-top: 8px; font-size: 12px; color: #facc15; }
      #fallback { margin-top: 8px; font-size: 12px; color: #fff; }
      #slider-container { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 10; width: 80%; max-width: 400px; background: rgba(0,0,0,0.6); padding: 15px; border-radius: 12px; color: white; font-family: Arial, sans-serif; text-align: center; box-sizing: border-box; }
      #scale-slider { width: 100%; margin-top: 10px; }
    </style>
  </head>
  <body>
    <div id="overlay">
      <div id="status">Point your camera at the printed marker to view the 3D model.</div>
      <div id="hint" style="display: none;">Marker pattern missing. Ask an admin to upload the .patt file for this model.</div>
      <div id="fallback" style="display: none;">Using default Hiro marker as a fallback.</div>
    </div>

    <div id="slider-container">
      <label for="scale-slider">Adjust Size: <span id="scale-value">0.05</span>x</label>
      <input type="range" id="scale-slider" min="0.005" max="5.0" step="0.005" value="0.05" />
    </div>

    <a-scene
      embedded
      renderer="colorManagement: true; precision: medium; alpha: true;"
      vr-mode-ui="enabled: false"
      arjs="sourceType: webcam; debugUIEnabled: false;"
    >
      <a-entity light="type: ambient; intensity: 0.8"></a-entity>
      <a-entity light="type: directional; intensity: 0.8" position="1 2 1"></a-entity>
      <a-entity camera></a-entity>
    </a-scene>
    <script>
      (function () {
        const scene = document.querySelector("a-scene");
        const marker = document.createElement("a-marker");
        const modelEl = document.createElement("a-entity");
        const modelUrl = ${JSON.stringify(modelUrl)};
        const patternUrl = ${JSON.stringify(patternUrl)};

        if (patternUrl) {
          marker.setAttribute("type", "pattern");
          marker.setAttribute("url", patternUrl);
        } else {
          marker.setAttribute("preset", "hiro");
          document.getElementById("hint").style.display = "block";
          document.getElementById("fallback").style.display = "block";
        }

        modelEl.setAttribute("gltf-model", modelUrl);
        modelEl.setAttribute("position", "0 0 0");
        modelEl.setAttribute("rotation", "0 0 0");
        // Start with a much smaller scale to prevent oversized models from blocking the screen
        modelEl.setAttribute("scale", "0.05 0.05 0.05");

        marker.appendChild(modelEl);
        scene.appendChild(marker);

        let currentScale = 0.05;
        let currentRotation = 0;
        let lastTouchDistance = null;
        let lastTouchX = null;

        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
        const getDistance = (touches) => {
          const dx = touches[0].clientX - touches[1].clientX;
          const dy = touches[0].clientY - touches[1].clientY;
          return Math.hypot(dx, dy);
        };

        const slider = document.getElementById("scale-slider");
        const scaleValueDisplay = document.getElementById("scale-value");

        const updateScale = (newScale) => {
          currentScale = clamp(newScale, 0.005, 5.0);
          modelEl.setAttribute(
            "scale",
            currentScale + " " + currentScale + " " + currentScale
          );
          slider.value = currentScale;
          scaleValueDisplay.textContent = currentScale.toFixed(3);
        };

        slider.addEventListener("input", (event) => {
          updateScale(parseFloat(event.target.value));
        });

        scene.addEventListener("touchstart", (event) => {
          if (event.touches.length === 1) {
            lastTouchX = event.touches[0].clientX;
          } else if (event.touches.length === 2) {
            lastTouchDistance = getDistance(event.touches);
          }
        }, { passive: true });

        scene.addEventListener("touchmove", (event) => {
          if (event.touches.length === 1 && lastTouchX !== null) {
            const dx = event.touches[0].clientX - lastTouchX;
            currentRotation += dx * 0.4;
            modelEl.setAttribute("rotation", "0 " + currentRotation + " 0");
            lastTouchX = event.touches[0].clientX;
          } else if (event.touches.length === 2 && lastTouchDistance !== null) {
            const newDistance = getDistance(event.touches);
            const delta = newDistance - lastTouchDistance;
            // Expand clamp boundaries and reduce delta sensitivity for smaller scale
            updateScale(currentScale + delta / 1000);
            lastTouchDistance = newDistance;
          }
        }, { passive: true });

        scene.addEventListener("wheel", (event) => {
          // Expand clamp boundaries and reduce scroll sensitivity for smaller scale
          updateScale(currentScale + event.deltaY * -0.0005);
        }, { passive: true });
      })();
    </script>
  </body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

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

    // Sync database schemas (creates missing tables, won't alter existing ones)
    await sequelize.sync();
    console.log("Database tables synchronized successfully.");

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error occurred while starting the server:", error);
    process.exit(1);
  }
};

startServer();