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
  <title>🕸️ Spidey-Sense — Object Detection Test</title>
  <style>
    body { font-family: system-ui; margin: 0; padding: 20px; }
    h1 { margin-bottom: 12px; }
    .row { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
    #videoWrap { position: relative; width: 640px; height: 480px; background:#111; border-radius:12px; overflow:hidden; }
    #video { width: 640px; height: 480px; object-fit: cover; }
    #overlay { position:absolute; left:0; top:0; width:640px; height:480px; pointer-events:none; }
    #log { white-space: pre-wrap; background:#f6f6f6; padding:10px; border-radius:8px; min-height:100px; }
    button { padding: 10px 14px; border-radius: 8px; border: 1px solid #ccc; cursor: pointer; margin-right: 6px; }
    .pill { display:inline-block; padding:4px 8px; border-radius:999px; background:#eee; margin:2px; }
  </style>
</head>
<body>
  <h1>🕸️ Spidey-Sense — Camera Object Detection</h1>
  <div class="row">
    <div id="videoWrap">
      <video id="video" autoplay playsinline muted></video>
      <canvas id="overlay" width="640" height="480"></canvas>
    </div>
    <div style="flex:1; max-width:520px">
      <div style="margin-bottom:10px">
        <button id="startCam">🎥 Start Camera</button>
        <button id="toggleDetect" disabled>🕸️ Start Detect</button>
        <button id="speak" disabled>🔊 Speak</button>
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
    const speakBtn = document.getElementById('speak');
    const objectsEl = document.getElementById('objects');
    const geminiEl = document.getElementById('gemini');
    const logEl = document.getElementById('log');
    const audioEl = document.getElementById('audio');

    let model = null;
    let running = false;
    let lastPostAt = 0;
    let lastObjects = [];
    let lastSentKey = "";

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
        ctx.fillRect(x, y - 18, ctx.measureText(p.class).width + 10, 18);
        ctx.fillStyle = '#fff';
        ctx.fillText(p.class, x + 5, y - 5);
      });
    }

    function keyFor(names){ return names.slice().sort().join('|'); }

    async function detectLoop() {
      if (!running) return;
      const preds = await model.detect(video);
      drawBoxes(preds);

      const names = [...new Set(preds.filter(p => p.score > 0.3).map(p => p.class))];
      lastObjects = names;
      objectsEl.innerHTML = names.map(n => '<span class="pill">'+n+'</span>').join(' ') || '<em>none</em>';

      const k = keyFor(names);
      const now = performance.now();

      if (names.length && k !== lastSentKey && (now - lastPostAt) > 1500) {
        lastPostAt = now;
        lastSentKey = k;
        try {
          log('Sending to /api/detect → ' + JSON.stringify(names));
          const resp = await fetch('/api/detect', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ objects: names })
          });
          const text = await resp.text();
          try {
            const data = JSON.parse(text);
            geminiEl.textContent = data.message || '(no message)';
            log('Gemini: ' + geminiEl.textContent);
          } catch(e) {
            geminiEl.textContent = '(parse error)';
            log('Gemini parse error: ' + text);
          }
        } catch(e) {
          geminiEl.textContent = '(request failed)';
          log('Gemini fetch error: ' + e.message);
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
      speakBtn.disabled = !running;
      if (running) detectLoop();
    };

    speakBtn.onclick = async () => {
      try {
        const text = geminiEl.textContent || (lastObjects.length ? ('Detected: ' + lastObjects.join(', ')) : 'No objects detected.');
        log('Sending to /api/speak → ' + text);
        const resp = await fetch('/api/speak', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ text })
        });
        if (!resp.ok) { log('speak failed: ' + resp.status); return; }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        audioEl.src = url;
        audioEl.play();
        log('Playing ElevenLabs audio');
      } catch(e) {
        log('Speak error: ' + e.message);
      }
    };
  </script>
</body>
</html>
  `);
});


app.listen(PORT, () =>
  console.log(`🚀 Server live on http://localhost:${PORT}`)
);
