// routes/speak.js
import { Router } from "express";
import { synthesizeSpeech } from "../services/eleven.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { text, voiceId } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: true, message: "Missing 'text' string" });
    }

    const { buffer, contentType } = await synthesizeSpeech(text, voiceId);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", buffer.length);
    res.status(200).send(buffer);
  } catch (err) {
    console.error("TTS error:", err?.message);
    next(err);
  }
});

export default router;
