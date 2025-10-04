import axios from "axios";

export const getContextFromGemini = async (objects) => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ Missing GEMINI_API_KEY; returning fallback text.");
    return `Detected: ${objects.join(", ")}`;
  }

  const prompt = `
You are "Spidey-Sense", an AI vision narrator for visually-impaired users.

Your mission: describe the user's immediate surroundings in one or two short sentences,
focusing on spatial awareness and navigation safety.

Input:
- Scene: ${hint || "unknown"}
- Detected objects: ${JSON.stringify(objects, null, 2)}
- Mode: ${mode}

Instructions:
1. Clearly describe nearby objects and obstacles.
2. Mention their relative positions (front, left, right, behind).
3. Warn about walls or obstacles that block the path ("wall ahead", "door on right - closed").
4. If an open path exists, mention it ("path clear ahead").
5. Keep it calm, kind, and clear — no unnecessary words.
6. In Calm mode, be gentle and minimal.
7. Respond as a human guide would — helpful and descriptive.

Output: 1 sentences, maximum 5 words.
`;

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
  const headers = { "x-goog-api-key": process.env.GEMINI_API_KEY };

  try {
    const r = await axios.post(
      url,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers, timeout: 12000 }
    );

    const text = r.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || `Detected: ${objects.join(", ")}`;
  } catch (err) {
    console.error("❌ Gemini API error:", err?.response?.data || err.message);
    return `Detected: ${objects.join(", ")}`; // graceful fallback
  }
};
