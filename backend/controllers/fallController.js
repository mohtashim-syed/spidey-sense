// controllers/fallController.js
// Very preliminary fall detection using a tiny state machine and simple thresholds.
// It expects periodic telemetry (10–30 Hz) with orientation and optional motion metrics.

// Inputs per sample (JSON):
// {
//   deviceId: string,                // required, groups state per device
//   t?: number,                      // ms epoch; default: Date.now()
//   flipped180?: boolean,            // optional; used only for debug/normalization
//   pitchDeg?: number,               // orientation degrees
//   rollDeg?: number,
//   yawDeg?: number,
//   gyroDegPerS?: number,            // optional magnitude of angular velocity
//   motionEnergy?: number            // optional image-based motion energy 0..?
// }

const detectors = new Map(); // deviceId -> Detector

const DEFAULTS = {
  sampleHistoryMs: 4000,
  downwardDeltaDeg: 50,      // large tilt change
  downwardVelDegS: 180,      // rapid tilt speed
  downwardWindowMs: 800,
  staggerRmsThresh: 60,      // sustained instability after impact
  staggerMinMs: 1000,
  stillnessVelDegS: 20,      // camera becomes still
  stillnessMinMs: 1500,
  lowPitchDeltaDeg: 35,      // remains in a tilted posture vs baseline
  maxDownToStaggerMs: 2500,
  maxStaggerToConfirmMs: 5000,
  shockGyroDegS: 420,        // single-sample high angular velocity
  shockMotionEnergy: 35      // single-sample high motion energy (scale 0..100)
};

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

class Detector {
  constructor(cfg = {}) {
    this.cfg = { ...DEFAULTS, ...cfg };
    this.state = 'idle';
    this.samples = []; // recent samples: {t, pitch, roll, yaw, vPitch, vYaw, vRoll, gyro, motion}
    this.baselinePitch = 0;   // EMA
    this.emaAlpha = 0.05;
    this.lastPitch = undefined;
    this.lastYaw = undefined;
    this.lastRoll = undefined;
    this.lastT = undefined;
    this.tDownStart = null;
    this.tStaggerStart = null;
    this.baselineAtDown = null;
    this.lastFallAt = null;
  }

  push(sample) {
    const now = typeof sample.t === 'number' ? sample.t : Date.now();
    const pitch = Number.isFinite(sample.pitchDeg) ? sample.pitchDeg : null;
    const yaw = Number.isFinite(sample.yawDeg) ? sample.yawDeg : null;
    const roll = Number.isFinite(sample.rollDeg) ? sample.rollDeg : null;
    const gyro = Number.isFinite(sample.gyroDegPerS) ? sample.gyroDegPerS : null;
    const motion = Number.isFinite(sample.motionEnergy) ? sample.motionEnergy : null;

    // compute simple angular velocities if we have previous
    let vPitch = null, vYaw = null, vRoll = null;
    if (this.lastT != null && pitch != null && this.lastPitch != null) {
      const dt = Math.max(1, now - this.lastT) / 1000; // s
      vPitch = (pitch - this.lastPitch) / dt; // deg/s
    }
    if (this.lastT != null && yaw != null && this.lastYaw != null) {
      const dt = Math.max(1, now - this.lastT) / 1000;
      vYaw = (yaw - this.lastYaw) / dt;
    }
    if (this.lastT != null && roll != null && this.lastRoll != null) {
      const dt = Math.max(1, now - this.lastT) / 1000;
      vRoll = (roll - this.lastRoll) / dt;
    }

    // Update baselines
    if (pitch != null) {
      if (!Number.isFinite(this.baselinePitch)) this.baselinePitch = pitch;
      this.baselinePitch = this.baselinePitch + this.emaAlpha * (pitch - this.baselinePitch);
    }

    // Save sample
    this.samples.push({ t: now, pitch, yaw, roll, vPitch, vYaw, vRoll, gyro, motion });
    this.lastT = now; this.lastPitch = pitch; this.lastYaw = yaw; this.lastRoll = roll;

    // Trim history
    const cut = now - this.cfg.sampleHistoryMs;
    while (this.samples.length && this.samples[0].t < cut) this.samples.shift();

    const res = this._step(now);
    return res;
  }

