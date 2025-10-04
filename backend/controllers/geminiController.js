// controllers/geminiController.js
import axios from "axios";

// --- tiny rule-based fallback so you still get guidance if Gemini is down or rate-limited
function localNavFiveWords(objects, layout) {
  const left  = layout?.left?.length   || 0;
  const ahead = layout?.center?.length || 0;
  const right = layout?.right?.length  || 0;

  // No objects or nothing ahead → go
  if (!objects?.length || ahead === 0) return "Path clear ahead.";

  // Obstacle ahead → choose safer turn
  if (ahead > 0) {
    if (left === 0 && right > 0)  return "Obstacle ahead; turn left.";
    if (right === 0 && left > 0)  return "Obstacle ahead; turn right.";
    if (left === 0 && right === 0) return "Obstacle ahead; proceed cautiously."; // still ≤5 words
    // both sides have stuff → pick fewer
    if (left < right)  return "Obstacle ahead; turn left.";
    if (right < left)  return "Obstacle ahead; turn right.";
    return "Obstacle ahead; wait briefly.";
  }
  return "Path clear ahead.";
}

function clipToFiveWordsOneSentence(text) {
  if (!text) return "";
  const five = text.replace(/\s+/g, " ").trim().split(" ").slice(0, 5).join(" ");
  // ensure ends as one sentence
  return /[.!?]$/.test(five) ? five : five + ".";
}

export const getContextFromGemini = async (objects, layout, { mode = "Explore", hint = null } = {}) => {
  const model = "gemini-2.5-flash"; // or "gemini-2.5-pro"
  const url   = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

  const fallback = localNavFiveWords(objects, layout);
  if (!process.env.GEMINI_API_KEY) return fallback;

  // Build a compact, human-readable layout summary for the prompt (optional)
  const layoutSummary = layout
    ? [
        layout.left?.length   ? `Left: ${layout.left.join(", ")}`   : null,
        layout.center?.length ? `Front: ${layout.center.join(", ")}` : null,
        layout.right?.length  ? `Right: ${layout.right.join(", ")}`  : null
      ].filter(Boolean).join(" | ")
    : "unknown";

  // ---------- YOUR PROMPT (exact style you requested) ----------
  const prompt = `
You are "Spidey-Sense", an AI vision narrator for visually-impaired users.

Your mission: describe the user's immediate surroundings in one or two short sentences,
focusing on spatial awareness and navigation safety.

Input:
- Scene: ${hint || "unknown"}
- Detected objects: ${JSON.stringify(objects || [], null, 2)}
- Mode: ${mode}
- Layout: ${layoutSummary}

Instructions:
1. Clearly describe nearby objects and obstacles.
2. Mention their relative positions (front, left, right, behind).
3. Warn about walls or obstacles that block the path ("wall ahead", "door on right - closed").
4. If an open path exists, mention it ("path clear ahead").
5. Keep it calm, kind, and clear — no unnecessary words.
6. Respond as a human guide would — helpful and descriptive.

Output: 1 sentence, maximum 5 words.
`.trim();
  // -------------------------------------------------------------

  try {
    const r = await axios.post(
      url,
      {
        contents: [{ role: "user", parts: [{ text: prompt }]}],
        generationConfig: {
          temperature: 0.2,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 16   // tiny, to reinforce brevity
        }
      },
      {
        headers: {
          "x-goog-api-key": process.env.GEMINI_API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );

    const raw = r.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clipped = clipToFiveWordsOneSentence(raw);
    return clipped || fallback;
  } catch (err) {
    // Handle rate limit or other errors by returning safe, short guidance
    console.error("Gemini error:", err?.response?.data || err.message);
    return fallback;
  }
};
