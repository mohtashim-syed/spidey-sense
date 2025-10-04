import express from "express";
import { getContextFromGemini } from "../controllers/geminiController.js";

const router = express.Router();

// POST /api/detect
// Body: { objects: string[], layout?: { left: string[], center: string[], right: string[] } }
router.post("/", async (req, res) => {
  try {
    const { objects = [], layout = null } = req.body || {};
    const message = await getContextFromGemini(objects, layout);
    res.json({ message });
  } catch (e) {
    console.error("❌ /api/detect:", e?.response?.data || e.message);
    const fallback = (req.body?.objects?.length
      ? `Detected: ${req.body.objects.join(", ")}`
      : "Clear path ahead.");
    res.json({ message: fallback });
  }
});

export default router;
