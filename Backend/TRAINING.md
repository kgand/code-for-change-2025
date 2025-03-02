# Training YOLOv10 Models for Recycling Detection

This guide explains how to train, validate, and deploy custom YOLOv10 models for recycling detection using the provided dataset.

## Dataset Structure

The training dataset is organized in the standard YOLO format:

```
DATASET/
├── data.yaml        # Dataset configuration
├── train/           # Training images and labels
│   ├── images/      # Training images
│   └── labels/      # Training annotations in YOLO format
├── valid/           # Validation images and labels
│   ├── images/      # Validation images
│   └── labels/      # Validation annotations in YOLO format
└── test/            # Test images for inference
    └── images/      # Test images
```

The `data.yaml` file defines the dataset configuration and class names:

```yaml
train: ../train/images
val: ../valid/images

nc: 7
names: ['cam', 'diger', 'kagit', 'karton', 'kopuk', 'metal', 'plastik']
```

These class names correspond to:
- 'cam': Glass
- 'diger': Other
- 'kagit': Paper
- 'karton': Cardboard
- 'kopuk': Foam
- 'metal': Metal
- 'plastik': Plastic

## Training a Custom Model

### Prerequisites

- Python 3.8 or higher
- Required packages installed: `pip install -r requirements.txt`

### Train the Model

Use the provided training script to train a custom YOLOv10 model:

```bash
python train_model.py
```

The script supports various command-line arguments to customize the training process:

```bash
# Train with custom parameters
python train_model.py --model yolov10s.pt --epochs 50 --batch 16 --imgsz 640 --name custom_run
```

Key parameters:
- `--model`: Base model to start training from (default: yolov10n.pt)
- `--epochs`: Number of training epochs (default: 100)
- `--batch`: Batch size (default: 16, reduce for lower memory)
- `--imgsz`: Image size for training (default: 640)
- `--name`: Name for training run (default: recycling_model)
- `--device`: Device to train on (default: auto-selects GPU if available, otherwise CPU)

The training process includes:
1. Loading the base model (YOLOv10n by default)
2. Training on the provided dataset
3. Saving checkpoints during training
4. Copying the best model to the `models/recyclables.pt` file

### Training Tips

1. **Hardware Requirements:**
   - For faster training, a GPU is highly recommended
   - For CPU-only training, reduce batch size and image size

2. **Training Time:**
   - YOLOv10n: ~2-8 hours (CPU), ~30-60 minutes (GPU)
   - Larger models (s/m/l/x) will take proportionally longer

3. **Memory Issues:**
   If you encounter memory errors, try:
   ```bash
   python train_model.py --batch 4 --imgsz 480
   ```

4. **Monitor Training:**
   Training progress can be monitored in real-time with metrics like loss and mAP

## Validating the Model

After training, validate the model's performance:

```bash
python validate_model.py
```

The validation script:
1. Evaluates the model on the validation set
2. Reports metrics like mAP@0.5, precision, and recall
3. Runs inference on test images and measures performance

You can also visualize the results on test images:

```bash
python validate_model.py --show
```

## Using the Trained Model

Once trained, your custom model will be saved to `models/recyclables.pt`. The recycling detection server will use this model automatically if it exists.

To use the model:

1. Start the detection server:
   ```bash
   python recycling_detection_server.py
   ```

2. The server will automatically load your custom model and use it for detection

## Performance Comparison

Based on tests with similar recycling datasets:

| Model      | mAP@0.5 | Inference (ms) | Size (MB) | Description                           |
|------------|---------|----------------|-----------|---------------------------------------|
| YOLOv10n   | ~87-90% | 5-10ms         | ~6        | Nano model, fastest but less accurate |
| YOLOv10s   | ~90-93% | 7-15ms         | ~12       | Small model, good balance             |
| YOLOv10m   | ~92-95% | 12-25ms        | ~27       | Medium model, high accuracy           |
| YOLOv10l/x | ~94-97% | 20-40ms        | ~45-67    | Large models, highest accuracy        |

## Troubleshooting

- **CUDA Out of Memory**: Reduce batch size and/or image size
- **Training Not Improving**: Try a different base model or adjust learning rate
- **Poor Detection Results**: Ensure training dataset has enough diverse examples
- **File Not Found Errors**: Check path to data.yaml and other files
- **Model Loading Errors**: Ensure you're using the correct Ultralytics version (8.2.0+)

## Custom Dataset

If you want to train on your own dataset:

1. Organize it in the same structure as the provided DATASET
2. Update the data.yaml file with your class names
3. Follow the same training process

## Advanced Training Options

For more advanced training options, you can directly use the Ultralytics CLI:

```bash
# Train with YOLOv10n
yolo train data=DATASET/data.yaml model=yolov10n.pt epochs=100

# Export model for different platforms
yolo export model=path/to/best.pt format=onnx
``` 