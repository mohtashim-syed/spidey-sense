# test_yolo.py
from ultralytics import YOLO

# Load small, fast model
model = YOLO("yolov8n.pt")

# Run prediction on sample image
results = model("https://ultralytics.com/images/bus.jpg")

# Print detections
for r in results:
    boxes = r.boxes
    for box in boxes:
        cls = int(box.cls[0])
        label = model.names[cls]
        conf = float(box.conf[0])
        print(f"{label}: {conf:.2f}")
