import express from "express";
import { getContextFromGemini } from "../controllers/geminiController.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { objects } = req.body || {};
    if (!Array.isArray(objects) || objects.length === 0) {
      return res.status(400).json({ error: "objects[] required" });
    }
    console.log("🔎 /api/detect objects:", objects);
    const message = await getContextFromGemini(objects);
    res.json({ message });
  } catch (e) {
    console.error("❌ /api/detect error:", e?.response?.data || e.message);
    // Fallback so the UI still shows something:
    res.json({ message: `Detected: ${ (req.body?.objects||[]).join(", ") }` });
  }
});

export default router;
