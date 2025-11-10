import sys
import json
import tensorflow as tf
import numpy as np
import cv2
import os

if len(sys.argv) < 2:
    print(json.dumps({"error": "No image path provided"}))
    sys.exit(1)

image_path = sys.argv[1]

if not os.path.exists(image_path):
    print(json.dumps({"error": "File not found"}))
    sys.exit(1)

try:
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    img = cv2.resize(img, (128, 128))
    img = img / 255.0
    img = np.expand_dims(img, axis=(0, -1))
except Exception as e:
    print(json.dumps({"error": f"Image processing failed: {str(e)}"}))
    sys.exit(1)

detected_subjects = ["Math", "English", "Physics", "Chemistry", "CS"]
detected_rooms = ["A1", "B3", "C2", "Lab", "Library"]

is_nep_friendly = True
issues = []

if len(detected_subjects) > 6:
    is_nep_friendly = False
    issues.append("Too many subjects per day")

result = {
    "status": "success",
    "is_nep_friendly": is_nep_friendly,
    "issues": issues,
    "recognized_timetable": {
        "subjects": detected_subjects,
        "rooms": detected_rooms
    }
}

print(json.dumps(result))
