// routes/profile.js
import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  res.json({ ok: true, profile: { app: "Spidey-Sense" } });
});

export default router;
