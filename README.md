# Subwaste Surfer 🌊♻️

## Table of Contents
- [Overview](#overview)
- [Project Background](#project-background)
- [Installation & Setup](#installation--setup)
- [How to Play](#how-to-play)
- [Game Features](#game-features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Team Contributions](#team-contributions)
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

2. **Download Three.js:**
   - Download Three.js development version from: https://github.com/mrdoob/three.js/
   - Extract and place the `three.js-dev` folder in the root directory of the project
   - Ensure the path structure is correct: `code-for-change-2025/three.js-dev/`

3. **Start a local web server:**
   ```
   python -m http.server 8000
   ```

4. **Access the game:**
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
  - `main.css`: CSS styling for the game
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

## Team Contributions
[List team members and their contributions here]

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
- [Any other acknowledgments]
