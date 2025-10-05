// controllers/geminiController.js
import axios from "axios";

// ---- server-side token bucket (10/min free tier)
let tokens = 10;
let lastRefill = Date.now();
const CAPACITY = 10;
const REFILL_PER_MS = CAPACITY / 60000; // ~0.0001667 tokens per ms

function takeToken(preferUrgent=false){
  const now = Date.now();
  tokens = Math.min(CAPACITY, tokens + (now - lastRefill) * REFILL_PER_MS);
  lastRefill = now;
  if (tokens >= 1) { tokens -= 1; return true; }
  // if urgent and near 1, allow tiny overdraft
  if (preferUrgent && tokens >= 0.8) { tokens = Math.max(0, tokens - 0.8); return true; }
  return false;
}

function localNav(objects, layout, risk){
  const L = risk?.left ?? 0, C = risk?.center ?? 0, R = risk?.right ?? 0;
  const HIGH = 0.35, MID = 0.18;
  if (!objects?.length) return "Path clear ahead.";
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

function clip(text, maxWords=6){
  if (!text) return "";
  const cleaned = text.replace(/\s+/g,' ').trim();
  const words = cleaned.split(' ').slice(0, maxWords).join(' ');
  return /[.!?]$/.test(words) ? words : words + '.';
}

export const getContextFromGemini = async (objects, layout, extra={}) => {
  const { mode = "Explore", hint = null, risk = null, urgency = false } = extra;

  const fallback = localNav(objects, layout, risk);

  if (!process.env.GEMINI_API_KEY) return fallback;
  if (!takeToken(urgency)) return fallback; // out of free-plan budget

  const layoutSummary = layout
    ? [
        layout.left?.length   ? `Left: ${layout.left.join(", ")}`   : null,
        layout.center?.length ? `Front: ${layout.center.join(", ")}`: null,
        layout.right?.length  ? `Right: ${layout.right.join(", ")}` : null
      ].filter(Boolean).join(" | ")
    : "unknown";

  const riskSummary = risk
    ? `Risk(0..1) → left:${risk.left?.toFixed(2) ?? 0}, front:${risk.center?.toFixed(2) ?? 0}, right:${risk.right?.toFixed(2) ?? 0}`
    : "Risk unknown";

  const prompt = `
You are "Spidey-Sense", an AI vision narrator for visually-impaired users.

Goal: in one or two short sentences, tell the user:
- if they can move ahead,
- if an object is ahead,
- which way to turn for the safest path.

Input:
- Scene: ${hint || "unknown"}
- Detected objects: ${JSON.stringify(objects || [], null, 0)}
- Layout: ${layoutSummary}
- ${riskSummary}
- Mode: ${mode}

Instructions:
1) Be explicit about front/left/right.
2) If front is blocked or very close, say "Stop" and suggest a turn.
3) If front is clear, say "Path clear ahead" (optionally suggest slight left/right).
4) Keep it calm and clear; no extra words.

Output: 1–2 sentences, maximum 6 words total.
`.trim();

  const model = "gemini-2.5-flash";
  const url   = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

  try {
    const r = await axios.post(
      url,
      {
        contents: [{ role: "user", parts: [{ text: prompt }]}],
        generationConfig: { temperature: 0.2, topK: 32, topP: 0.8, maxOutputTokens: 16 }
      },
      { headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "Content-Type":"application/json" }, timeout: 15000 }
    );

    const txt = r.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return clip(txt, 6) || fallback;
  } catch (err) {
    console.error("Gemini error:", err?.response?.data || err.message);
    return fallback;
  }
};
