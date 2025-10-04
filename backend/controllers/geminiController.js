// This JS file will be the "computer vision" portion of the project
// where we prompt Gemini API to analyze images and return insights.

// controllers/geminiController.js
import axios from "axios";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const getContextFromGemini = async (objects = [], hint = "", mode = "Explore") => {
  // Create a richer prompt
  const prompt = `
You are "Spidey-Sense", an AI awareness assistant inspired by Spider-Man.
Your goal: help a user who may have visual or attention challenges by describing surroundings in one short, calm, and useful sentence.

Context:
- Detected objects: ${objects.length ? objects.join(", ") : "none"}
- Scene hint: ${hint || "unknown"}
- Mode: ${mode}

Instructions:
- Keep tone empathetic, friendly, and brief.
- Provide spatial hints if possible (e.g., "ahead", "to your left").
- In "Focus" mode, only mention important or moving objects.
- In "Calm" mode, speak gently and minimally.
- In "Explore" mode, give a concise overview.

Respond with only one sentence.
`;

  try {
    const { data } = await axios.post(
      GEMINI_URL,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { "x-goog-api-key": process.env.GEMINI_API_KEY } }
    );

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || "Quiet area. No significant objects detected.";
  } catch (err) {
    console.error("Gemini error:", err.response?.data || err.message);
    throw new Error("Gemini API request failed");
  }
};
