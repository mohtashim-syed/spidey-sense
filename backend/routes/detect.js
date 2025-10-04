// routes/detect.js
import express from "express";
import { getContextFromGemini } from "../controllers/geminiController.js";

const router = express.Router();

/**
 * POST /api/detect
 * Body:
 * {
 *   objects: string[],
 *   layout?: { left: string[], center: string[], right: string[] },
 *   mode?: "Explore" | "Focus" | "Calm" | string,
 *   hint?: string  // optional scene hint, e.g., "path clear ahead" or "obstacle ahead"
 * }
 */
router.post("/", async (req, res) => {
  try {
    const {
      objects = [],
      layout = null,
      mode = "Explore",
      hint = null
    } = req.body || {};

    const message = await getContextFromGemini(objects, layout, { mode, hint });
    res.json({ message });
  } catch (e) {
    console.error("❌ /api/detect:", e?.response?.data || e.message);
    const fallback =
      (req.body?.objects?.length ? `Detected: ${req.body.objects.join(", ")}` : "Clear path ahead.");
    res.json({ message: fallback });
  }
});

export default router;
