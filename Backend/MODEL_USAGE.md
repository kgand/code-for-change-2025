# Material Classification with model.pkl

This document explains how to use the `model.pkl` machine learning model for classifying waste materials in the recycling detection server.

## Model Overview

The `model.pkl` file is a pre-trained machine learning model that classifies waste items into the following material categories:

1. **Paper** - Recyclable
2. **Plastic** - Recyclable
3. **Glass** - Recyclable
4. **Metal** - Recyclable
5. **Others** - Generally not recyclable

The model was trained on approximately 5000 images with roughly equal distribution across the 5 classes. The training data includes images from Google image search as well as real-life photographs.

## Using the Model

The recycling detection server is already configured to use the `model.pkl` file located in the `Backend/models/` directory. If the model file exists, it will be automatically loaded when the server starts.

### Deployment Instructions

1. Ensure the `model.pkl` file is located in the `Backend/models/` directory:
   ```
   Backend/models/model.pkl
   ```

2. Start the server:
   ```bash
   cd Backend
   python recycling_detection_server.py
   ```

3. The server will print a confirmation message if the model is loaded successfully:
   ```
   Found model file at Backend/models/model.pkl. Using this as the trained model.
   ```

## How the Model Works

When a client sends an image to the server:

1. The image is preprocessed:
   - Resized to 224×224 pixels (standard input size for image classification)
   - Pixel values are normalized to the range [0,1]
   - Reshaped to match the model's expected input format

2. The model predicts the material category of the item
   - If available, confidence scores are extracted from the model

3. The server determines if the material is recyclable based on its category:
   - Paper, Plastic, Glass, and Metal are marked as recyclable
   - Other materials are marked as non-recyclable

4. The detection results are returned to the client, including:
   - The predicted material class
   - Confidence score
   - Recyclability status

## Technical Details

### Model Input Requirements

- **Image Size**: 224×224 pixels
- **Image Format**: RGB
- **Preprocessing**: Normalization (pixel values divided by 255.0)
- **Input Shape**: The model expects flattened feature vectors by default

### Customization Options

If your model has different requirements, you may need to adjust the preprocessing in `recycling_detection_server.py`. Common adjustments include:

1. **Input Reshape Methods**:
   - For flattened inputs: `normalized_frame.reshape(1, -1)`
   - For channel-first format: `normalized_frame.transpose(2, 0, 1).reshape(1, 3, 224, 224)`
   - For channel-last format: `normalized_frame.reshape(1, 224, 224, 3)`

2. **Confidence Extraction**:
   - The code attempts to use `predict_proba()` if available
   - If your model provides confidence differently, modify the detection logic

## Troubleshooting

If you encounter issues with the model:

1. **Model Loading Failed**: 
   - Check that the model file exists in the correct location
   - Ensure the model was saved with a compatible version of pickle

2. **Prediction Errors**:
   - If you get dimension or shape errors, adjust the preprocessing steps
   - Verify that your model expects the format you're providing

3. **Poor Classification Results**:
   - Ensure good lighting when showing items to the camera
   - Hold items close enough and centered in the frame
   - Consider retraining the model with more diverse examples

## Performance Metrics

Based on the training dataset, the model achieves:
- Approximately 90% accuracy across the 5 material classes
- Best performance on distinct materials like metal and glass
- May have difficulty distinguishing between similar-looking plastics and papers

## Future Improvements

Potential enhancements for the material classification model:

1. Implement more sophisticated image preprocessing techniques
2. Add data augmentation during training for better generalization
3. Use transfer learning with modern architectures like EfficientNet or Vision Transformer
4. Expand the training dataset with more examples of edge cases 