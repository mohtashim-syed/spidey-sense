// backend/routes/openaiGrounded.js
import { Router } from "express";
import multer from "multer";
import { groundedDescribe } from "../controllers/openaiGroundedController.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/grounded-describe", upload.single("image"), groundedDescribe);

export default router;
