import axios from "axios";

/**
 * Build a very short, navigation-focused description.
 * - If no salient objects: brief surroundings line (empty hallway vibe).
 * - If objects exist: include only necessary cues (optionally left/center/right).
 * - Enforce brevity with small max tokens + explicit rules.
 */
export const getContextFromGemini = async (objects, layout) => {
  // Compact fallback if Gemini is missing or errors
  const briefFallback = (objects && objects.length)
    ? `Detected: ${objects.join(", ")}`
    : "Clear path ahead.";

  if (!process.env.GEMINI_API_KEY) return briefFallback;

  const isEmptyScene = !objects || objects.length === 0;

  // Turn layout into a tiny one-line context if present
  const layoutLine = layout
    ? [
        layout.left?.length   ? `Left: ${layout.left.join(", ")}`     : null,
        layout.center?.length ? `Center: ${layout.center.join(", ")}` : null,
        layout.right?.length  ? `Right: ${layout.right.join(", ")}`   : null
      ].filter(Boolean).join(" | ")
    : null;

  // Style rules to keep Gemini terse and useful
  const systemRules = [
    "Be concise and practical.",
    "Maximum 12 words.",
    "Only include necessary details for safe navigation.",
    "Use left/center/right if it clarifies direction.",
    "Avoid filler, avoid adjectives unless safety-critical."
  ].join(" ");

  const task = isEmptyScene
    ? "No salient objects; in one short sentence, describe surroundings like an empty hallway to guide safe movement."
    : "In one short sentence, describe detected objects with directional cues if useful.";

  const facts = [
    `Objects: ${objects && objects.length ? objects.join(", ") : "none"}`,
    layoutLine ? `Layout: ${layoutLine}` : null
  ].filter(Boolean).join("\n");

  const prompt = [
    `System rules: ${systemRules}`,
    `Task: ${task}`,
    `Context:\n${facts}`,
    `Respond with exactly one brief sentence.`
  ].join("\n\n");

  const model = "gemini-2.5-flash"; // or "gemini-2.5-pro"
  const url   = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

  try {
    const r = await axios.post(
      url,
      {
        contents: [{ role: "user", parts: [{ text: prompt }]}],
        generationConfig: {
          temperature: 0.2,      // keep it stable
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 32    // hard cap to keep it brief
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

    const text = r.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    // Safety net to ensure brevity even if the model rambles
    if (!text) return briefFallback;
    const clipped = text.split(/\s+/).slice(0, 14).join(" "); // extra guardrail
    return clipped;
  } catch (err) {
    console.error("Gemini error:", err?.response?.data || err.message);
    return briefFallback;
  }
};
