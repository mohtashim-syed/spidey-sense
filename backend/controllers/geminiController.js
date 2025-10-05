import axios from "axios";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/**
 * @param {string[]} objects - Flat list of detected objects
 * @param {Object|null} layout - Optional spatial grouping { left:[], center:[], right:[] }
 * @param {Object} options - { mode: string, hint: string }
 */
export const getContextFromGemini = async (
  objects = [],
  layout = null,
  { mode = "Explore", hint = "" } = {}
) => {
  // Build a spatial description if layout is provided
  const spatialSummary = layout
    ? `Layout:\n- Left: ${layout.left?.join(", ") || "none"}\n- Center: ${layout.center?.join(", ") || "none"}\n- Right: ${layout.right?.join(", ") || "none"}`
    : "No explicit spatial layout provided.";

  const prompt = `
You are "Spidey-Sense", an AI vision narrator guiding visually impaired users.

Goal:
Describe surroundings clearly and calmly to help navigation.

Input:
- Scene hint: ${hint || "unknown"}
- Mode: ${mode}
- Objects detected: ${objects.length ? objects.join(", ") : "none"}
- ${spatialSummary}

Instructions:
1. Focus on obstacles (walls, doors) and safe paths.
2. Use spatial terms: ahead, left, right.
3. Mention door state (open/closed) if known.
4. Warn if walls or blocked paths exist.
5. Suggest if path forward is clear or not.
6. Keep calm, helpful tone. Max 2 short sentences.
7. In "Focus" mode, highlight only key obstacles.
8. In "Calm" mode, be minimal and reassuring.
`;

  try {
    const { data } = await axios.post(
      GEMINI_URL,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { "x-goog-api-key": process.env.GEMINI_API_KEY } }
    );

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || "Quiet area. No major obstacles detected.";
  } catch (err) {
    console.error("❌ Gemini error:", err.response?.data || err.message);
    throw new Error("Gemini API request failed");
  }
};
