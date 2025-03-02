#!/usr/bin/env python3
"""
Script to validate the trained YOLOv10 model on the recycling dataset.
This script evaluates the model against the validation set and runs inference on test images.
"""

import os
import argparse
from pathlib import Path
from ultralytics import YOLO
import cv2
import numpy as np
import time
import matplotlib.pyplot as plt
from tqdm import tqdm

def main():
    """
    Main function to parse arguments and validate the model
    """
    parser = argparse.ArgumentParser(description="Validate trained YOLOv10 model on recycling dataset")
    parser.add_argument("--model", type=str, default="models/recyclables.pt", 
                      help="Path to trained model (default: models/recyclables.pt)")
    parser.add_argument("--data", type=str, default="DATASET/data.yaml",
                      help="Path to dataset yaml file (default: DATASET/data.yaml)")
    parser.add_argument("--imgsz", type=int, default=640,
                      help="Image size for validation (default: 640)")
    parser.add_argument("--conf", type=float, default=0.25,
                      help="Confidence threshold (default: 0.25)")
    parser.add_argument("--show", action="store_true",
                      help="Show detection results on test images")
    args = parser.parse_args()
    
    # Check if model exists
    model_path = Path(args.model)
    if not model_path.exists():
        print(f"Error: Model file {args.model} not found.")
        print("Check if training has completed and the model was saved correctly.")
        return
    
    # Check if data file exists
    data_path = Path(args.data)
    if not data_path.exists():
        print(f"Error: Dataset config file {args.data} not found")
        return
    
    # Load the model
    try:
        print(f"Loading model from {model_path}...")
        model = YOLO(model_path)
    except Exception as e:
        print(f"Error loading model: {e}")
        return
    
    # Print validation information
    print(f"\n{'='*50}")
    print(f"Starting validation with the following configuration:")
    print(f"- Model:         {model_path.absolute()}")
    print(f"- Dataset:       {data_path.absolute()}")
    print(f"- Image size:    {args.imgsz}")
    print(f"- Confidence:    {args.conf}")
    print(f"{'='*50}\n")
    
    # Run validation
    try:
        print("Running validation on the validation set...")
        val_results = model.val(data=str(data_path.absolute()), imgsz=args.imgsz, conf=args.conf)
        
        print("\nValidation Results:")
        print(f"- mAP@0.5:      {val_results.box.map50:.4f}")
        print(f"- mAP@0.5-0.95: {val_results.box.map:.4f}")
        print(f"- Precision:    {val_results.box.p:.4f}")
        print(f"- Recall:       {val_results.box.r:.4f}")
        
        # Run inference on some test images
        test_dir = Path("DATASET/test/images")
        if test_dir.exists() and any(test_dir.iterdir()):
            print("\nRunning inference on test images...")
            
            # Get list of test images
            test_images = list(test_dir.glob("*.jpg")) + list(test_dir.glob("*.png"))
            if not test_images:
                print("No test images found.")
            else:
                print(f"Found {len(test_images)} test images.")
                
                # Run inference on each test image
                inference_times = []
                for img_path in tqdm(test_images[:10], desc="Processing test images"):  # Process up to 10 test images
                    # Load image
                    img = cv2.imread(str(img_path))
                    if img is None:
                        print(f"Could not load image: {img_path}")
                        continue
                    
                    # Run inference with timing
                    start_time = time.time()
                    results = model.predict(img, conf=args.conf, imgsz=args.imgsz, verbose=False)
                    inference_time = time.time() - start_time
                    inference_times.append(inference_time)
                    
                    # Show results if requested
                    if args.show and results:
                        res_plotted = results[0].plot()
                        cv2.imshow(f"Detection Result: {img_path.name}", res_plotted)
                        cv2.waitKey(0)
                
                # Print inference performance
                if inference_times:
                    avg_time = sum(inference_times) / len(inference_times)
                    fps = 1 / avg_time
                    print(f"\nInference Performance:")
                    print(f"- Average inference time: {avg_time*1000:.2f} ms")
                    print(f"- Frames per second: {fps:.2f} FPS")
        
        print("\nValidation completed!")
    except Exception as e:
        print(f"Error during validation: {e}")
    
    # Close any open windows
    if args.show:
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main() 