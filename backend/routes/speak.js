// Handles elevenLabs TTS
import express from "express";
import { getSpeechFromElevenLabs } from "../controllers/elevenLabsController.js";

const router = express.Router();

// POST /api/speak
router.post("/", async (req, res) => {
  try {
    const { text } = req.body;
    const audioBuffer = await getSpeechFromElevenLabs(text);
    res.set("Content-Type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Text-to-Speech failed" });
  }
});

export default router;
