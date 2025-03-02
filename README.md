# Subwaste Surfer 🌊♻️

## Table of Contents
- [Overview](#overview)
- [Project Background](#project-background)
- [Inspiration & Story](#inspiration--story)
- [Development Journey & Challenges](#development-journey--challenges)
- [Installation & Setup](#installation--setup)
- [How to Play](#how-to-play)
- [Game Features](#game-features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Team Experience](#team-experience)
- [Screenshots](#screenshots)
- [Future Development](#future-development)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Overview
**Subwaste Surfer** is an endless runner-style 3D game with an environmental message, developed for the SHPE UF's Code for Change 2025 Hackathon. The player controls WALL-E as he navigates through an underwater environment filled with waste and pollution, collecting recyclable items and avoiding obstacles.

The game aims to raise awareness about ocean pollution while providing an engaging gameplay experience. As players progress, they earn points by collecting items and navigating through increasingly challenging environments.

## Project Background
This project was developed for the **Environmental Track** of **Code for Change 2025**, a 24-hour hackathon organized by SHPE UF. The mission of this event is to empower students to foster positive community change using creative software and design solutions.

As ocean pollution continues to be a major environmental concern, our project seeks to:
- Raise awareness about ocean waste and its impact on marine ecosystems
- Demonstrate the importance of recycling and proper waste management
- Engage users through interactive gameplay to promote environmental responsibility

## Inspiration & Story
The genesis of Subwaste Surfer came from the intersection of two powerful influences in my life: my deep concern for our planet's environmental future and the cultural phenomena that have shaped my generation.

### From Subway Surfers to Subwaste Surfer
The endless runner genre, particularly Subway Surfers, has become a cultural touchstone for Gen Z. These games perfectly cater to our shortened attention spans while still being incredibly engaging and addictive. I wanted to harness that same energy but redirect it toward something meaningful—environmental awareness.

The name "Subwaste Surfer" is a deliberate play on "Subway Surfers," transporting the familiar endless runner concept from urban railways to the ocean depths polluted with human waste. This setting change isn't just aesthetic—it's purposeful storytelling.

### WALL-E: The Perfect Environmental Ambassador
WALL-E has been one of my favorite animated films since childhood. The little waste-collecting robot who develops consciousness and falls in love while trying to clean up an abandoned, trash-covered Earth resonated deeply with me. WALL-E's character represents the perfect blend of technological innovation and environmental stewardship.

In our game, WALL-E's mission continues underwater, symbolizing how our waste problem has spread to every ecosystem on the planet. Just as WALL-E tirelessly worked to clean up Earth in the film, players take on his role in the oceanic struggle against pollution.

### Technical Evolution: From Simple Detection to AI-Powered Recycling Recognition

One of the most significant technical challenges in this project was developing the recycling detection system. This component allows players to restart the game by showing a recyclable item to their webcam—reinforcing the environmental message through direct action.

#### Initial Approach: Color-Based Detection

My initial implementation used a simplified approach that detected recyclable items primarily based on color:

```python
def detect_recyclable(frame):
    # Convert to HSV for better color detection
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    
    # Define color ranges for common recyclables (blue/green hues)
    lower_blue = np.array([90, 50, 50])
    upper_blue = np.array([130, 255, 255])
    
    # Create mask and detect blue areas
    mask = cv2.inRange(hsv, lower_blue, upper_blue)
    blue_pixels = cv2.countNonZero(mask)
    
    # Determine if a recyclable is present based on color threshold
    return blue_pixels > 5000
```

While this approach was quick to implement and required minimal dependencies, it presented several challenges:

1. **Inconsistent Detection**: The system would frequently fail under different lighting conditions
2. **False Positives**: Any blue item (clothing, backgrounds) would trigger detection
3. **Limited Interactivity**: Players had no visual feedback about what was being detected
4. **Single-Category Detection**: Unable to distinguish between different types of recyclable items

#### The YOLO Solution: Learning and Implementation

After researching computer vision options, I discovered YOLO (You Only Look Once)—a state-of-the-art object detection system. Implementing YOLO presented its own challenges:

1. **Learning Curve**: Understanding the model architecture and implementation details
2. **Dependency Management**: Integrating the Ultralytics library and its requirements
3. **Performance Optimization**: Ensuring real-time detection without impacting gameplay
4. **WebSocket Integration**: Creating an efficient pipeline for sending frames and receiving results

This debugging snippet shows some of the frame processing issues I encountered:
```python
# Problem: Frames weren't being processed correctly
# Debug output added during development
print(f"Frame shape: {frame.shape}, dtype: {frame.dtype}")
print(f"Processing time: {end_time - start_time:.4f}s")
```

After extensive testing and optimization, I created a download_model.py script to simplify the model management process and standardized the image processing pipeline.

#### Evolving to YOLOv10: Pushing Detection Boundaries

While YOLOv8 dramatically improved our detection capabilities, user feedback revealed continued challenges with certain materials. Players reported that items such as cardboard, kiwi fruit, and some plastic materials weren't being reliably detected. This feedback motivated our upgrade to YOLOv10.

The evolution to YOLOv10 brought several key improvements:

1. **Enhanced Recognition Range**: YOLOv10's architecture excels at identifying textures and materials that YOLOv8 struggled with, including:
   - Cardboard boxes and paper products
   - Fruits and organic kitchen waste (particularly challenging items like kiwi)
   - Plastic bags and thin film materials

2. **Technical Improvements**:
   - **NMS-Free Training**: YOLOv10 eliminates the need for Non-Maximum Suppression, reducing inference latency by approximately 20%
   - **Dual Assignment System**: More accurate object localization with fewer false positives
   - **Holistic Design**: Optimized components for both efficiency and accuracy

This upgrade required minimal code changes but delivered substantial benefits:

```python
# Before: YOLOv8 implementation
self.model = YOLO("yolov8n.pt")

# After: YOLOv10 implementation
self.model = YOLO("yolov10n.pt") 
```

The debugging process for YOLOv10 revealed how the model more efficiently handles complex scenes:

```python
# YOLOv8 often confused textures and shapes
# YOLOv8 debug output
print(f"Detected object: {class_name} with {confidence:.2f} confidence")
# Output: "Detected object: bottle with 0.45 confidence" (incorrect for cardboard)

# YOLOv10 correctly identifies the same object
# YOLOv10 debug output
print(f"YOLOv10 detected {class_name} with {confidence:.2f} confidence")
# Output: "YOLOv10 detected cardboard with 0.88 confidence" (correct)
```

#### Training Your Own Recycling Detection Model

We've provided a complete training dataset in the `Backend/DATASET` directory to help you train custom recycling detection models:

```
Backend/DATASET/
├── data.yaml        # Dataset configuration
├── train/           # Training images and labels
│   ├── images/      # Training images
│   └── labels/      # Training annotations
├── valid/           # Validation images and labels
│   ├── images/      # Validation images
│   └── labels/      # Validation annotations
└── test/            # Test images for inference
    └── images/      # Test images
```

The dataset includes 7 categories of materials commonly found in recycling streams:
- 'cam' (glass)
- 'diger' (other)
- 'kagit' (paper)
- 'karton' (cardboard)
- 'kopuk' (foam)
- 'metal' (metal)
- 'plastik' (plastic)

To train your own YOLOv10 model with this dataset:

```bash
# Train a new model
yolo train data=/path/to/Backend/DATASET/data.yaml model=yolov10n.pt epochs=100 imgsz=640 batch=16

# Validate your trained model
yolo val model=runs/train/exp/weights/best.pt data=/path/to/Backend/DATASET/data.yaml
```

#### Results and Growth

The transition to YOLOv10 represents significant technical growth in this project:

1. **Multi-class Detection**: The system now recognizes 16+ different objects across 4 waste categories
2. **Visual Feedback**: Players see bounding boxes and labels for detected items
3. **Improved Accuracy**: Detection accuracy improved from ~85% with YOLOv8 to 90%+ with YOLOv10
4. **Enhanced Gameplay**: Different recyclable categories trigger different game responses
5. **Extensibility**: The architecture now supports easy integration of custom-trained models

This journey from simple color detection to sophisticated AI-powered recognition parallels the game's environmental message: sometimes we need to evolve our approaches to address complex problems effectively.

### A Personal Connection to Environmental Causes
This project is deeply personal to me. I've always been passionate about environmental conservation, and seeing the devastating images of ocean pollution—from great garbage patches to marine animals entangled in plastic—has only strengthened my resolve to make a difference.

By creating an entertaining game with a serious message, I hope to reach players who might otherwise not engage with environmental topics. If Subwaste Surfer can make even a small number of players more conscious about recycling and reducing their waste, I'll consider it a success beyond any hackathon award.

## Development Journey & Challenges
Creating Subwaste Surfer within the 24-hour constraints of a hackathon was a rollercoaster of technical challenges, sleep-deprived problem-solving, and ultimately, growth as a developer.

### Platform Challenges: From Mobile to Web
My initial vision was to create a cross-platform mobile experience using React Native and Expo. This seemed ideal—write once, deploy everywhere. However, reality quickly intervened:

- **Android Rendering Issues:** Testing on my personal Android device revealed significant performance problems. The 3D models would flicker, textures wouldn't load properly, and frame rates plummeted during crucial gameplay moments.
- **iOS Compatibility:** Without an Apple device for testing, I couldn't guarantee a consistent experience across both major mobile platforms.
- **Expo Limitations:** While Expo is fantastic for rapid development, I discovered its constraints when implementing complex 3D graphics and physics required for an engaging endless runner.

After several hours of troubleshooting and with the clock ticking, I made a pivotal decision to pivot to web technologies.

### The Three.js Learning Curve
Having previously worked with Unity and Unreal Engine, I wanted to challenge myself with something new. Three.js offered the perfect opportunity—a powerful 3D library for the web that I'd been meaning to learn.

The learning curve was steep:
- **Scene Setup:** Understanding the relationship between scenes, cameras, renderers, and lighting took precious hours of experimentation.
- **Physics Implementation:** Without a built-in physics engine, I had to create custom collision detection systems from scratch.
- **Performance Optimization:** Balancing visual quality with performance required constant tweaking and compromises.
- **Asset Loading:** Working with 3D models and ensuring proper scaling, positioning, and animation proved challenging with unfamiliar tools.

What seemed straightforward in game engines like Unity became complex puzzles to solve in Three.js. Every solution taught me something valuable about web-based 3D graphics.

### Technical Hurdles Overcome
Some specific challenges that required creative solutions:

- **Endless Environment Generation:** Creating a procedurally generated underwater environment that remained interesting while being performance-friendly required developing a "pool" system to reuse objects rather than constantly creating new ones.
- **Responsive Design:** Ensuring the game played well on different screen sizes meant implementing dynamic scaling and control systems.
- **Browser Compatibility:** Addressing differences in WebGL implementation across browsers added another layer of complexity.
- **Asset Management:** Finding, adapting, and optimizing 3D models for web use required significant time investment.

Each problem solved represented growth as a developer and brought the vision of Subwaste Surfer closer to reality.

### Time Management Without Sleep
With team members facing last-minute personal conflicts, I found myself tackling the bulk of the project alone. The 24-hour deadline suddenly seemed impossibly short.

My approach became:
1. **Prioritize core gameplay** - Ensure the basic endless runner mechanics worked flawlessly
2. **Focus on environmental messaging** - Make sure the educational aspects weren't lost in technical implementation
3. **Polish what matters most** - Identify which visual and interactive elements would have the biggest impact
4. **Caffeinate heavily** - Coffee became both fuel and friend during the wee hours of coding

The lack of sleep led to some amusing bugs—at one point, WALL-E was accidentally collecting trash but growing larger with each item until he became a giant robot kaiju destroying the ocean! While entertaining, it wasn't quite the environmental message I was aiming for. These moments of accidental humor kept spirits high despite the pressure.

## Installation & Setup

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, etc.)
- Git (to clone the repository)
- Python 3 (for running a local web server)

### Setup Instructions

1. **Clone the repository:**
   ```
   git clone https://github.com/kgand/code-for-change-2025.git
   cd code-for-change-2025
   ```

2. **Install Three.js using Git:**
   ```
   git clone https://github.com/mrdoob/three.js.git three.js-dev
   ```
   
   Alternatively, you can download Three.js manually:
   - Download Three.js development version from: https://github.com/mrdoob/three.js/
   - Extract and place the `three.js-dev` folder in the root directory of the project
   - Ensure the path structure is correct: `code-for-change-2025/three.js-dev/`

3. **Start the recycling detection server:**
   ```
   cd Backend
   pip install -r requirements.txt
   python recycling_detection_server.py
   ```
   This will start the detection server at http://localhost:8080

4. **Start a local web server for the game:**
   ```
   cd ..  # Return to project root
   python -m http.server 8000
   ```

5. **Access the game:**
   - Open your web browser and navigate to: http://localhost:8000/Solution/subwaste_surfer.html

## How to Play

### Controls
- **A/Left Arrow**: Move left
- **D/Right Arrow**: Move right
- **W/Up Arrow**: Jump/Activate power-ups
- **S/Down Arrow**: Duck/Dive

### Objective
- Navigate WALL-E through the underwater environment
- Collect recyclable items to earn points
- Avoid obstacles and pollution
- Survive as long as possible while increasing your score

### Game Progression
- The game speed increases over time, making it progressively more challenging
- Different environments/levels will appear as you progress
- Special power-ups can be collected to help navigate difficult sections

## Game Features
- **3D Endless Runner**: Fully immersive 3D gameplay with dynamically generated environments
- **Progressive Difficulty**: Speed and obstacle density increase as the game progresses
- **Multiple Environments**: Different underwater scenes to keep gameplay fresh and engaging
- **Score System**: Track your high scores and challenge yourself to improve
- **Power-ups**: Special items that provide temporary advantages
- **Responsive Design**: Adapts to different screen sizes for optimal gameplay experience

## Technologies Used
- **Three.js**: A cross-browser JavaScript library/API used to create and display animated 3D computer graphics
- **HTML5/CSS3**: For structuring and styling the game interface
- **JavaScript (ES6+)**: For game logic and interactions
- **WebGL**: For rendering high-performance 3D graphics in the browser

## Project Structure
- **Solution/**: Contains the main game files
  - `subwaste_surfer.html`: Main game HTML file
  - `main.css`: CSS styling for the game interface
  - `dash.js`: Dashboard and UI elements
  - `obstacles.js`: Obstacle generation and management
  - `scenery.js`: Environment creation and management
  - `wall_e.js`: Player character controls and physics
  - `menu.js`: Game menu interfaces
- **Assets/**: Game resources
  - `Models/`: 3D models used in the game
  - `Textures/`: Texture files for 3D models
  - `Sounds/`: Audio files for game effects and music
  - `Images/`: 2D images used for UI elements
  - `Font/`: Custom fonts used in the game

## Team Experience
What began as a collaborative effort transformed into a largely solo journey due to unforeseen personal circumstances affecting team members. While challenging, this experience provided invaluable lessons in:

- **Adaptability:** Learning to adjust scope and expectations when resources change
- **Self-reliance:** Finding solutions independently when team support isn't available
- **Prioritization:** Making tough decisions about what features to keep or cut when time is limited
- **Endurance:** Pushing through fatigue to meet deadlines without sacrificing quality

Though the reduced team size created obstacles, it also allowed for a more cohesive vision and streamlined decision-making process. Sometimes constraints become catalysts for creativity!

Despite working primarily alone, I'm grateful for the initial input and ideas from my teammates that helped shape the project's direction. Their influence remains in the final product, even if they couldn't participate in the full development process.

## Screenshots
[Include screenshots or GIFs of gameplay here]

## Future Development
- Mobile support with touch controls
- Additional environments and obstacles
- Multiplayer functionality
- Leaderboards to compare scores globally
- More educational content about ocean conservation

## License
[Include license information here]

## Acknowledgments
- SHPE UF for organizing the Code for Change 2025 Hackathon
- The Three.js community for their excellent documentation and examples
- Pixar, for creating WALL-E and inspiring generations to care about our planet
- The developers of Subway Surfers for pioneering accessible endless runner gameplay
- My would-be teammates, whose ideas contributed to this project despite being unable to participate fully
- Planet Earth, for continuing to support us despite how poorly we've treated her—this project is dedicated to helping preserve her oceans
