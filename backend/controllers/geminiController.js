// This JS file will be the "computer vision" portion of the project
// where we prompt Gemini API to analyze images and return insights.

import axios from "axios";

export const getContextFromGemini = async (objects) => {
  const prompt = `You are Spidey-Sense. Describe these objects in a short helpful sentence for a visually impaired user: ${objects.join(", ")}.`;

  const res = await axios.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    {
      contents: [{ parts: [{ text: prompt }] }],
    },
    { headers: { "x-goog-api-key": process.env.GEMINI_API_KEY } }
  );

  const text = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
  return text;
};
