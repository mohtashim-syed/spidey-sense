import axios from "axios";

export const streamSpeechFromElevenLabs = async (text, voiceId = "pNInz6obpgDQGcFmaJgB") => {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  return axios.post(
    url,
    {
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.8 }
    },
    {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      responseType: "stream"
    }
  );
};
