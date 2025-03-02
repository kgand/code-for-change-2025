import os
import cv2
import numpy as np
import base64
from typing import List, Dict, Union
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from pydantic import BaseModel
import asyncio
import time
from ultralytics import YOLO
import pickle
import traceback

# Add joblib for alternative model loading
try:
    import joblib
    HAVE_JOBLIB = True
except ImportError:
    HAVE_JOBLIB = False
    print("joblib not available, will try alternative loading methods")

# Try to import sklearn for model handling
try:
    import sklearn
    HAVE_SKLEARN = True
except ImportError:
    HAVE_SKLEARN = False
    print("sklearn not available, some model features may not work")

# Initialize FastAPI app
app = FastAPI(title="Recyclable Detection Server")

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Define material classes for recyclables based on the model.pkl classification
MATERIAL_CLASSES = {
    0: "Paper",
    1: "Plastic",
    2: "Glass", 
    3: "Metal",
    4: "Others"
}

# Define recyclability status for each material class
RECYCLABLE_STATUS = {
    "Paper": True,
    "Plastic": True,
    "Glass": True,
    "Metal": True,
    "Others": False  # Generally not recyclable
}

# Variable to track if a recyclable has been detected
recyclable_detected = False
last_detection_result = {"detected": False, "class": None, "confidence": 0.0, "recyclable": False}

