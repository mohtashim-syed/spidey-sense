// services/gemini.js
import { geminiClient } from "../lib/httpClient.js";

const MODEL = "models/gemini-1.5-flash"; // pick your model

export async function generateText(prompt) {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY missing");
  }

  // v1beta generateContent endpoint
  const path = `/v1beta/${MODEL}:generateContent`;

  const resp = await geminiClient.post(
    path,
    {
      contents: [{ role: "user", parts: [{ text: prompt }]}]
    },
    {
      params: { key: process.env.GOOGLE_API_KEY }
    }
  );

  // Safely unwrap the first text part
  const candidates = resp?.data?.candidates || [];
  const parts = candidates[0]?.content?.parts || [];
  const text = parts[0]?.text || "";
  return text;
}
