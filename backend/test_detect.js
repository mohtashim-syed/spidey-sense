import fs from "fs";
import fetch from "node-fetch"; // if Node<18, npm i node-fetch@2

// Convert test image to base64
const img = fs.readFileSync("test.jpg", { encoding: "base64" });

// Send to backend
fetch("http://localhost:5000/detect", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ frame: img, mode: "focus" }),
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
