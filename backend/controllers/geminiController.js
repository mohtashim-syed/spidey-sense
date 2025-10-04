import axios from "axios";

export const getContextFromGemini = async (objects) => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ Missing GEMINI_API_KEY; returning fallback text.");
    return `Detected: ${objects.join(", ")}`;
  }

  const prompt = `You are Spidey-Sense. In one short sentence, describe these objects to a visually impaired user with helpful spatial hints if typical: ${objects.join(", ")}.`;

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
