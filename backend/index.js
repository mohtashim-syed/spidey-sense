import dotenv from "dotenv";
dotenv.config(); // load env as early as possible

import express from "express";
import cors from "cors";
import morgan from "morgan";

// Add these two to compute __dirname in ESM (since there's no __dirname by default)
import path from "node:path";
import { fileURLToPath } from "node:url";

import detectRoutes from "./routes/detect.js";
import speakRoutes from "./routes/speak.js";
import profileRoutes from "./routes/profile.js";

// ESM-safe __dirname/__filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares (these run before routes)
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// NEW: serve the ./public folder so you can open /index.html on your phone
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html>
      <head><meta charset="utf-8"><title>Spidey-Sense Backend</title></head>
      <body style="font-family: system-ui;padding:24px">
        <h1>🕸️ Spidey-Sense Backend</h1>
        <p>Routes:</p>
        <ul>
          <li>POST /api/detect - ask Gemini</li>
          <li>POST /api/speak - ElevenLabs TTS</li>
          <li>GET  /api/profile - sample route</li>
          <li>GET  /health - basic health check</li>
        </ul>
        <p>Field Test page: <a href="/index.html">/index.html</a></p>
      </body>
    </html>
  `);
});

// API routes
app.use("/api/detect", detectRoutes);
app.use("/api/speak", speakRoutes);
app.use("/api/profile", profileRoutes);

// Simple healthcheck
app.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Centralized error handler (always return JSON on errors)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.status || 500;
  res.status(status).json({
    error: true,
    message: err.message || "Internal Server Error"
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
