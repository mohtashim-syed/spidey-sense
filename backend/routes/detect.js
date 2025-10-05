// routes/detect.js
import { Router } from "express";
import { generateText } from "../services/gemini.js";

const router = Router();

// Simple text QA with Gemini
router.post("/", async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: true, message: "Missing 'prompt' string" });
    }
    const text = await generateText(prompt);
    res.json({ ok: true, text });
  } catch (err) {
    console.error("Gemini error:", err?.message);
    next(err);
  }
});

// Optional: quick connectivity probe hitting a tiny prompt
router.get("/ping", async (req, res, next) => {
  try {
    const text = await generateText("Say 'pong'.");
    res.json({ ok: true, text });
  } catch (err) {
    console.error("Gemini ping error:", err?.message);
    next(err);
  }
});

export default router;
