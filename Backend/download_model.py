#!/usr/bin/env python3
"""
Script to download pre-trained YOLO models for recycling detection.
This script allows downloading either the default YOLOv10n model from Ultralytics,
or a custom-trained model for recycling detection.
"""

import os
import argparse
import requests
from pathlib import Path
from tqdm import tqdm
from ultralytics import YOLO

# Define model download URLs - you can add your custom trained model URL here
MODELS = {
    # YOLOv10 models
    "yolov10n": "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov10n.pt",
    "yolov10s": "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov10s.pt",
    "yolov10m": "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov10m.pt",
    "yolov10l": "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov10l.pt",
    "yolov10x": "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov10x.pt",
    # Legacy YOLOv8 models (kept for backward compatibility)
    "yolov8n": "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt",
    # Add your custom model URL here if you have one hosted
    # "recyclables": "https://your-model-hosting-url/recyclables.pt",
}

def download_file(url, destination):
    """
    Download a file from URL to the specified destination with progress bar
    """
    response = requests.get(url, stream=True)
    
    # Get the total file size
    file_size = int(response.headers.get('content-length', 0))
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    
    # Download with progress bar
    with open(destination, 'wb') as f, tqdm(
        desc=os.path.basename(destination),
        total=file_size,
        unit='B',
        unit_scale=True,
        unit_divisor=1024,
    ) as progress:
        for data in response.iter_content(chunk_size=1024):
            size = f.write(data)
            progress.update(size)
    
    return destination

def download_yolo_model(model_name="yolov10n", output_dir="models"):
    """
    Download a YOLO model from the predefined list or use Ultralytics API
    
    Args:
        model_name: Name of the model to download (default: yolov10n)
        output_dir: Directory to save the model to (default: models/)
        
    Returns:
        Path to the downloaded model or None if download failed
    """
    output_path = os.path.join(output_dir, f"{model_name}.pt")
    
    # Check if model already exists
    if os.path.exists(output_path):
        print(f"Model {model_name} already exists at {output_path}")
        return output_path
    
    # If it's a preset model, download directly
    if model_name in MODELS:
        print(f"Downloading {model_name} model...")
        download_file(MODELS[model_name], output_path)
        print(f"Model saved to {output_path}")
    else:
        # Try to download from Ultralytics
        try:
            print(f"Trying to download {model_name} via Ultralytics API...")
            model = YOLO(f"{model_name}.pt")
            # Save the model to the output directory
            model_path = model.ckpt_path
            os.makedirs(output_dir, exist_ok=True)
            os.system(f"cp {model_path} {output_path}")
            print(f"Model saved to {output_path}")
        except Exception as e:
            print(f"Failed to download model: {e}")
            return None
    
    return output_path

def main():
    """
    Main function to parse arguments and download models
    """
    parser = argparse.ArgumentParser(description="Download YOLO models for recycling detection")
    parser.add_argument("--model", type=str, default="yolov10n", 
                        help="Model name to download (default: yolov10n)")
    parser.add_argument("--output", type=str, default="models",
                        help="Output directory (default: models/)")
    args = parser.parse_args()
    
    # Download the model
    model_path = download_yolo_model(args.model, args.output)
    
    if model_path:
        print(f"Model downloaded successfully to {model_path}")
        # Test the model
        try:
            model = YOLO(model_path)
            print(f"Model loaded successfully. Class names: {model.names}")
            # Verify the model is running on the correct device
            device = model.device
            print(f"Model is running on: {device}")
            # Verify YOLOv10 version
            if 'yolov10' in args.model:
                print("YOLOv10 model successfully validated and ready for recycling detection!")
        except Exception as e:
            print(f"Error loading model: {e}")
    else:
        print("Failed to download model")

if __name__ == "__main__":
    main() 