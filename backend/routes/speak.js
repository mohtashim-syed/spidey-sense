import express from "express";
import { streamSpeechFromElevenLabs } from "../controllers/elevenLabsController.js";
const router = express.Router();

// POST /api/speak { text, voiceId? }
router.post("/", async (req, res) => {
  try {
    const { text, voiceId } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: "Missing text" });

    const response = await streamSpeechFromElevenLabs(text.trim(), voiceId);
    res.setHeader("Content-Type", "audio/mpeg");
    // stream the MP3 back to the client
    response.data.pipe(res);
  } catch (err) {
    console.error("TTS error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Text-to-Speech failed" });
  }
});

export default router;
