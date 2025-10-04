import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Route imports
import detectRoutes from "./routes/detect.js";
import speakRoutes from "./routes/speak.js";
import profileRoutes from "./routes/profile.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/detect", detectRoutes);
app.use("/api/speak", speakRoutes);
app.use("/api/profile", profileRoutes);

app.get("/", (req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html>
      <head><meta charset="utf-8"><title>Spidey-Sense Backend</title></head>
      <body style="font-family: system-ui;padding:24px">
        <h1>🕸️ Spidey-Sense Backend</h1>
        <p>Server is running on <code>http://localhost:${process.env.PORT || 5000}</code></p>
        <ul>
          <li>POST <code>/api/detect</code> → Gemini context</li>
          <li>POST <code>/api/speak</code> → ElevenLabs audio</li>
          <li>GET  <code>/api/profile</code> → Auth0 (mock)</li>
        </ul>
      </body>
    </html>
  `);
});

app.get("/test/speak", (req, res) => {
  res.type("html").send(`
<!doctype html>
<html><body style="font-family:system-ui;padding:24px">
  <h1>🔊 ElevenLabs Test</h1>
  <input id="text" style="width:420px" value="Spidey Sense activated. Door ahead.">
  <button id="go">Speak</button>
  <audio id="audio" controls></audio>
<script>
document.getElementById('go').onclick = async () => {
  const text = document.getElementById('text').value;
  const resp = await fetch('/api/speak', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ text })
  });
  if (!resp.ok) return alert('TTS failed');
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const audio = document.getElementById('audio');
  audio.src = url;
  audio.play();
};
</script>
</body></html>
  `);
});

app.listen(PORT, () =>
  console.log(`🚀 Server live on http://localhost:${PORT}`)
);
