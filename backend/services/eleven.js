// services/eleven.js
import { elevenClient } from "../lib/httpClient.js";

export async function synthesizeSpeech(text, voiceIdFromReq) {
  const apiKey = process.env.ELEVEN_API_KEY;
  if (!apiKey) throw new Error("ELEVEN_API_KEY missing");

  const voiceId = voiceIdFromReq || process.env.ELEVEN_VOICE_ID;
  if (!voiceId) throw new Error("ELEVEN_VOICE_ID missing or not provided");

  // POST /v1/text-to-speech/{voice_id}
  const resp = await elevenClient.post(
    `/v1/text-to-speech/${voiceId}`,
    {
      text,
      // optional: model_id: "eleven_multilingual_v2",
      // optional: voice_settings: { stability: 0.5, similarity_boost: 0.5 }
    },
    {
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json"
      },
      responseType: "arraybuffer" // we want the audio bytes
    }
  );

  // ElevenLabs typically returns audio/mpeg
  const contentType =
    resp.headers["content-type"] || "audio/mpeg";

  return { buffer: Buffer.from(resp.data), contentType };
}
