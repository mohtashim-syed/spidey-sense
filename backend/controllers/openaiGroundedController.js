// backend/controllers/openaiGroundedController.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function groundedDescribe(req, res) {
  try {
    const promptText = req.body?.prompt || "Where am I, and where should I go?";

    let detections = [];
    try {
      detections = JSON.parse(req.body?.detections ?? "[]");
    } catch {
      detections = [];
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ error: "No image uploaded." });
    }

    const usedObjects = Array.isArray(detections)
      ? detections.slice(0, 25).map(d => ({
          label: d.label ?? d.class ?? "object",
          left: d.bbox?.[0] ?? d.left ?? null,
          top: d.bbox?.[1] ?? d.top ?? null,
          width: d.bbox?.[2] ?? d.width ?? null,
          height: d.bbox?.[3] ?? d.height ?? null,
          confidence: d.score ?? d.confidence ?? null,
        }))
      : [];

    const mime = req.file.mimetype || "image/jpeg";
    const b64 = req.file.buffer.toString("base64");
    const dataUrl = `data:${mime};base64,${b64}`;

    // Ask plainly for JSON since response_format has moved; we’ll parse and guard below.
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text:
              "You are a navigation assistant for a blind user. " +
              "Given an image frame and detected objects, return STRICT JSON only with keys: " +
              "{answer, recommendation, confidence, location_guess, used_objects}. " +
              "No preamble, no markdown. Confidence must be a number 0..1."
            },
            { type: "input_text", text: `User prompt: ${promptText}` },
            { type: "input_text", text: "Detected objects (JSON): " + JSON.stringify(usedObjects) },
            { type: "input_image", image_url: dataUrl }
          ]
        }
      ],
      max_output_tokens: 400
    });

    const text = response.output_text?.trim() ?? "";
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Fallback: salvage something sensible
      return res.status(200).json({
        answer: text || "I couldn’t parse a structured answer.",
        recommendation: "Please try again.",
        confidence: 0.0,
        location_guess: "",
        used_objects: usedObjects.map(o => o.label).filter(Boolean),
        model: response.model,
        note: "No schema enforced (API changed). Returned raw text."
      });
    }

    return res.status(200).json({
      answer: parsed.answer ?? "",
      recommendation: parsed.recommendation ?? "",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.0,
      location_guess: parsed.location_guess ?? "",
      used_objects: Array.isArray(parsed.used_objects) ? parsed.used_objects : usedObjects.map(o => o.label).filter(Boolean),
      model: response.model
    });
  } catch (err) {
    console.error(err);
    const detail = (err?.error?.message) || err?.message || "Unknown error";
    return res.status(500).json({ error: "Failed to analyze scene.", detail });
  }
}
