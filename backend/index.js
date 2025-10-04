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
  <title>🕸️ Spidey-Sense — Nav Prompt (Move Ahead / Object Ahead / Safe Turn)</title>
  <style>
    body { font-family: system-ui; margin: 0; padding: 20px; }
    h1 { margin-bottom: 12px; }
    .row { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
    #videoWrap { position: relative; width: 640px; height: 480px; background:#111; border-radius:12px; overflow:hidden; }
    #video { width: 640px; height: 480px; object-fit: cover; }
    #overlay { position:absolute; left:0; top:0; width:640px; height:480px; pointer-events:none; }
    #log { white-space: pre-wrap; background:#f6f6f6; padding:10px; border-radius:8px; min-height:100px; }
    .pill { display:inline-block; padding:4px 8px; border-radius:999px; background:#eee; margin:2px; }
    button, label, select { padding:8px 10px; border-radius:8px; border:1px solid #ccc; cursor:pointer; margin-right:8px; }
    .muted { color:#666 }
  </style>
</head>
<body>
  <h1>🕸️ Spidey-Sense — Navigation Guidance</h1>
  <div class="row">
    <div id="videoWrap">
      <video id="video" autoplay playsinline muted></video>
      <canvas id="overlay" width="640" height="480"></canvas>
    </div>
    <div style="flex:1; max-width:560px">
      <div style="margin-bottom:10px; display:flex; flex-wrap:wrap; gap:8px; align-items:center">
        <button id="startCam">🎥 Start Camera</button>
        <button id="toggleDetect" disabled>🕸️ Start Detect</button>
        <label><input type="checkbox" id="autoSpeak" checked> Auto Speak</label>
        <label>Mode:
          <select id="mode">
            <option>Explore</option>
            <option>Focus</option>
            <option>Calm</option>
          </select>
        </label>
      </div>

      <div><strong>Objects:</strong> <span id="objects"><em>none</em></span></div>
      <div style="margin-top:6px"><strong>Hint:</strong> <span id="hint" class="muted">—</span></div>
      <div style="margin-top:10px"><strong>Gemini:</strong> <div id="gemini" class="muted">(waiting…)</div></div>

      <div style="margin-top:10px"><strong>Log:</strong></div>
      <div id="log"></div>
      <audio id="audio" controls style="width:100%; margin-top:10px"></audio>
    </div>
  </div>

  <!-- TF.js + COCO-SSD -->
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js"></script>

  <script>
    // ===== UI refs
    const video = document.getElementById('video');
    const overlay = document.getElementById('overlay');
    const ctx = overlay.getContext('2d');
    const startCamBtn = document.getElementById('startCam');
    const toggleDetectBtn = document.getElementById('toggleDetect');
    const objectsEl = document.getElementById('objects');
    const hintEl = document.getElementById('hint');
    const geminiEl = document.getElementById('gemini');
    const logEl = document.getElementById('log');
    const audioEl = document.getElementById('audio');
    const autoSpeakChk = document.getElementById('autoSpeak');
    const modeSel = document.getElementById('mode');

    // ===== Config (keep under free-tier limits)
    const SCORE_THRESH = 0.3;
    const GEMINI_MIN_INTERVAL_MS = 9000;     // if objects present
    const GEMINI_EMPTY_INTERVAL_MS = 15000;  // if scene empty
    const SPEAK_COOLDOWN_MS = 2000;

    // ===== State
    let model = null;
    let running = false;
    let lastPostAt = 0;
    let lastSentKey = "";
    let lastSpokenKey = "";
    let speaking = false;
    let lastSpeakAt = 0;

    // ===== Helpers
    function log(msg){ logEl.textContent = '['+new Date().toLocaleTimeString()+'] '+msg+'\\n'+logEl.textContent; }
    function keyFor(names){ return names.slice().sort().join('|'); }
    function bucketSide(xCenter, width=640){ if (xCenter < width/3) return 'left'; if (xCenter > 2*width/3) return 'right'; return 'center'; }

    function drawBoxes(preds){
      ctx.clearRect(0,0,overlay.width, overlay.height);
      ctx.lineWidth = 2;
      ctx.font = "14px system-ui";
      preds.forEach(p => {
        if (p.score < SCORE_THRESH) return;
        const [x,y,w,h] = p.bbox;
        ctx.strokeStyle = 'red';
        ctx.strokeRect(x,y,w,h);
        const label = p.class + ' ' + Math.round(p.score*100) + '%';
        ctx.fillStyle = 'rgba(255,0,0,0.6)';
        ctx.fillRect(x, Math.max(0,y - 18), ctx.measureText(label).width + 10, 18);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, x + 5, Math.max(12, y - 5));
      });
    }

    async function speak(text, key){
      const now = performance.now();
      if (speaking || (now - lastSpeakAt < SPEAK_COOLDOWN_MS) || key === lastSpokenKey) return;
      speaking = true;
      lastSpeakAt = now;
      lastSpokenKey = key;
      try{
        const r = await fetch('/api/speak', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ text })
        });
        if(!r.ok){ log('Speak failed: '+r.status); return; }
        const blob = await r.blob();
        audioEl.src = URL.createObjectURL(blob);
        await audioEl.play().catch(e => log('Autoplay blocked: ' + e.message));
      } finally { speaking = false; }
    }

    // Build a navigation hint from layout
    function buildNavHint(layout, objects) {
      const left  = layout.left?.length   || 0;
      const front = layout.center?.length || 0;
      const right = layout.right?.length  || 0;

      // decide safest turn
      let safest = '';
      if (front > 0) {
        if (left === 0 && right > 0)      safest = 'turn left';
        else if (right === 0 && left > 0) safest = 'turn right';
        else if (left < right)            safest = 'turn left';
        else if (right < left)            safest = 'turn right';
        else                               safest = 'wait briefly';
      } else {
        safest = 'proceed';
      }

      const ahead = front > 0 ? 'obstacle ahead' : 'path clear ahead';
      return \`\${ahead}; safest: \${safest}\`;
    }

    // Call your backend /api/detect with objects, layout, mode, hint
    async function callDetect(objects, layout, mode, hint){
      const resp = await fetch('/api/detect', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ objects, layout, mode, hint })
      });
      const data = await resp.json().catch(()=> ({}));
      // backend should already enforce "1 sentence, ≤5 words"
      return data?.message || (objects.length ? ('Detected: '+objects.join(', ')) : 'Clear path ahead.');
    }

    async function detectLoop(){
      if(!running) return;

      const preds = await model.detect(video);
      drawBoxes(preds);

      const strong = preds.filter(p => p.score > SCORE_THRESH);
      const names = [...new Set(strong.map(p => p.class))];

      const layout = { left:[], center:[], right:[] };
      strong.forEach(p => {
        const [x,y,w,h] = p.bbox;
        const side = bucketSide(x + w/2, overlay.width);
        if (!layout[side].includes(p.class)) layout[side].push(p.class);
      });

      // UI updates
      objectsEl.innerHTML = names.length ? names.map(n => '<span class="pill">'+n+'</span>').join(' ') : '<em>none</em>';

      // compute mode + hint
      const mode = modeSel.value || "Explore";
      const hint = buildNavHint(layout, names);
      hintEl.textContent = hint;

      // throttle detect calls
      const k = keyFor(names);
      const now = performance.now();
      const minInt = names.length ? GEMINI_MIN_INTERVAL_MS : GEMINI_EMPTY_INTERVAL_MS;

      if ((k !== lastSentKey && (now - lastPostAt) > minInt) || (!names.length && (now - lastPostAt) > minInt)){
        lastPostAt = now;
        lastSentKey = k;
        try{
          log('POST /api/detect → ' + JSON.stringify({objects:names, layout, mode, hint}));
          const phrase = await callDetect(names, layout, mode, hint);
          geminiEl.textContent = phrase;
          log('Gemini → ' + phrase);
          if (autoSpeakChk.checked) await speak(phrase, k);
        } catch(e){
          log('Detect error: ' + e.message);
        }
      }

      requestAnimationFrame(detectLoop);
    }

    // ===== UI handlers
    document.getElementById('startCam').onclick = async () => {
      try{
        const stream = await navigator.mediaDevices.getUserMedia({ video:{ width:640, height:480 }, audio:false });
        video.srcObject = stream;
        await new Promise(r => video.onloadedmetadata = r);
        log('Camera started');

        if (!model){
          log('Loading model…');
          model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
          log('Model ready');
        }
        toggleDetectBtn.disabled = false;
      } catch(e){
        log('Camera error: ' + e.message);
        alert('Camera permissions required.');
      }
    };

    document.getElementById('toggleDetect').onclick = () => {
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