# YOLOv10-based detector - Upgraded from YOLOv8 for improved detection capabilities
class YOLODetector:
    def __init__(self, model_path=None):
        """
        Initialize the detector
        Args:
            model_path: Path to the model file (.pt or .pkl)
        """
        # Flag to indicate whether we're using pickle model
        self.is_pickle_model = False
        
        # Check for model.pkl specifically first
        pkl_path = os.path.join(os.path.dirname(__file__), "models", "model.pkl")
        print(f"*** CHECKING FOR MODEL.PKL: {pkl_path} ***")
        if os.path.exists(pkl_path):
            print(f"*** FOUND MODEL.PKL: {pkl_path} ***")
            
            # Try multiple methods to load the model
            model_loaded = False
            
            # Method 1: Try loading with joblib if available
            if HAVE_JOBLIB and not model_loaded:
                try:
                    print("Attempting to load model with joblib...")
                    self.model = joblib.load(pkl_path)
                    print(f"Model successfully loaded with joblib! Type: {type(self.model)}")
                    model_loaded = True
                except Exception as e:
                    print(f"Joblib loading failed: {e}")
            
            # Method 2: Try loading with custom pickle handler
            if not model_loaded:
                try:
                    print("Attempting to load model with custom pickle handler...")
                    
                    # Define a custom persistent_load function
                    def persistent_load(pid):
                        print(f"Persistent load called with {pid}")
                        return pid
                    
                    with open(pkl_path, 'rb') as f:
                        # Use an Unpickler with custom persistent_load
                        unpickler = pickle.Unpickler(f)
                        unpickler.persistent_load = persistent_load
                        self.model = unpickler.load()
                        
                    print(f"Model successfully loaded with custom unpickler! Type: {type(self.model)}")
                    model_loaded = True
                except Exception as e:
                    print(f"Custom pickle loading failed: {e}")
                    print(traceback.format_exc())
            
            # Method 3: Standard pickle load as last resort
            if not model_loaded:
                try:
                    print("Attempting standard pickle load as last resort...")
                    with open(pkl_path, 'rb') as f:
                        self.model = pickle.load(f)
                    model_loaded = True
                except Exception as e:
                    print(f"Standard pickle load failed: {e}")
                    print(traceback.format_exc())
            
            # Check if any method succeeded
            if model_loaded:
                # Verify the model has predict method
                if hasattr(self.model, 'predict'):
                    print("Material classification model loaded successfully!")
                    self.is_pickle_model = True
                    
                    # Print model details if available
                    if hasattr(self.model, 'classes_'):
                        print(f"Model classes: {self.model.classes_}")
                    if hasattr(self.model, 'n_features_in_'):
                        print(f"Model expects {self.model.n_features_in_} features")
                else:
                    print("ERROR: Loaded model doesn't have predict method")
                    self._load_yolo_fallback()
            else:
                print("All model loading methods failed.")
                self._load_yolo_fallback()
        else:
            print(f"Model.pkl not found at {pkl_path}")
            self._load_yolo_fallback()
        
        # Set confidence threshold
        self.confidence_threshold = 0.45
        
        # Print final confirmation of which model is being used
        if self.is_pickle_model:
            print("✅ ACTIVE MODEL: Material Classification Model (model.pkl)")
        else:
            print("⚠️ ACTIVE MODEL: YOLO Object Detection (Fallback)")
    
    def _load_yolo_fallback(self):
        """Helper method to load YOLO as fallback"""
        print("*** Falling back to YOLO model ***")
        if os.path.exists("yolov10n.pt"):
            print("Loading existing YOLOv10n model...")
            self.model = YOLO("yolov10n.pt")
        else:
            print("Downloading YOLOv10n model...")
            self.model = YOLO("yolov10n.pt")
        self.is_pickle_model = False
        
    def check_for_cardboard_texture(self, frame):
        """
        Simple texture-based detector for cardboard.
        Uses edge detection and texture analysis to identify cardboard-like patterns.
        Returns True if cardboard texture is detected, False otherwise.
        """
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Apply Canny edge detection
            edges = cv2.Canny(blurred, 50, 150)
            
            # Apply morphological operations to connect edges
            kernel = np.ones((5,5), np.uint8)
            dilated = cv2.dilate(edges, kernel, iterations=1)
            
            # Count the number of edge pixels
            edge_pixel_count = np.count_nonzero(dilated)
            
            # Calculate the percentage of edge pixels
            total_pixels = frame.shape[0] * frame.shape[1]
            edge_percentage = (edge_pixel_count / total_pixels) * 100
            
            # Calculate texture variance (cardboard has moderate texture variance)
            texture_variance = np.var(gray)
            
            # Check if the edge percentage and texture variance are within cardboard-like ranges
            is_cardboard = (3 < edge_percentage < 20) and (500 < texture_variance < 3000)
            
            if is_cardboard:
                print(f"Cardboard texture detected! Edge %: {edge_percentage:.2f}, Variance: {texture_variance:.2f}")
            
            return is_cardboard
        except Exception as e:
            print(f"Error in cardboard texture detection: {e}")
            return False
            
    def detect(self, frame):
        """
        Run detection on a frame using either YOLO or pickle model
        Returns a list of detections
        """
        detections = []
        
        # Enhanced preprocessing
        enhanced_frame = frame.copy()
        enhanced_frame = cv2.convertScaleAbs(enhanced_frame, alpha=1.05, beta=3)
        
        if self.is_pickle_model:
            print("📊 Using material classification model (model.pkl)")
            try:
                # Process frame for material classification
                # Resize to expected input size (224x224 for most image classification models)
                resized_frame = cv2.resize(enhanced_frame, (224, 224))
                
                # Convert from BGR to RGB (OpenCV loads as BGR)
                rgb_frame = cv2.cvtColor(resized_frame, cv2.COLOR_BGR2RGB)
                
                # Normalize pixel values to [0,1]
                normalized_frame = rgb_frame / 255.0
                
                # Flatten the image for the model
                features = normalized_frame.reshape(1, -1)
                
                # Make prediction - try different input formats if needed
                try:
                    # First try standard flattened format
                    prediction = self.model.predict(features)
                    print(f"Prediction result: {prediction}")
                except Exception as e:
                    print(f"Error with flattened format: {e}")
                    # Try channel-last format (common for CNN models)
                    features = normalized_frame.reshape(1, 224, 224, 3)
                    prediction = self.model.predict(features)
                    print(f"Prediction with channel-last format: {prediction}")
                
                # Process prediction results
                if hasattr(prediction, '__len__') and len(prediction) > 0:
                    # Get predicted class index
                    class_id = int(prediction[0])
                    
                    # Default high confidence for material detection
                    confidence = 0.95
                    
                    # Try to get actual confidence if model supports it
                    if hasattr(self.model, 'predict_proba'):
                        try:
                            proba = self.model.predict_proba(features)
                            confidence = float(proba[0][class_id])
                        except Exception:
                            pass
                    
                    # Map class_id to material class name
                    if class_id in MATERIAL_CLASSES:
                        class_name = MATERIAL_CLASSES[class_id]
                        recyclable = RECYCLABLE_STATUS.get(class_name, False)
                        
                        # Create detection object
                        detection = {
                            "class_id": class_id,
                            "class_name": class_name,
                            "confidence": confidence,
                            "recyclable": recyclable,
                            "bbox": [0, 0, frame.shape[1], frame.shape[0]]  # Full frame bbox
                        }
                        
                        detections.append(detection)
                        print(f"🔍 DETECTED: {class_name} (Recyclable: {recyclable}) with confidence {confidence:.2f}")
                    else:
                        print(f"Unknown class ID: {class_id}")
            except Exception as e:
                print(f"Error in material classification: {e}")
                traceback_info = traceback.format_exc()
                print(f"Traceback: {traceback_info}")
        else:
            print("Using YOLO model - material classification model not active")
            # YOLO detection logic
            results = self.model.predict(
                enhanced_frame, 
                conf=self.confidence_threshold, 
                iou=0.4,
                verbose=False
            )
            
            # Process YOLO results
            if results and len(results) > 0:
                result = results[0]
                for box in result.boxes:
                    class_id = int(box.cls.item())
                    confidence = float(box.conf.item())
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    
                    if class_id < len(result.names):
                        class_name = result.names[class_id]
                        detection = {
                            "class_id": class_id,
                            "class_name": class_name,
                            "confidence": confidence,
                            "recyclable": False,  # Default for YOLO
                            "bbox": [x1, y1, x2, y2]
                        }
                        detections.append(detection)
        
        return detections

