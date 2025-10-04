// This JS file will control the audio output using elevenLabs API
import axios from "axios";

export const getSpeechFromElevenLabs = async (text) => {
  const voiceId = "pNInz6obpgDQGcFmaJgB"; // default voice; change later

  const res = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    { text, model_id: "eleven_multilingual_v2" },
    {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      responseType: "arraybuffer",
    }
  );

  return res.data; // MP3 Buffer
};