  _step(now) {
    const { downwardDeltaDeg, downwardVelDegS, downwardWindowMs, staggerRmsThresh, staggerMinMs, stillnessVelDegS, stillnessMinMs, lowPitchDeltaDeg, maxDownToStaggerMs, maxStaggerToConfirmMs } = this.cfg;

    // helpers over a window
    const window = (ms) => this.samples.filter(s => s.t >= now - ms);
    const hasRapidDownwardTilt = () => {
      // Look back within downwardWindowMs for a large change in pitch and high |vPitch|
      const w = window(downwardWindowMs);
      if (!w.length) return false;
      const first = w[0];
      const last = w[w.length - 1];
      const dPitch = (last.pitch ?? 0) - (first.pitch ?? 0); // deg
      const maxAbsVel = w.reduce((m, s) => Math.max(m, Math.abs(s.vPitch || 0)), 0);
      // We treat any large-magnitude tilt change as potential downward since sign varies by platform.
      return Math.abs(dPitch) >= downwardDeltaDeg && maxAbsVel >= downwardVelDegS;
    };

    const hasShock = () => {
      const last = this.samples[this.samples.length - 1];
      if (!last) return false;
      const gyroHit = Number.isFinite(last.gyro) && last.gyro >= this.cfg.shockGyroDegS;
      const motionHit = Number.isFinite(last.motion) && last.motion >= this.cfg.shockMotionEnergy;
      return gyroHit || motionHit;
    };

    const instabilityRMS = (ms) => {
      const w = window(ms);
      if (!w.length) return 0;
      // prefer gyro if provided else approximate from vPitch/vYaw/vRoll
      const vals = w.map(s => {
        if (Number.isFinite(s.gyro)) return s.gyro;
        const vp = s.vPitch || 0, vy = s.vYaw || 0, vr = s.vRoll || 0;
        return Math.sqrt(vp*vp + vy*vy + vr*vr);
      });
      const meanSq = vals.reduce((a,b)=>a+b*b,0)/vals.length;
      return Math.sqrt(meanSq);
    };

    const avgAbsVel = (ms) => {
      const w = window(ms);
      if (!w.length) return 0;
      const vals = w.map(s => {
        const vp = Math.abs(s.vPitch || 0), vy = Math.abs(s.vYaw || 0), vr = Math.abs(s.vRoll || 0);
        if (Number.isFinite(s.gyro)) return Math.abs(s.gyro);
        return (vp + vy + vr) / 3;
      });
      return vals.reduce((a,b)=>a+b,0)/vals.length;
    };

    const pitchNow = this.samples[this.samples.length - 1]?.pitch;
    const pitchDeltaFromBaseline = (Number.isFinite(pitchNow) && Number.isFinite(this.baselinePitch))
      ? Math.abs(pitchNow - this.baselinePitch)
      : 0;

    let event = null;

    if (this.state === 'idle') {
      if (hasRapidDownwardTilt() || hasShock()) {
        this.state = 'downward';
        this.tDownStart = now;
        this.baselineAtDown = this.baselinePitch;
        event = { type: 'downward-start' };
      }
    } else if (this.state === 'downward') {
      // if we see instability sustained → stagger
      const rms = instabilityRMS(800);
      const sinceDown = now - (this.tDownStart || now);
      if (rms >= staggerRmsThresh && sinceDown >= 300) {
        this.state = 'stagger';
        this.tStaggerStart = now;
        event = { type: 'stagger-start', rms };
      } else if (sinceDown > maxDownToStaggerMs) {
        // timeout
        this.state = 'idle';
        this.tDownStart = null;
        this.baselineAtDown = null;
        event = { type: 'downward-timeout' };
      }
    } else if (this.state === 'stagger') {
      const rms = instabilityRMS(1200);
      const sinceStagger = now - (this.tStaggerStart || now);
      // Condition A: instability lasted long enough
      const hasStaggeredEnough = rms >= staggerRmsThresh && sinceStagger >= staggerMinMs;
      // Condition B: then becomes still while remaining low/tilted
      const stillAvg = avgAbsVel(1500);
      const stillEnough = stillAvg <= stillnessVelDegS && sinceStagger >= 700;
      const lowPosture = pitchDeltaFromBaseline >= lowPitchDeltaDeg || Math.abs(pitchNow || 0) >= 45;

      if (hasStaggeredEnough && stillEnough && lowPosture) {
        this.state = 'confirm';
        this.lastFallAt = now;
        event = { type: 'fall-detected' };
      } else if (sinceStagger > maxStaggerToConfirmMs) {
        // give up and reset
        this.state = 'idle';
        this.tDownStart = null;
        this.tStaggerStart = null;
        this.baselineAtDown = null;
        event = { type: 'stagger-timeout' };
      }
    } else if (this.state === 'confirm') {
      // remain in confirm for a short while, then go idle to allow future detection
      if ((now - (this.lastFallAt || now)) > 5000) {
        this.state = 'idle';
      }
    }

    const res = {
      ok: true,
      state: this.state,
      event,
      fall: event?.type === 'fall-detected',
      at: now,
      debug: {
        pitchNow, baselinePitch: this.baselinePitch,
        pitchDeltaFromBaseline,
      }
    };
    return res;
  }
}

function getDetector(deviceId) {
  if (!deviceId) throw new Error('deviceId required');
  let d = detectors.get(deviceId);
  if (!d) { d = new Detector(); detectors.set(deviceId, d); }
  return d;
}

export async function postTelemetry(req, res) {
  try {
    const { deviceId, flipped180, t, pitchDeg, rollDeg, yawDeg, gyroDegPerS, motionEnergy } = req.body || {};
    if (!deviceId) return res.status(400).json({ error: true, message: 'deviceId required' });
    const det = getDetector(deviceId);
    const result = det.push({ t, pitchDeg, rollDeg, yawDeg, gyroDegPerS, motionEnergy, flipped180 });
    // Hook: place to call notification service when result.fall === true
    if (result.fall) {
      console.log(`[FALL] device=${deviceId} at=${new Date(result.at).toISOString()}`);
      // TODO: enqueue notifyLovedOnes(deviceId, result)
    }
    res.json({ deviceId, ...result });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
}

export async function getState(req, res) {
  try {
    const { deviceId } = req.params;
    const det = getDetector(deviceId);
    res.json({ deviceId, state: det.state, lastFallAt: det.lastFallAt });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
}

export async function resetState(req, res) {
  try {
    const { deviceId } = req.body || {};
    if (!deviceId) return res.status(400).json({ error: true, message: 'deviceId required' });
    detectors.delete(deviceId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
}
