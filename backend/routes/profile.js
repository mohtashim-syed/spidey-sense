// Handles user profiles TTS
import express from "express";
import { getUserProfile } from "../controllers/profileController.js";

const router = express.Router();

// GET /api/profile
router.get("/", getUserProfile);

export default router;
