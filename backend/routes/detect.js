// This JS will detect objects.
import express from "express";
import { getContextFromGemini } from "../controllers/geminiController.js";

const router = express.Router();

// POST /api/detect
router.post("/", async (req, res) => {
  try {
    const { objects } = req.body; // e.g. ["person", "door", "chair"]
    const context = await getContextFromGemini(objects);
    res.json({ message: context });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gemini detection failed" });
  }
});

export default router;
