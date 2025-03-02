#!/usr/bin/env python3
"""
Simplified script to train YOLOv10 models using the Ultralytics CLI.
This is a more direct approach that leverages the Ultralytics command line interface.
"""

import os
import argparse
import subprocess
from pathlib import Path

def main():
    """
    Main function to parse arguments and run the Ultralytics CLI commands
    """
    parser = argparse.ArgumentParser(description="Train YOLOv10 model on recycling dataset using Ultralytics CLI")
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
    parser.add_argument("--patience", type=int, default=50,
                      help="Early stopping patience (default: 50)")
    args = parser.parse_args()
    
    # Check if data file exists
    data_path = Path(args.data)
    if not data_path.exists():
        print(f"Error: Dataset config file {args.data} not found")
        return
    
    # Create command with all arguments
    cmd = ["yolo", "train"]
    cmd.extend(["data=" + str(data_path.absolute())])
    cmd.extend(["model=" + args.model])
    cmd.extend(["epochs=" + str(args.epochs)])
    cmd.extend(["imgsz=" + str(args.imgsz)])
    cmd.extend(["batch=" + str(args.batch)])
    cmd.extend(["name=" + args.name])
    cmd.extend(["patience=" + str(args.patience)])
    
    if args.device:
        cmd.extend(["device=" + args.device])
    
    # Print command being executed
    print(f"\n{'='*50}")
    print(f"Executing command: {' '.join(cmd)}")
    print(f"{'='*50}\n")
    
    # Run the command
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
        
        # Print output in real-time
        for line in process.stdout:
            print(line, end='')
        
        # Wait for process to complete
        process.wait()
        
        if process.returncode == 0:
            print("\nTraining completed successfully!")
            
            # Copy the best model to models directory
            model_dir = Path("models")
            model_dir.mkdir(exist_ok=True)
            best_model_path = Path(f"runs/train/{args.name}/weights/best.pt")
            
            if best_model_path.exists():
                target_path = model_dir / "recyclables.pt"
                import shutil
                print(f"Copying best model to {target_path}")
                shutil.copy(best_model_path, target_path)
                print(f"Model successfully saved to {target_path}")
                
                # Run validation
                print("\nValidating the trained model...")
                val_cmd = ["yolo", "val", "model=" + str(target_path), "data=" + str(data_path.absolute())]
                subprocess.run(val_cmd)
            else:
                print(f"Warning: Best model file not found at {best_model_path}")
        else:
            print(f"\nTraining failed with return code {process.returncode}")
    except Exception as e:
        print(f"Error during training: {e}")

if __name__ == "__main__":
    main() 