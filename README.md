# Subwaste Surfer - Wall-E Edition

A Subway Surfers-inspired endless runner game with an environmental twist, created for the Code for Change 2025 Hackathon in the Environment track.

## Game Concept

In Subwaste Surfer, you play as Wall-E, the waste-collecting robot, navigating through lanes of trash and obstacles. Your mission is to collect and sort different types of waste (plastic, paper, metal) while avoiding obstacles that block your path.

## Features

- Endless runner gameplay with increasing difficulty
- Three-lane system for navigation
- Multiple types of collectible waste items with different point values
- Combo system for collecting waste items in quick succession
- Difficulty selector (Easy, Medium, Hard) with adjustable game parameters
- Educational environmental facts that change based on collected waste types
- Pause functionality with keyboard shortcuts
- Score tracking based on distance and waste collected
- Simple and intuitive controls
- Responsive design that works on various screen sizes

## How to Play

1. Select your preferred difficulty level
2. Click the "Start Game" button to begin
3. Use the left and right arrow keys to switch lanes
4. Use the up arrow key or spacebar to jump over obstacles
5. Collect waste items to increase your score
6. Collect items quickly to build combos and multiply your score
7. Press P or Escape to pause the game
8. Avoid obstacles to stay in the game
9. Try to achieve the highest score possible!

## Controls

- **Left Arrow**: Move left
- **Right Arrow**: Move right
- **Up Arrow / Spacebar**: Jump
- **P / Escape**: Pause game

## Technical Details

- Built with vanilla JavaScript, HTML5, and CSS3
- Uses HTML5 Canvas for rendering the game
- No external libraries or frameworks required
- Responsive design that adapts to different screen sizes

## Project Structure

```
subwaste-surfer/
├── index.html                      # Main HTML file
├── solution/                       # Game code
│   ├── js/                         # JavaScript files
│   │   ├── game.js                 # Main game logic
│   │   └── environmental-facts.js  # Environmental facts data
│   └── css/                        # CSS files
│       └── style.css               # Game styling
└── assets/                         # Game assets
    ├── images/                     # Image files
    ├── sounds/                     # Sound files
    └── models/                     # 3D models (future feature)
```

## Development Approach

This project was developed using a feature-branch Git workflow:

1. Each feature was developed in its own branch
2. Professional commit messages were used following conventional commit format
3. Features were merged into main using non-fast-forward merges
4. Code was organized in a modular, maintainable structure

## Future Enhancements

- Add more detailed Wall-E character graphics
- Implement different types of obstacles
- Add power-ups and special abilities
- Include a waste sorting mini-game
- Add sound effects and background music
- Implement a high score leaderboard
- Add mobile touch controls

## Credits

Created for the Code for Change 2025 Hackathon in the Environment track.

## License

MIT License 