# Initialize our detector directly with the model.pkl path
print("\n" + "="*80)
print("INITIALIZING MATERIAL CLASSIFICATION MODEL")
print("="*80)

# Look specifically for model.pkl
model_path = os.path.join(os.path.dirname(__file__), "models", "model.pkl")
if os.path.exists(model_path):
    print(f"✅ FOUND model.pkl at {model_path}")
    print(f"Available material classes: {', '.join(MATERIAL_CLASSES.values())}")
else:
    print(f"❌ model.pkl NOT FOUND at {model_path}")

# Create the detector with model.pkl path
detector = YOLODetector(model_path)

# Double check we're using the right model
if detector.is_pickle_model:
    print("✅ SUCCESS: Using material classification model (model.pkl)")
    print("   This will classify materials as: Paper, Plastic, Glass, Metal, Others")
else:
    print("⚠️ WARNING: Using YOLO model as fallback - material classification unavailable")
    print("   This likely means there was an error loading model.pkl")

print("="*80 + "\n")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

# Main detection endpoint
@app.websocket("/ws/detect")
async def websocket_endpoint(websocket: WebSocket):
    global recyclable_detected, last_detection_result
    await manager.connect(websocket)
    client = websocket.client
    print(f"New WebSocket connection from {client[0]}:{client[1]}")
    
    try:
        while True:
            # Receive the base64 encoded image from the client
            data = await websocket.receive_text()
            
            # Check if it's a reset signal
            if data == "RESET_DETECTION":
                recyclable_detected = False
                last_detection_result = {"detected": False, "class": None, "confidence": 0.0, "recyclable": False}
                print(f"Reset detection request from {client[0]}:{client[1]}")
                await websocket.send_json({"status": "reset_complete"})
                continue
            
            # Skip the data URL prefix to get the base64 data
            if "," in data:
                base64_data = data.split(",")[1]
            else:
                base64_data = data
            
            # Decode the base64 image
            image_bytes = base64.b64decode(base64_data)
            image_array = np.frombuffer(image_bytes, dtype=np.uint8)
            frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            
            if frame is None:
                print(f"Invalid image data received from {client[0]}:{client[1]}")
                await websocket.send_json({"error": "Invalid image data"})
                continue
            
            # Run detection on the frame
            detections = detector.detect(frame)
            
            # Update detection status
            if detections:
                highest_conf = max(detections, key=lambda x: x['confidence'])
                
                # Update recyclable status based on material class
                recyclable = highest_conf.get('recyclable', False)
                if recyclable:
                    recyclable_detected = True
                    print(f"Recyclable material detected: {highest_conf['class_name']} with {highest_conf['confidence']:.2f} confidence")
                else:
                    print(f"Non-recyclable material detected: {highest_conf['class_name']} with {highest_conf['confidence']:.2f} confidence")
                
                # Always update last_detection_result with the highest confidence detection
                last_detection_result = {
                    "detected": True,
                    "class": highest_conf['class_name'],
                    "confidence": highest_conf['confidence'],
                    "recyclable": recyclable
                }
            
            # Send result back to client
            result = {
                "detections": detections,
                "recyclable_detected": recyclable_detected,
                "last_detection": last_detection_result
            }
            await websocket.send_json(result)
            
    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {client[0]}:{client[1]}")
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Error in WebSocket connection from {client[0]}:{client[1]}: {str(e)}")
        if websocket in manager.active_connections:
            manager.disconnect(websocket)

