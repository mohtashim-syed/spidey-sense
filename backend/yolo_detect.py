import sys
import json
from ultralytics import YOLO
import cv2

def main():
    # ✅ Args: input_image, output_json
    if len(sys.argv) < 3:
        print("Usage: python yolo_detect.py <input_image> <output_json>")
        sys.exit(1)

    image_path = sys.argv[1]
    output_path = sys.argv[2]

    # ✅ Load model (medium for higher accuracy)
    model = YOLO("yolov8m.pt")

    # ✅ Run prediction
    results = model.predict(
        source=image_path,
        conf=0.35,        # confidence threshold
        imgsz=640,        # image size
        verbose=False
    )

    detections = []
    # ✅ Get frame dimensions for normalization
    img = cv2.imread(image_path)
    height, width, _ = img.shape

    for r in results:
        boxes = r.boxes
        names = model.names

        for box in boxes:
            cls_id = int(box.cls[0])
            label = names[cls_id]
            conf = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            # Normalize positions (0 to 1)
            cx = ((x1 + x2) / 2) / width
            w = (x2 - x1) / width

            # ✅ Filter to important classes
            key_labels = [
                "person", "chair", "sofa", "bed", "car",
                "bus", "truck", "bicycle", "table", "tv",
                "door", "refrigerator", "microwave", "oven", "sink"
            ]
            if label not in key_labels:
                continue

            # ✅ Approximate door state by width (very rough heuristic)
            if label == "door":
                state = "open" if w > 0.3 else "closed"
                label = f"door-{state}"

            detections.append({
                "label": label,
                "x": round(cx, 3),
                "width": round(w, 3),
                "confidence": round(conf, 2)
            })

    # ✅ Sort by confidence, descending
    detections.sort(key=lambda d: d["confidence"], reverse=True)

    # ✅ Write to JSON
    with open(output_path, "w") as f:
        json.dump(detections, f, indent=2)

    print(f"Detections saved to {output_path}")
    print(json.dumps(detections, indent=2))


if __name__ == "__main__":
    main()
