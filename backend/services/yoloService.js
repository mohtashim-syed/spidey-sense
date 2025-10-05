// services/yoloService.js
import { spawn } from "child_process";
import fs from "fs";

/**
 * Run YOLOv8 Python script on a base64 image.
 * @param {string} base64Image - base64 string of an image (no data:image/ prefix)
 * @returns {Promise<Array>} detections - list of detected objects
 */
export async function runYOLO(base64Image) {
  return new Promise((resolve, reject) => {
    try {
      const inputPath = "temp.jpg";
      const outputPath = "detections.json";

      // 1️⃣ Save base64 → image file
      const buffer = Buffer.from(base64Image, "base64");
      fs.writeFileSync(inputPath, buffer);

      // 2️⃣ Spawn Python process
      const py = spawn("python", ["yolo_detect.py", inputPath, outputPath]);

      // Optional: log stderr for debugging
      py.stderr.on("data", (data) => {
        console.error("[YOLO stderr]", data.toString());
      });

      py.on("close", (code) => {
        if (code !== 0) {
          console.error(`YOLO process exited with code ${code}`);
          return reject(new Error("YOLO detection failed"));
        }

        // 3️⃣ Read detections.json
        try {
          const raw = fs.readFileSync(outputPath, "utf8");
          const detections = JSON.parse(raw);
          resolve(detections);
        } catch (readErr) {
          reject(readErr);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
