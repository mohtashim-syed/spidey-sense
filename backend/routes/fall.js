// routes/fall.js
import { Router } from 'express';
import { postTelemetry, getState, resetState } from '../controllers/fallController.js';

const router = Router();

// POST telemetry samples frequently from client
router.post('/telemetry', postTelemetry);

// GET current state for a device
router.get('/state/:deviceId', getState);

// POST reset detector for a device
router.post('/reset', resetState);

export default router;
