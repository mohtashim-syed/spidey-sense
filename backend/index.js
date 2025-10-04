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

app.get("/test/detect", (req, res) => {
  res.type("html").send(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>🕸️ Spidey-Sense — Auto Speak Detect</title>
  <style>
    body { font-family: system-ui; margin: 0; padding: 20px; }
    h1 { margin-bottom: 12px; }
    .row { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
    #videoWrap { position: relative; width: 640px; height: 480px; background:#111; border-radius:12px; overflow:hidden; }
    #video { width: 640px; height: 480px; object-fit: cover; }
    #overlay { position:absolute; left:0; top:0; width:640px; height:480px; pointer-events:none; }
    #log { white-space: pre-wrap; background:#f6f6f6; padding:10px; border-radius:8px; min-height:100px; }
    button, label { padding: 8px 10px; border-radius: 8px; border: 1px solid #ccc; cursor: pointer; margin-right: 8px; }
    .pill { display:inline-block; padding:4px 8px; border-radius:999px; background:#eee; margin:2px; }
    .controls { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:10px; }
  </style>
</head>
<body>
  <h1>🕸️ Spidey-Sense — Auto Speak on Detect</h1>
  <div class="row">
    <div id="videoWrap">
      <video id="video" autoplay playsinline muted></video>
      <canvas id="overlay" width="640" height="480"></canvas>
    </div>
    <div style="flex:1; max-width:520px">
      <div class="controls">
        <button id="startCam">🎥 Start Camera</button>
        <button id="toggleDetect" disabled>🕸️ Start Detect</button>
        <label><input type="checkbox" id="autoSpeak" checked> Auto Speak</label>
      </div>
      <div><strong>Objects:</strong> <span id="objects"><em>none</em></span></div>
      <div style="margin-top:10px"><strong>Gemini:</strong> <div id="gemini">(waiting…)</div></div>
      <div style="margin-top:10px"><strong>Log:</strong></div>
      <div id="log"></div>
      <audio id="audio" controls style="width:100%; margin-top:10px"></audio>
    </div>
  </div>

  <!-- TF.js + COCO-SSD -->
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js"></script>

  <script>
    const video = document.getElementById('video');
    const overlay = document.getElementById('overlay');
    const ctx = overlay.getContext('2d');
    const startCamBtn = document.getElementById('startCam');
    const toggleDetectBtn = document.getElementById('toggleDetect');
    const objectsEl = document.getElementById('objects');
    const geminiEl = document.getElementById('gemini');
    const logEl = document.getElementById('log');
    const audioEl = document.getElementById('audio');
    const autoSpeakChk = document.getElementById('autoSpeak');

    let model = null;
    let running = false;
    let lastPostAt = 0;
    let lastObjects = [];
    let lastSentKey = "";
    let lastSpokenKey = "";
    let speaking = false;
    let lastSpeakAt = 0;
    const SPEAK_COOLDOWN_MS = 2000; // prevent rapid-fire

    function log(msg) {
      logEl.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg + '\\n' + logEl.textContent;
    }

    function drawBoxes(preds) {
      ctx.clearRect(0,0,overlay.width, overlay.height);
      ctx.lineWidth = 2;
      ctx.font = "14px system-ui";
      preds.forEach(p => {
        if (p.score < 0.3) return;
        const [x, y, w, h] = p.bbox;
        ctx.strokeStyle = 'red';
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = 'rgba(255,0,0,0.6)';
        const label = p.class + ' ' + Math.round(p.score*100) + '%';
        ctx.fillRect(x, Math.max(0,y - 18), ctx.measureText(label).width + 10, 18);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, x + 5, Math.max(12,y - 5));
      });
    }

    function keyFor(names){ return names.slice().sort().join('|'); }

    async function speakText(text, keyForObjects) {
      // prevent overlaps + cooldown + don't repeat same set
      const now = performance.now();
      if (speaking) { log('Skip speak: already speaking'); return; }
      if (now - lastSpeakAt < SPEAK_COOLDOWN_MS) { log('Skip speak: cooldown'); return; }
      if (keyForObjects && keyForObjects === lastSpokenKey) { log('Skip speak: same objects'); return; }

      try {
        speaking = true;
        lastSpeakAt = now;
        lastSpokenKey = keyForObjects || '';
        log('TTS → /api/speak: ' + text);
        const resp = await fetch('/api/speak', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ text })
        });
        if (!resp.ok) { log('Speak failed: ' + resp.status); return; }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        audioEl.src = url;
        await audioEl.play().catch(e => log('Autoplay blocked: ' + e.message));
      } catch(e) {
        log('Speak error: ' + e.message);
      } finally {
        speaking = false;
      }
    }

    async function detectLoop() {
      if (!running) return;
      const preds = await model.detect(video);
      drawBoxes(preds);

      const names = [...new Set(preds.filter(p => p.score > 0.3).map(p => p.class))];
      lastObjects = names;
      objectsEl.innerHTML = names.map(n => '<span class="pill">'+n+'</span>').join(' ') || '<em>none</em>';

      const k = keyFor(names);
      const now = performance.now();

      // Only call backend if objects changed and throttled
      if (names.length && k !== lastSentKey && (now - lastPostAt) > 1200) {
        lastPostAt = now;
        lastSentKey = k;
        try {
          log('POST /api/detect → ' + JSON.stringify(names));
          const resp = await fetch('/api/detect', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ objects: names })
          });
          const raw = await resp.text();
          let phrase = '';
          try {
            const data = JSON.parse(raw);
            phrase = (data && data.message) ? data.message : '';
          } catch {
            log('Parse error from /api/detect: ' + raw);
          }

          if (!phrase) {
            phrase = 'Detected: ' + names.join(', ');
          }
          geminiEl.textContent = phrase;
          log('Gemini → ' + phrase);

          // Auto speak when enabled
          if (autoSpeakChk.checked) {
            await speakText(phrase, k);
          }
        } catch(e) {
          log('Detect error: ' + e.message);
          const fallback = 'Detected: ' + names.join(', ');
          geminiEl.textContent = fallback;
          if (autoSpeakChk.checked) {
            await speakText(fallback, k);
          }
        }
      }

      requestAnimationFrame(detectLoop);
    }

    startCamBtn.onclick = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
        video.srcObject = stream;
        await new Promise(r => video.onloadedmetadata = r);
        log('Camera started');

        if (!model) {
          log('Loading model…');
          model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
          log('Model ready');
        }
        toggleDetectBtn.disabled = false;
      } catch(e) {
        log('Camera error: ' + e.message);
        alert('Camera permissions required.');
      }
    };

    toggleDetectBtn.onclick = () => {
      running = !running;
      toggleDetectBtn.textContent = running ? '⏸️ Stop Detect' : '🕸️ Start Detect';
      if (running) detectLoop();
    };
  </script>
</body>
</html>
  `);
});



app.listen(PORT, () =>
  console.log(`🚀 Server live on http://localhost:${PORT}`)
);
