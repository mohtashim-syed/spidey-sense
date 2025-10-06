## 🕷️ Spidey Sense
**Navigate the world, fearlessly.**<br>

AI-powered navigation assistant that helps visually impaired users explore their surroundings through real-time detection, spatial awareness, and conversational guidance.
Watch Here: (https://youtu.be/SmBhXeC8LCg?si=urIZ8hoMH9UmX-Rm)<br>

---
## 🌎 Social Impact
More than **285 million** people worldwide live with visual impairments. Traditional canes and GPS apps offer **limited awareness** — they can’t describe nearby obstacles or open paths.<br>

Spidey Sense transforms independence by **turning vision into voice and touch**, guiding users with real-time spatial awareness, conversational AI, and natural speech — empowering safer, more confident mobility.

---
## 🧠 Inspiration
We asked: “What if someone who can’t see could still **sense** the world like Spider-Man?” <br>

Most navigation tools tell you **where you are**, not **what’s around you**.
Visually impaired users often wonder:
> *“Is there something in front of me?”<br>
> “Can I move forward safely?”*<br>

So we built **Spidey Sense** — a friendly AI companion that *sees, thinks, and speaks*, helping users explore with awareness and trust.<br>

---
## 💡 What It Does
🧠 **Real-Time Object Detection** — Detects people, chairs, doors, and obstacles using **COCO-SSD**.<br>
🦯 **Spatial Awareness Engine** — Classifies objects into left, center, right zones for precise guidance.<br>
🗣️ **Conversational Companion (OpenAI API)** — Users ask questions like *“What’s around me?”* or *“Where can I go?”* and get natural, scene-aware responses.<br>
🔊 **Voice Synthesis (ElevenLabs)** — Converts Gemini’s replies into lifelike speech.<br>
🥐 **Smart Timer** — Periodically checks surroundings every 10 seconds or when voice is triggered.<br>
🪄 **Multi-Mode Awareness** — Switch between **Explore**, **Focus**, and **Follow** for different contexts.<br>

---

## 🌟 Key Benefits

👁️ **Vision → Voice** — Narrates your environment in real time.<br>
🦯 **Safe Movement** — Guides you away from dead ends and toward clear paths.<br>
🧠 **Conversational Insight** — Natural dialogue, not robotic alerts.<br>
🤱 **Touch Expansion** — Future-ready for haptic feedback integration.<br>
🌍 **Accessibility First** — Voice-first, minimalistic design built for independence.<br>

---

## 🚀 Use Cases

* Pedestrian navigation for the visually impaired
* Campus or indoor mobility for students
* Elderly users navigating homes and care facilities
* Assistive tech developers integrating multimodal AI

---

## 🛠️ How We Built It

### 🔥 Frontend

* React, CSS, JavaScript for a **voice-first UI**
* Web Speech API for push-to-talk and voice capture
* Mock interface simulating object detection + Gemini dialogue

### ⚙️ Backend

* **Node.js + Express** for API routing
* **COCO-SSD** model for live object detection
* **Open AI API** for contextual understanding and natural responses
* **ElevenLabs API** for lifelike voice output

### 🤖 AI & APIs

* **OpenAI API** → conversational reasoning and scene description
* **ElevenLabs TTS** → natural speech output
* **COCO-SSD** → real-time detection for 80+ object classes

---

## 🛇 Challenges We Overcame

🧩 Integrating three AI systems (vision + language + voice)<br>
🎤 Managing latency in voice-triggered queries<br>
🦯 Translating object positions into spatial guidance<br>
🎧 Designing a calm and empathetic voice UX<br>

---

## 🌺 Accomplishments

✅ End-to-end multimodal pipeline: *Detection → Scene Summary → Speech Output*<br>
✅ Scene-aware conversational Gemini responses<br>
✅ Periodic voice prompts (every 10 seconds)<br>
✅ Inclusive voice-first interface tested with real users<br>

---

## 📚 What We Learned

* **Context > Detection:** Users need **actionable guidance**, not raw data
* **Voice-first Design** improves trust and usability
* **Multimodal AI** bridges the gap between accessibility and autonomy
* Accessibility = intuitive speech, minimal friction, and reliability

---

## 🚀 Next Steps

🦡 Integrate **haptic belt feedback** for spatial direction<br>
🗺️ Add **indoor navigation** using AR markers<br>
📱 Launch a **mobile app** (Flutter) with offline support<br>
🧠 Expand **Gemini context memory** for multi-turn conversations<br>

---

## ❤️ Why Spidey Sense

**Spidey Sense** empowers visually impaired users to move confidently and independently — combining **sight, speech, and spatial intelligence** into one assistive companion.
It’s more than an app — it’s **AI that helps you *feel* your surroundings.**
