# Getting Started with the YOLOv10 Recycling Detection Server

This guide will help you set up and run the YOLOv10-based recycling detection server. YOLOv10 offers significant improvements over previous versions including better detection accuracy, faster inference speed, and improved handling of small objects.

## Setup

### 1. Install Dependencies

First, install all required dependencies:

```bash
pip install -r requirements.txt
```

### 2. Download a YOLO Model

You have several options:

#### Option 1: Automatic Download

The server will automatically download the YOLOv10n model on first run if no model is found.

#### Option 2: Download Specific Model

Use the download script to download a specific YOLOv10 model:

```bash
# Download the default YOLOv10n model (nano - fastest but less accurate)
python download_model.py

# Or specify a different model variant
python download_model.py --model yolov10s  # Small model - good balance of speed and accuracy
python download_model.py --model yolov10m  # Medium model - more accurate but slower
python download_model.py --model yolov10l  # Large model - very accurate but requires more GPU power
python download_model.py --model yolov10x  # Extra large model - most accurate but slowest
```

#### Option 3: Use a Custom Trained Model

If you have a custom trained model for recycling detection, place it in the `models` directory:

```
Backend/models/recyclables.pt
```

### 3. Run the Server

Start the detection server:

```bash
python recycling_detection_server.py
```

The server will run on `http://localhost:8080`.

## Using the Demo Interface

Once the server is running, open your web browser and navigate to:

```
http://localhost:8080/
```

This will open the detection demo interface where you can:

1. Allow access to your webcam
2. Show recyclable items to the camera
3. See real-time detection results with YOLOv10's improved accuracy
4. Reset detection with the "Reset Detection" button

## YOLOv10 Benefits for Recycling Detection

YOLOv10 offers several key advantages for recycling item detection:

1. **Higher Accuracy**: Better detection of difficult items like transparent plastics and flattened cardboard
2. **Faster Processing**: Lower latency for real-time detection
3. **Better Small Object Detection**: Improved ability to detect small recyclable items
4. **Reduced False Positives**: More precise classification between similar-looking items
5. **Lower Resource Usage**: Efficient processing even on modest hardware

## Supported Recyclable Detection

The system can now detect a variety of items across different categories:

### Recyclable Items
- Bottles
- Cans
- Paper cups
- Cardboard boxes
- Paper
- Plastic bags

### Kitchen Waste
- Carrot
- Potato
- Radish
- Potato chips
- Kiwi and other fruits

### Harmful Items
- Batteries
- Pills

### Other Items
- Stones
- China
- Bricks

### Non-Trash Items
- People (these are not considered trash!)

## Working with the API

### WebSocket API

The WebSocket API is ideal for real-time detection:

```javascript
// Connect to the WebSocket
const socket = new WebSocket('ws://localhost:8080/ws/detect');

// When connection is open
socket.onopen = () => {
  // Send a base64 encoded image
  const imageData = getBase64Image(); // Your function to get image data
  socket.send(imageData);
};

// Handle detection results
socket.onmessage = (event) => {
  const result = JSON.parse(event.data);
  console.log('Detections:', result.detections);
  console.log('Recyclable detected:', result.recyclable_detected);
};
```

### REST API

For simple status checks or to reset detection:

```javascript
// Check if a recyclable has been detected
fetch('/api/recyclable-status')
  .then(response => response.json())
  .then(data => console.log('Status:', data));

// Reset detection
fetch('/api/reset-detection', { method: 'POST' })
  .then(response => response.json())
  .then(data => console.log('Reset result:', data));
```

## Troubleshooting

### Model Loading Issues
- If you see errors about model loading, ensure your internet connection is active for the first run
- Try downloading a model manually using the download_model.py script
- For custom models, verify the model file is in the correct location and format

### WebSocket Connection
- Make sure the server is running on port 8080
- Check for any firewall or network restrictions
- Use the browser console to debug connection issues

### Detection Quality
- Ensure good lighting when showing items to the camera
- Hold items close enough to the camera
- If certain items aren't detected well, try using a more powerful model (yolov10s or yolov10m)
- YOLOv10 performs better than previous versions in challenging lighting conditions

## Training Your Own Custom Model

If you'd like to train a custom YOLOv10 model on your own recycling dataset:

1. Organize your labeled data in the DATASET directory
2. Use the Ultralytics YOLO framework to train your model:
   ```bash
   yolo train data=DATASET/data.yaml model=yolov10n.pt epochs=100
   ```
3. Place the resulting trained model in the models directory
4. Update the server to use your custom model

Check the README_RECYCLING.md file for more detailed information on custom model training.

## Next Steps

To further enhance the recycling detection system:

1. Explore the server code to understand how detection works
2. Modify detection thresholds in `YOLODetector` class for different sensitivity
3. Train your own custom YOLO model on specific recyclable items of interest 