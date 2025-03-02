#!/usr/bin/env python3
"""
Script to train a YOLOv10 model on the recycling dataset.
This script uses the Ultralytics YOLOv10 implementation to train a custom model
for recycling detection using the provided DATASET folder.
"""

import os
import argparse
from pathlib import Path
from ultralytics import YOLO

def main():
    """
    Main function to parse arguments and train the model
    """
    parser = argparse.ArgumentParser(description="Train YOLOv10 model on recycling dataset")
    parser.add_argument("--model", type=str, default="yolov10n.pt", 
                      help="Base model to use for training (default: yolov10n.pt)")
    parser.add_argument("--epochs", type=int, default=100,
                      help="Number of training epochs (default: 100)")
    parser.add_argument("--imgsz", type=int, default=640,
                      help="Image size for training (default: 640)")
    parser.add_argument("--batch", type=int, default=16,
                      help="Batch size for training (default: 16)")
    parser.add_argument("--data", type=str, default="DATASET/data.yaml",
                      help="Path to dataset yaml file (default: DATASET/data.yaml)")
    parser.add_argument("--name", type=str, default="recycling_model",
                      help="Name for the training run (default: recycling_model)")
    parser.add_argument("--device", type=str, default="",
                      help="Device to train on (default: auto-select)")
    args = parser.parse_args()
    
    # Check if data file exists
    data_path = Path(args.data)
    if not data_path.exists():
        print(f"Error: Dataset config file {args.data} not found")
        return
    
    # Check if base model can be loaded/downloaded
    try:
        print(f"Loading base model {args.model}...")
        model = YOLO(args.model)
    except Exception as e:
        print(f"Error loading model: {e}")
        return
    
    # Print training information
    print(f"\n{'='*50}")
    print(f"Starting YOLOv10 training with the following configuration:")
    print(f"- Base model:    {args.model}")
    print(f"- Dataset:       {data_path.absolute()}")
    print(f"- Epochs:        {args.epochs}")
    print(f"- Image size:    {args.imgsz}")
    print(f"- Batch size:    {args.batch}")
    print(f"- Run name:      {args.name}")
    print(f"- Device:        {args.device if args.device else 'auto'}")
    print(f"{'='*50}\n")
    
    # Start training
    try:
        results = model.train(
            data=str(data_path.absolute()),
            epochs=args.epochs,
            imgsz=args.imgsz,
            batch=args.batch,
            name=args.name,
            device=args.device if args.device else None,
            patience=50,  # Early stopping patience
            save=True,    # Save checkpoints
            verbose=True  # Print detailed info
        )
        
        # Save the best model to models directory
        model_dir = Path("models")
        model_dir.mkdir(exist_ok=True)
        best_model_path = Path(f"runs/train/{args.name}/weights/best.pt")
        
        if best_model_path.exists():
            target_path = model_dir / "recyclables.pt"
            print(f"Copying best model to {target_path}")
            import shutil
            shutil.copy(best_model_path, target_path)
            print(f"Model successfully saved to {target_path}")
        else:
            print(f"Warning: Best model file not found at {best_model_path}")
        
        # Validate the trained model
        print("\nValidating the trained model...")
        model.val()
        
        print("\nTraining completed successfully!")
        print(f"You can now use the trained model with recycling_detection_server.py")
    except Exception as e:
        print(f"Error during training: {e}")

if __name__ == "__main__":
    main() 