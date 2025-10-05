// index.js
import "dotenv/config";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import multer from "multer";

// ESM-safe __dirname/__filename
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your existing route modules
import detectRoutes from "./routes/detect.js";
import speakRoutes from "./routes/speak.js";
import profileRoutes from "./routes/profile.js";
import fallRoutes from "./routes/fall.js";

// OpenAI grounded controller (must be the version that uses input_text/input_image)
import { groundedDescribe } from "./controllers/openaiGroundedController.js";

const app = express();
const PORT = process.env.PORT || 5055;

// Global middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Serve static files (optional browser test assets in /public)
app.use(express.static(path.join(__dirname, "public")));

// Multer for image uploads used on grounded-describe
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 8 MB
});

// Simple landing page
app.get("/", (_req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html>
      <head><meta charset="utf-8"><title>Spidey-Sense Backend</title></head>
      <body style="font-family: system-ui; padding: 24px;">
        <h1>🕸️ Spidey-Sense Backend</h1>
        <p>This server is running.</p>
        <ul>
          <li><a href="/health">/health</a> — basic health check</li>
          <li><code>POST /api/openai/grounded-describe</code> — send image + detections (multipart/form-data)</li>
          <li><code>POST /api/detect</code> — your object detection route</li>
          <li><code>POST /api/speak</code> — ElevenLabs TTS route</li>
          <li><code>GET  /api/profile</code> — sample profile route</li>
          <li><code>POST /api/fall/telemetry</code> — streaming device telemetry</li>
          <li><code>GET  /api/fall/state/:deviceId</code> — get detector state</li>
          <li><code>POST /api/fall/reset</code> — reset detector state</li>
        </ul>
      </body>
    </html>
  `);
});

// Healthcheck
app.get("/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// OpenAI grounded route — this is the one your Expo app calls
app.post("/api/openai/grounded-describe", upload.single("image"), (req, res, next) => {
  // helpful log to confirm the app is actually hitting THIS process
  console.log("→ /api/openai/grounded-describe", {
    hasFile: !!req.file,
    mime: req.file?.mimetype,
    prompt: req.body?.prompt,
  });
  groundedDescribe(req, res, next);
});

// Your existing API routes
app.use("/api/detect", detectRoutes);
app.use("/api/speak", speakRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/fall", fallRoutes);

// 404 for unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || "Internal Server Error",
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
server.on("error", (err) => {
  console.error("[server error]", err);
});

// allow a bit more time for mobile uploads + model call
server.headersTimeout = 90_000;   // default ~60s
server.requestTimeout = 90_000;   // default ~60s