# API endpoint to check if a recyclable has been detected
@app.get("/api/recyclable-status")
async def get_recyclable_status():
    global recyclable_detected, last_detection_result
    print(f"Status check: recyclable_detected={recyclable_detected}")
    return {
        "recyclable_detected": recyclable_detected,
        "last_detection": last_detection_result
    }

# API endpoint to reset the detection status
@app.post("/api/reset-detection")
async def reset_detection():
    global recyclable_detected, last_detection_result
    recyclable_detected = False
    last_detection_result = {"detected": False, "class": None, "confidence": 0.0, "recyclable": False}
    print("Detection status reset via API")
    return {"status": "success", "message": "Detection status reset"}

# Route for the detection demo page
@app.get("/", response_class=HTMLResponse)
async def get_detection_page():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Recyclable Detection Demo</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f0f0f0;
                text-align: center;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background-color: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #4CAF50;
            }
            #video-container {
                margin: 20px 0;
                position: relative;
            }
            #detection-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
            }
            #status {
                margin: 20px 0;
                padding: 15px;
                border-radius: 5px;
                font-weight: bold;
            }
            .waiting {
                background-color: #FFF9C4;
                color: #F57F17;
            }
            .success {
                background-color: #E8F5E9;
                color: #2E7D32;
            }
            video {
                width: 100%;
                border-radius: 10px;
                border: 2px solid #ddd;
            }
            button {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 10px 15px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
                margin: 10px 5px;
                cursor: pointer;
                border-radius: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Recyclable Detection Demo</h1>
            <p>Show a recyclable item to the camera. The system will detect it and enable you to restart the game.</p>
            
            <div id="video-container">
                <video id="webcam" autoplay playsinline></video>
                <canvas id="detection-overlay"></canvas>
            </div>
            
            <div id="status" class="waiting">Waiting for recyclable item...</div>
            
            <button id="reset-btn">Reset Detection</button>
            <button id="test-btn" style="background-color: #2196F3;">Test With Sample Image</button>
        </div>

        <script>
            let socket;
            let lastDetectionTime = 0;
            const detectionCooldown = 1000; // 1 second cooldown
            
            // Start webcam
            async function setupWebcam() {
                const video = document.getElementById('webcam');
                const constraints = {
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user'
                    }
                };
                
                try {
                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    video.srcObject = stream;
                    return true;
                } catch (err) {
                    console.error('Error accessing webcam:', err);
                    document.getElementById('status').innerText = 'Error: Cannot access webcam';
                    document.getElementById('status').className = 'error';
                    return false;
                }
            }
            
            // Connect to WebSocket
            function connectWebSocket() {
                // Determine correct WebSocket URL (secure or not)
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = protocol + '//' + window.location.host + '/ws/detect';
                
                socket = new WebSocket(wsUrl);
                
                socket.onopen = function(e) {
                    console.log('WebSocket connection established');
                };
                
                socket.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    
                    if (data.error) {
                        console.error('Server error:', data.error);
                        return;
                    }
                    
                    if (data.detections && data.detections.length > 0) {
                        // Update UI to show detection
                        const detection = data.detections[0];
                        const recyclableText = detection.recyclable ? "Recyclable" : "Non-recyclable";
                        document.getElementById('status').innerText = 
                            `Detected: ${detection.class_name} - ${recyclableText} (${Math.round(detection.confidence * 100)}% confidence)`;
                        
                        // If it's recyclable update class to success, otherwise show warning
                        if (detection.recyclable) {
                            document.getElementById('status').className = 'success';
                        } else {
                            document.getElementById('status').className = 'waiting';
                        }
                        
                        // Draw bounding box with appropriate color
                        drawBoundingBox(detection);
                    } else {
                        // No detection
                        document.getElementById('status').innerText = 'Waiting for recyclable item...';
                        document.getElementById('status').className = 'waiting';
                        
                        // Clear canvas
                        const canvas = document.getElementById('detection-overlay');
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                };
                
                socket.onclose = function(event) {
                    console.log('WebSocket connection closed');
                    // Try to reconnect after a delay
                    setTimeout(connectWebSocket, 2000);
                };
                
                socket.onerror = function(error) {
                    console.error('WebSocket error:', error);
                };
            }
            
            // Draw bounding box on canvas
            function drawBoundingBox(detection) {
                const video = document.getElementById('webcam');
                const canvas = document.getElementById('detection-overlay');
                
                // Match canvas size to video
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Determine color based on recyclability
                let color = '#4CAF50';  // Default green for recyclable
                if (!detection.recyclable) {
                    color = '#F44336';  // Red for non-recyclable
                }
                
                // Draw bounding box
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.strokeRect(
                    detection.bbox[0], 
                    detection.bbox[1], 
                    detection.bbox[2], 
                    detection.bbox[3]
                );
                
                // Draw label
                ctx.fillStyle = color;
                ctx.font = '16px Arial';
                const recyclableText = detection.recyclable ? "Recyclable" : "Non-recyclable";
                const label = `${detection.class_name} (${Math.round(detection.confidence * 100)}%) - ${recyclableText}`;
                ctx.fillText(
                    label,
                    detection.bbox[0], 
                    detection.bbox[1] > 20 ? detection.bbox[1] - 5 : detection.bbox[1] + 20
                );
            }
            
            // Send frame to server for detection
            function sendFrameForDetection() {
                if (!socket || socket.readyState !== WebSocket.OPEN) {
                    return;
                }
                
                const now = Date.now();
                if (now - lastDetectionTime < detectionCooldown) {
                    return; // Skip if within cooldown period
                }
                
                lastDetectionTime = now;
                
                const video = document.getElementById('webcam');
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Get base64 image data
                const imageData = canvas.toDataURL('image/jpeg', 0.7);
                
                // Send to WebSocket
                socket.send(imageData);
            }
            
            // Reset detection status
            async function resetDetection() {
                // Visual feedback
                document.getElementById('status').innerText = 'Resetting detection status...';
                
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send("RESET_DETECTION");
                } else {
                    // Fallback to REST API if WebSocket is not available
                    try {
                        const response = await fetch('/api/reset-detection', {
                            method: 'POST',
                        });
                        const data = await response.json();
                        console.log('Reset response:', data);
                    } catch (err) {
                        console.error('Error resetting detection:', err);
                    }
                }
                
                // Clear canvas
                const canvas = document.getElementById('detection-overlay');
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Reset status UI
                document.getElementById('status').innerText = 'Waiting for recyclable item...';
                document.getElementById('status').className = 'waiting';
            }
            
            // Simulate detection with a test image
            function testWithSampleImage() {
                // Create a simple green image that will trigger detection
                const canvas = document.createElement('canvas');
                canvas.width = 640;
                canvas.height = 480;
                const ctx = canvas.getContext('2d');
                
                // Draw green rectangle (will be detected as recyclable)
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Get base64 image
                const imageData = canvas.toDataURL('image/jpeg', 0.7);
                
                // Send to WebSocket if open
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(imageData);
                }
            }
            
            // Initialize
            document.addEventListener('DOMContentLoaded', async function() {
                // Set up event listeners
                document.getElementById('reset-btn').addEventListener('click', resetDetection);
                document.getElementById('test-btn').addEventListener('click', testWithSampleImage);
                
                // Initialize webcam and WebSocket
                const webcamReady = await setupWebcam();
                if (webcamReady) {
                    connectWebSocket();
                    
                    // Start detection loop
                    setInterval(sendFrameForDetection, 200); // Send frame every 200ms
                }
                
                // Resize canvas when video dimensions are available
                document.getElementById('webcam').addEventListener('loadedmetadata', function() {
                    const video = document.getElementById('webcam');
                    const canvas = document.getElementById('detection-overlay');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                });
            });
        </script>
    </body>
    </html>
    """

# Run the app with uvicorn if this file is executed directly
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080) 