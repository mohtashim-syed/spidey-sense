import express from "express";
import { runYOLO } from "../services/yoloService.js";
import { analyzeSpatial } from "../services/spatialService.js";
import { generateMessage } from "../services/messageService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { frame, mode } = req.body;
    const detections = await runYOLO(frame); // full objects { label, x, width, confidence }
    const spatial = analyzeSpatial(detections);
    const message = generateMessage(spatial, mode || "focus");
    res.json({ spatial, message });
  } catch (err) {
    console.error("Detection error:", err);
    res.status(500).json({ error: "Failed to detect objects" });
  }
});

export default router;
