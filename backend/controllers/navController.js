// controllers/navController.js
import sharp from "sharp";
import ort from "onnxruntime-node";
import { getContextFromGemini } from "./geminiController.js";

// ---------- Depth (MiDaS small) ----------
let depthSession = null;
async function ensureDepth() {
  if (!depthSession) {
    depthSession = await ort.InferenceSession.create("models/midas_small.onnx", {
      executionProviders: ["cpuExecutionProvider"], // works everywhere; can change to 'cuda' if available
    });
  }
}

// Convert a video frame (base64 image) to an ORT tensor [1,3,256,256] (RGB, 0..1)
async function frameToDepthTensor(base64, size = 256) {
  const buf = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), "base64");
  const raw = await sharp(buf).resize(size, size).removeAlpha().raw().toBuffer(); // RGB
  const H = size, W = size;
  const data = new Float32Array(1 * 3 * H * W);
  // HWC -> CHW, normalize 0..1
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      const r = raw[i] / 255, g = raw[i + 1] / 255, b = raw[i + 2] / 255;
      const idx = y * W + x;
      data[0 * H * W + idx] = r;
      data[1 * H * W + idx] = g;
      data[2 * H * W + idx] = b;
    }
  }
  const inputName = depthSession.inputNames?.[0] || "input";
  return { name: inputName, tensor: new ort.Tensor("float32", data, [1, 3, H, W]) };
}

// Run MiDaS → get disparity (higher = closer). Return {disp, H, W}
async function inferDepthMap(base64) {
  await ensureDepth();
  const { name, tensor } = await frameToDepthTensor(base64, 256);
  const out = await depthSession.run({ [name]: tensor });
  const outName = depthSession.outputNames?.[0] || Object.keys(out)[0];
  const arr = out[outName];
  // Most MiDaS small export as [1,1,H,W]
  const [N, C, H, W] = arr.dims;
  const disp = arr.data; // Float32Array length H*W
  return { disp, H, W };
}

// Percentile util
function percentile(vals, q) {
  if (!vals.length) return 0;
  const a = vals.slice().sort((x, y) => x - y);
  const idx = Math.max(0, Math.min(a.length - 1, Math.floor(q * (a.length - 1))));
  return a[idx];
}

// Estimate clearance per sector using MiDaS disparity (bigger = closer).
// We invert disparity to a pseudo-depth and normalize to 0..1 for scoring.
function sectorClearanceFromDisp(disp, H, W) {
  const thirds = Math.floor(W / 3);
  const ranges = [
    { name: "left",   x0: 0,        x1: thirds - 1 },
    { name: "center", x0: thirds,   x1: 2 * thirds - 1 },
    { name: "right",  x0: 2 * thirds, x1: W - 1 },
  ];

  // convert disparity -> pseudoDepth = 1/(disp+eps)
  const eps = 1e-6;
  const pseudo = new Float32Array(disp.length);
  let minD = Infinity, maxD = -Infinity;
  for (let i = 0; i < disp.length; i++) {
    const d = 1 / (disp[i] + eps);
    pseudo[i] = d;
    if (d < minD) minD = d;
    if (d > maxD) maxD = d;
  }
  // normalize 0..1
  for (let i = 0; i < pseudo.length; i++) {
    pseudo[i] = (pseudo[i] - minD) / (maxD - minD + 1e-9);
  }

  const clearance = {};
  for (const r of ranges) {
    const vals = [];
    for (let y = Math.floor(H * 0.35); y < H; y++) { // lower 65% is most relevant for obstacles
      for (let x = r.x0; x <= r.x1; x++) {
        vals.push(pseudo[y * W + x]);
      }
    }
    // Use 10th percentile depth as conservative clearance (smaller → closer)
    const depthScore = percentile(vals, 0.10); // 0..1 (higher is farther)
    clearance[r.name] = depthScore;
  }

  // Risk is 1 - clearance
  const risk = {
    left:  1 - clearance.left,
    center:1 - clearance.center,
    right: 1 - clearance.right
  };

  // "very close" heuristic: if many very small depths in center bottom
  let veryClose = false;
  {
    const vals = [];
    for (let y = Math.floor(H * 0.75); y < H; y++) {
      for (let x = ranges[1].x0; x <= ranges[1].x1; x++) {
        vals.push(pseudo[y * W + x]);
      }
    }
    const c10 = percentile(vals, 0.10);
    veryClose = c10 < 0.15; // tune
  }

  return { clearance, risk, anyFrontNear: veryClose };
}

// Build hint + simple layout from clearance
function buildHintAndLayout(clearance) {
  const frontBlocked = clearance.center < 0.35;
  let safest;
  if (clearance.left > clearance.right) safest = "turn left";
  else if (clearance.right > clearance.left) safest = "turn right";
  else safest = frontBlocked ? "wait briefly" : "proceed";

  const hint = (frontBlocked ? "obstacle ahead; " : "path clear ahead; ") + "safest: " + safest;

  // Minimal layout just to feed Gemini the directions (no labels)
  const layout = {
    left:   clearance.left  < 0.45 ? ["obstacle"] : [],
    center: clearance.center< 0.45 ? ["obstacle"] : [],
    right:  clearance.right < 0.45 ? ["obstacle"] : []
  };
  return { hint, layout, frontBlocked };
}

// Short local phrase if Gemini is rate limited
function localPhraseFromRisk(risk) {
  const L = risk.left, C = risk.center, R = risk.right;
  const HIGH = 0.65, MID = 0.45; // because risk = 1 - clearance
  if (C >= HIGH) {
    if (L < R && L < HIGH) return "Stop. Turn left.";
    if (R < L && R < HIGH) return "Stop. Turn right.";
    if (L < HIGH || R < HIGH) return (L <= R) ? "Stop. Turn left." : "Stop. Turn right.";
    return "Stop. Wait.";
  }
  if (C <= MID) return "Path clear ahead.";
  if (L < R) return "Proceed. Favor left.";
  if (R < L) return "Proceed. Favor right.";
  return "Proceed with caution.";
}

// --------- Public API (used by the route) -----------
export async function analyzeNav(reqBody = {}) {
  const { image, objects = [], layout = null, risk = null, hint = null, mode = "Explore", urgency = false } = reqBody;

  // If an image is provided, do depth-based L/F/R on the backend (no front-end change required).
  if (image) {
    try {
      const { disp, H, W } = await inferDepthMap(image);
      const { clearance, risk: r, anyFrontNear } = sectorClearanceFromDisp(disp, H, W);
      const { hint: h, layout: lay, frontBlocked } = buildHintAndLayout(clearance);
      const urg = anyFrontNear || r.center >= 0.65;

      // No object labels (unless you also add server-side detector); we still give Gemini directional + safety info.
      const msg = await getContextFromGemini([], lay, { hint: h, mode, risk: r, urgency: urg });
      const fallback = localPhraseFromRisk(r);
      return {
        message: msg || fallback,
        clearance,
        risk: r,
        urgency: urg,
        hint: h,
        layout: lay,
        used: "depth"
      };
    } catch (e) {
      console.error("Depth analysis error:", e.message);
      // fall back to existing flow with whatever came in
    }
  }

  // Fallback / legacy path: use whatever the front-end already posts (no changes needed)
  const msg = await getContextFromGemini(objects, layout, { hint, mode, risk, urgency });
  return {
    message: msg,
    risk: risk || null,
    hint: hint || null,
    layout: layout || { left: [], center: [], right: [] },
    used: image ? "depth-fallback" : "client"
  };
}
