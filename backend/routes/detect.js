import express from "express";
import { getContextFromGemini } from "../controllers/geminiController.js";

const router = express.Router();

// POST /api/detect
router.post("/", async (req, res) => {
  try {
    const { objects = [], hint = "", mode = "Explore" } = req.body;
    const context = await getContextFromGemini(objects, hint, mode);
    res.json({ message: context });
  } catch (err) {
    console.error("Detect route error:", err.message);
    res.status(500).json({ error: "Gemini detection failed" });
  }
});

export default router;
