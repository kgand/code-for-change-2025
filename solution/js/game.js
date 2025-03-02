// Subwaste Surfer - Main Game Logic

// Game elements
const gameStartScreen = document.getElementById('game-start');
const gamePlayScreen = document.getElementById('game-play');
const gamePausedScreen = document.getElementById('game-paused');
const gameOverScreen = document.getElementById('game-over');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const resumeButton = document.getElementById('resume-button');
const restartButton = document.getElementById('restart-button');
const restartFromPauseButton = document.getElementById('restart-from-pause-button');
const scoreElement = document.getElementById('score');
const wasteCollectedElement = document.getElementById('waste-collected');
const finalScoreElement = document.getElementById('final-score');
const finalWasteElement = document.getElementById('final-waste');
const startScreenFactElement = document.getElementById('start-screen-fact');
const pauseScreenFactElement = document.getElementById('pause-screen-fact');
const gameOverFactElement = document.getElementById('game-over-fact');
const difficultyButtons = document.querySelectorAll('.difficulty-button');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Sound controls
const muteButton = document.getElementById('mute-button') || document.createElement('button');
const musicButton = document.getElementById('music-button') || document.createElement('button');
const soundEffectsButton = document.getElementById('sound-effects-button') || document.createElement('button');

// Game state
let gameActive = false;
let gamePaused = false;
let score = 0;
let wasteCollected = 0;
let comboCount = 0;
let comboTimer = 0;
let comboMultiplier = 1;
let animationFrameId;
let lastTime = 0;
let animationTime = 0;
let lastCollectTime = 0;
let lastCollectedWasteType = null;
let currentDifficulty = 'easy'; // Default difficulty
let touchControls = null; // Will hold TouchControls instance
let wasteSortingGame = null; // Will hold WasteSortingGame instance
let wasteSortingThreshold = 10; // Trigger mini-game after collecting this many waste items
let wasteSortingEnabled = true; // Flag to enable/disable mini-game
let inMiniGame = false; // Flag to track if mini-game is active
let lastObstacleTime = 0; // Last time an obstacle was generated
let lastCollectibleTime = 0; // Last time a collectible was generated

// Difficulty settings
const difficultySettings = {
    easy: {
        gameSpeed: 5,
        obstacleFrequency: 0.02,
        collectibleFrequency: 0.015,
        difficultyIncreaseRate: 0.3
    },
    medium: {
        gameSpeed: 7,
        obstacleFrequency: 0.03,
        collectibleFrequency: 0.012,
        difficultyIncreaseRate: 0.5
    },
    hard: {
        gameSpeed: 9,
        obstacleFrequency: 0.04,
        collectibleFrequency: 0.01,
        difficultyIncreaseRate: 0.7
    }
};

// Game settings
const settings = {
    gameSpeed: 5, // Will be set based on difficulty
    gravity: 0.5,
    jumpForce: -10,
    laneWidth: 200,
    lanes: 3,
    obstacleFrequency: 0.02, // Will be set based on difficulty
    collectibleFrequency: 0.01, // Will be set based on difficulty
    difficultyIncreaseInterval: 10000, // Increase difficulty every 10 seconds
    lastDifficultyIncrease: 0,
    difficultyIncreaseRate: 0.3, // Will be set based on difficulty
    comboTimeWindow: 2000, // Time window in ms for combo
    maxComboMultiplier: 5
};

// Waste type point values
const wastePoints = {
    plastic: 10,  // Type 0
    paper: 15,    // Type 1
    metal: 25     // Type 2
};

// Waste type categories for facts
const wasteCategories = ["plastic", "paper", "metal"];

// Game objects
let player;
let obstacles = [];
let collectibles = [];
let scorePopups = [];

// Set difficulty
function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    
    // Update settings based on difficulty
    settings.gameSpeed = difficultySettings[difficulty].gameSpeed;
    settings.obstacleFrequency = difficultySettings[difficulty].obstacleFrequency;
    settings.collectibleFrequency = difficultySettings[difficulty].collectibleFrequency;
    settings.difficultyIncreaseRate = difficultySettings[difficulty].difficultyIncreaseRate;
    
    // Update UI
    difficultyButtons.forEach(button => {
        button.classList.remove('selected');
        if (button.dataset.difficulty === difficulty) {
            button.classList.add('selected');
        }
    });
}

// Initialize the game
function init() {
    // Set canvas dimensions
    canvas.width = gamePlayScreen.offsetWidth;
    canvas.height = gamePlayScreen.offsetHeight;
    
    // Reset game state
    score = 0;
    wasteCollected = 0;
    comboCount = 0;
    comboTimer = 0;
    comboMultiplier = 1;
    obstacles = [];
    collectibles = [];
    scorePopups = [];
    animationTime = 0;
    lastCollectTime = 0;
    lastCollectedWasteType = null;
    
    // Reset mini-game state
    wasteSortingEnabled = true;
    inMiniGame = false;
    
    // Apply difficulty settings
    settings.gameSpeed = difficultySettings[currentDifficulty].gameSpeed;
    settings.obstacleFrequency = difficultySettings[currentDifficulty].obstacleFrequency;
    settings.collectibleFrequency = difficultySettings[currentDifficulty].collectibleFrequency;
    settings.lastDifficultyIncrease = 0;
    
    // Create player
    player = {
        x: canvas.width / 2,
        y: canvas.height - 100,
        width: 50,
        height: 70,
        velocityY: 0,
        lane: 1, // Middle lane
        isJumping: false,
        animationState: 0, // For simple animation
        eyeHeight: -20 // For eye animation
    };
    
    // Update UI
    updateScore();
    updateWasteCollected();
    
    // Set up event listeners
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', pauseGame);
    resumeButton.addEventListener('click', resumeGame);
    restartButton.addEventListener('click', startGame);
    restartFromPauseButton.addEventListener('click', startGame);
    
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Reset previously selected button
            difficultyButtons.forEach(btn => btn.classList.remove('selected'));
            // Set selected class on clicked button
            button.classList.add('selected');
            // Update current difficulty
            currentDifficulty = button.dataset.difficulty;
        });
    });
    
    // Check if we're on a touch device
    if (typeof TouchControls !== 'undefined' && TouchControls.isTouchDevice()) {
        console.log('Touch device detected - enabling touch controls');
        document.body.classList.add('touch-device');
    }
    
    // Initialize waste sorting game if available
    if (typeof WasteSortingGame !== 'undefined') {
        wasteSortingGame = new WasteSortingGame({
            addScore: (bonus) => {
                score += bonus;
                updateScore();
            },
            resumeAfterMiniGame: () => {
                inMiniGame = false;
                resumeGame();
            }
        });
    }
    
    // Initialize sound manager if available
    if (typeof soundManager !== 'undefined') {
        soundManager.preloadSounds().then(() => {
            console.log('All sounds loaded successfully');
        }).catch(error => {
            console.warn('Error loading sounds:', error);
        });
    }
    
    // Display random environmental facts
    displayEnvironmentalFacts();
}

// Display environmental facts
function displayEnvironmentalFacts() {
    // Display a random fact on the start screen
    startScreenFactElement.textContent = getRandomFact();
    
    // The pause and game over facts will be set when those screens are shown
}

// Start the game
function startGame() {
    gameStartScreen.classList.add('hidden');
    gamePlayScreen.classList.remove('hidden');
    gamePausedScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    init();
    gameActive = true;
    gamePaused = false;
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
    
    // Start background music
    if (typeof soundManager !== 'undefined') {
        soundManager.startBackgroundMusic();
    }
    
    // Initialize touch controls if available
    if (typeof TouchControls !== 'undefined') {
        touchControls = new TouchControls({
            isRunning: () => gameActive && !gamePaused,
            movePlayer: (direction) => movePlayer(direction),
            jump: () => playerJump(),
            togglePause: () => {
                if (gameActive && !gamePaused) {
                    pauseGame();
                } else if (gameActive && gamePaused) {
                    resumeGame();
                }
            }
        });
        console.log('Touch controls initialized');
    }
}

// Pause the game
function pauseGame() {
    if (!gameActive || gamePaused) return;
    
    gamePaused = true;
    cancelAnimationFrame(animationFrameId);
    
    // Only show pause screen if not in mini-game
    if (!inMiniGame) {
        // Display a fact related to the last collected waste type, or a general fact
        const factCategory = lastCollectedWasteType ? wasteCategories[lastCollectedWasteType] : null;
        pauseScreenFactElement.textContent = getRandomFact(factCategory);
        
        gamePlayScreen.classList.add('hidden');
        gamePausedScreen.classList.remove('hidden');
    }
    
    // Pause background music
    if (typeof soundManager !== 'undefined') {
        soundManager.pauseBackgroundMusic();
    }
}

// Resume the game
function resumeGame() {
    if (!gameActive || !gamePaused) return;
    
    // Don't resume if in mini-game
    if (inMiniGame) return;
    
    gamePaused = false;
    gamePlayScreen.classList.remove('hidden');
    gamePausedScreen.classList.add('hidden');
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
    
    // Resume background music
    if (typeof soundManager !== 'undefined') {
        soundManager.resumeBackgroundMusic();
    }
}

// Game loop
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Update animation time
    animationTime += deltaTime;
    
    // Update combo timer
    if (comboCount > 0) {
        comboTimer -= deltaTime;
        if (comboTimer <= 0) {
            comboCount = 0;
            comboMultiplier = 1;
        }
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game state
    updateGame(deltaTime);
    
    // Draw game objects
    drawGame();
    
    // Continue the loop if game is active
    if (gameActive && !gamePaused) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// Update game state
function updateGame(deltaTime) {
    // Update player
    updatePlayer(deltaTime);
    
    // Generate obstacles and collectibles with throttling
    const currentTime = performance.now();
    
    if (currentTime - lastObstacleTime > 1000 / settings.obstacleFrequency / 50) {
        if (Math.random() < settings.obstacleFrequency) {
            generateObstacle();
        }
        lastObstacleTime = currentTime;
    }
    
    if (currentTime - lastCollectibleTime > 1000 / settings.collectibleFrequency / 50) {
        if (Math.random() < settings.collectibleFrequency) {
            generateCollectible();
        }
        lastCollectibleTime = currentTime;
    }
    
    // Update obstacles
    updateObstacles(deltaTime);
    
    // Update collectibles
    updateCollectibles(deltaTime);
    
    // Update score popups
    updateScorePopups(deltaTime);
    
    // Check collisions
    checkCollisions();
    
    // Update score (base score from distance)
    score += Math.floor(deltaTime * 0.01);
    updateScore();
    
    // Increase difficulty over time
    if (animationTime - settings.lastDifficultyIncrease > settings.difficultyIncreaseInterval) {
        settings.gameSpeed += settings.difficultyIncreaseRate;
        settings.obstacleFrequency += 0.002 * settings.difficultyIncreaseRate;
        settings.collectibleFrequency += 0.001 * settings.difficultyIncreaseRate;
        settings.lastDifficultyIncrease = animationTime;
    }
}

// Update player position
function updatePlayer(deltaTime) {
    // Apply gravity
    player.velocityY += settings.gravity;
    player.y += player.velocityY;
    
    // Check if player is on the ground
    if (player.y >= canvas.height - 100) {
        player.y = canvas.height - 100;
        player.velocityY = 0;
        player.isJumping = false;
    }
    
    // Update player x position based on lane
    const targetX = (player.lane * settings.laneWidth) - (settings.laneWidth / 2);
    player.x += (targetX - player.x) * 0.1 * deltaTime * 0.1;
    
    // Update animation state
    player.animationState = Math.floor(animationTime / 200) % 4;
    
    // Animate eyes (simple up and down movement)
    player.eyeHeight = -20 + Math.sin(animationTime / 300) * 3;
}

// Generate obstacle (renamed from generateObstacles)
function generateObstacle() {
    const lane = Math.floor(Math.random() * settings.lanes);
    
    obstacles.push({
        x: (lane * settings.laneWidth) - (settings.laneWidth / 2),
        y: -50,
        width: 50,
        height: 50,
        lane: lane,
        type: Math.floor(Math.random() * 3) // Different obstacle types
    });
}

// Generate collectible (renamed from generateCollectibles)
function generateCollectible() {
    const lane = Math.floor(Math.random() * settings.lanes);
    
    collectibles.push({
        x: (lane * settings.laneWidth) - (settings.laneWidth / 2),
        y: -30,
        width: 30,
        height: 30,
        lane: lane,
        type: Math.floor(Math.random() * 3), // 0: plastic, 1: paper, 2: metal
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.2
    });
}

// Update obstacles
function updateObstacles(deltaTime) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].y += settings.gameSpeed * deltaTime * 0.1;
        
        // Remove obstacles that are off-screen
        if (obstacles[i].y > canvas.height) {
            obstacles.splice(i, 1);
        }
    }
}

// Update collectibles
function updateCollectibles(deltaTime) {
    for (let i = collectibles.length - 1; i >= 0; i--) {
        collectibles[i].y += settings.gameSpeed * deltaTime * 0.1;
        
        // Rotate collectibles for visual interest
        collectibles[i].rotation += collectibles[i].rotationSpeed;
        
        // Remove collectibles that are off-screen
        if (collectibles[i].y > canvas.height) {
            collectibles.splice(i, 1);
        }
    }
}

// Update score popups
function updateScorePopups(deltaTime) {
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        scorePopups[i].y -= 1; // Move up
        scorePopups[i].opacity -= 0.01; // Fade out
        
        // Remove popups that are no longer visible
        if (scorePopups[i].opacity <= 0) {
            scorePopups.splice(i, 1);
        }
    }
}

// Check collisions
function checkCollisions() {
    // Check for collisions with obstacles
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        
        // Simple collision detection
        if (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
        ) {
            // Play crash sound
            if (typeof soundManager !== 'undefined') {
                soundManager.play('crash');
            }
            
            // End the game
            gameOver();
            return;
        }
    }
    
    // Check for collisions with collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const collectible = collectibles[i];
        
        // Simple collision detection
        if (
            player.x < collectible.x + collectible.width &&
            player.x + player.width > collectible.x &&
            player.y < collectible.y + collectible.height &&
            player.y + player.height > collectible.y
        ) {
            collectWaste(i);
        }
    }
}

// Draw game objects
function drawGame() {
    // Draw lanes
    drawLanes();
    
    // Draw player
    drawPlayer();
    
    // Draw obstacles
    drawObstacles();
    
    // Draw collectibles
    drawCollectibles();
    
    // Draw score popups
    drawScorePopups();
    
    // Draw combo indicator if active
    if (comboCount > 0 && comboMultiplier > 1) {
        drawComboIndicator();
    }
}

// Draw lanes
function drawLanes() {
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    for (let i = 1; i < settings.lanes; i++) {
        ctx.beginPath();
        ctx.setLineDash([20, 15]);
        ctx.moveTo(i * settings.laneWidth, 0);
        ctx.lineTo(i * settings.laneWidth, canvas.height);
        ctx.stroke();
    }
}

// Draw player
function drawPlayer() {
    // Draw Wall-E body
    ctx.fillStyle = '#f9c74f'; // Yellow-orange for Wall-E
    ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    
    // Draw treads/wheels
    ctx.fillStyle = '#4d4d4d';
    ctx.fillRect(player.x - player.width / 2 - 5, player.y + 15, player.width + 10, 20);
    
    // Draw eyes (simple Wall-E style with animation)
    ctx.fillStyle = '#ffffff';
    
    // Left eye
    ctx.beginPath();
    ctx.arc(player.x - 10, player.y + player.eyeHeight, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Right eye
    ctx.beginPath();
    ctx.arc(player.x + 10, player.y + player.eyeHeight, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye pupils
    ctx.fillStyle = '#000000';
    
    // Animate pupils based on animation state
    let pupilOffsetX = 0;
    if (player.animationState === 1) pupilOffsetX = 2;
    else if (player.animationState === 3) pupilOffsetX = -2;
    
    // Left pupil
    ctx.beginPath();
    ctx.arc(player.x - 10 + pupilOffsetX, player.y + player.eyeHeight, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Right pupil
    ctx.beginPath();
    ctx.arc(player.x + 10 + pupilOffsetX, player.y + player.eyeHeight, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw arms if not jumping
    if (!player.isJumping) {
        // Left arm with animation
        ctx.fillStyle = '#f9c74f';
        ctx.save();
        ctx.translate(player.x - player.width / 2 - 10, player.y - 10);
        ctx.rotate(Math.sin(animationTime / 200) * 0.2);
        ctx.fillRect(0, 0, 10, 30);
        ctx.restore();
        
        // Right arm with animation
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y - 10);
        ctx.rotate(-Math.sin(animationTime / 200) * 0.2);
        ctx.fillRect(0, 0, 10, 30);
        ctx.restore();
    } else {
        // Arms up when jumping
        ctx.fillStyle = '#f9c74f';
        ctx.save();
        ctx.translate(player.x - player.width / 2 - 10, player.y - 10);
        ctx.rotate(-Math.PI / 4);
        ctx.fillRect(0, 0, 10, 30);
        ctx.restore();
        
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y - 10);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(0, 0, 10, 30);
        ctx.restore();
    }
}

// Draw obstacles
function drawObstacles() {
    for (const obstacle of obstacles) {
        // Different colors for different obstacle types
        switch (obstacle.type) {
            case 0: // Trash pile
                ctx.fillStyle = '#6a994e';
                ctx.fillRect(obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height);
                
                // Add some detail
                ctx.fillStyle = '#386641';
                ctx.fillRect(obstacle.x - obstacle.width / 4, obstacle.y - obstacle.height / 4, obstacle.width / 2, obstacle.height / 2);
                break;
                
            case 1: // Broken electronics
                ctx.fillStyle = '#bc4749';
                ctx.fillRect(obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height);
                
                // Add some detail
                ctx.fillStyle = '#a7c957';
                ctx.fillRect(obstacle.x - obstacle.width / 3, obstacle.y - obstacle.height / 3, obstacle.width / 6, obstacle.height / 6);
                ctx.fillRect(obstacle.x + obstacle.width / 6, obstacle.y + obstacle.height / 6, obstacle.width / 6, obstacle.height / 6);
                break;
                
            case 2: // Oil spill
                ctx.fillStyle = '#2b2d42';
                ctx.beginPath();
                ctx.ellipse(obstacle.x, obstacle.y, obstacle.width / 2, obstacle.height / 4, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Add some detail
                ctx.fillStyle = '#5c677d';
                ctx.beginPath();
                ctx.ellipse(obstacle.x, obstacle.y, obstacle.width / 3, obstacle.height / 6, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }
}

// Draw collectibles
function drawCollectibles() {
    for (const collectible of collectibles) {
        ctx.save();
        ctx.translate(collectible.x, collectible.y);
        ctx.rotate(collectible.rotation);
        
        // Different colors and shapes for different waste types
        switch (collectible.type) {
            case 0: // Plastic
                ctx.fillStyle = '#90e0ef';
                ctx.beginPath();
                ctx.moveTo(0, -collectible.height / 2);
                ctx.lineTo(collectible.width / 2, collectible.height / 2);
                ctx.lineTo(-collectible.width / 2, collectible.height / 2);
                ctx.closePath();
                ctx.fill();
                
                // Add recycling symbol
                ctx.strokeStyle = '#0077b6';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, collectible.width / 4, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 1: // Paper
                ctx.fillStyle = '#ffb703';
                ctx.fillRect(-collectible.width / 2, -collectible.height / 2, collectible.width, collectible.height);
                
                // Add lines to represent text
                ctx.strokeStyle = '#fb8500';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-collectible.width / 3, -collectible.height / 4);
                ctx.lineTo(collectible.width / 3, -collectible.height / 4);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(-collectible.width / 3, 0);
                ctx.lineTo(collectible.width / 3, 0);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(-collectible.width / 3, collectible.height / 4);
                ctx.lineTo(collectible.width / 3, collectible.height / 4);
                ctx.stroke();
                break;
                
            case 2: // Metal
                ctx.fillStyle = '#adb5bd';
                ctx.beginPath();
                ctx.arc(0, 0, collectible.width / 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Add shine effect
                ctx.fillStyle = '#dee2e6';
                ctx.beginPath();
                ctx.arc(-collectible.width / 6, -collectible.height / 6, collectible.width / 6, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
}

// Draw score popups
function drawScorePopups() {
    for (const popup of scorePopups) {
        ctx.save();
        ctx.globalAlpha = popup.opacity;
        
        // Draw score value
        ctx.font = '20px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`+${popup.value}`, popup.x, popup.y);
        
        // Draw combo multiplier if applicable
        if (popup.combo) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#f72585';
            ctx.fillText(`x${popup.combo} COMBO!`, popup.x, popup.y + 20);
        }
        
        ctx.restore();
    }
}

// Draw combo indicator
function drawComboIndicator() {
    const comboPercentage = comboTimer / settings.comboTimeWindow;
    
    // Draw combo text
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#f72585';
    ctx.textAlign = 'center';
    ctx.fillText(`COMBO x${comboMultiplier}`, canvas.width / 2, 50);
    
    // Draw combo timer bar
    const barWidth = 200;
    const barHeight = 10;
    const barX = (canvas.width - barWidth) / 2;
    const barY = 60;
    
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Progress
    ctx.fillStyle = '#f72585';
    ctx.fillRect(barX, barY, barWidth * comboPercentage, barHeight);
}

// Update score display
function updateScore() {
    scoreElement.textContent = `Score: ${score}`;
}

// Update waste collected display
function updateWasteCollected() {
    wasteCollectedElement.textContent = `Waste Collected: ${wasteCollected}`;
}

// Game over
function gameOver() {
    gameActive = false;
    gamePaused = false;
    cancelAnimationFrame(animationFrameId);
    
    finalScoreElement.textContent = `Score: ${score}`;
    finalWasteElement.textContent = `Waste Collected: ${wasteCollected}`;
    
    // Display a fact related to the last collected waste type, or a general fact
    const factCategory = lastCollectedWasteType ? wasteCategories[lastCollectedWasteType] : null;
    gameOverFactElement.textContent = getRandomFact(factCategory);
    
    gamePlayScreen.classList.add('hidden');
    gamePausedScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    
    // Play game over sound and stop background music
    if (typeof soundManager !== 'undefined') {
        soundManager.pauseBackgroundMusic();
        soundManager.play('gameOver');
    }
}

// Player jump function
function playerJump() {
    if (!player.isJumping) {
        player.velocityY = settings.jumpForce;
        player.isJumping = true;
        
        // Play jump sound
        if (typeof soundManager !== 'undefined') {
            soundManager.play('jump');
        }
    }
}

// Handle collectible collection
function collectWaste(collectibleIndex) {
    const collectible = collectibles[collectibleIndex];
    const wasteType = collectible.type;
    let pointValue = 0;
    
    // Determine point value based on waste type
    switch (wasteType) {
        case 0: // Plastic
            pointValue = wastePoints.plastic;
            break;
        case 1: // Paper
            pointValue = wastePoints.paper;
            break;
        case 2: // Metal
            pointValue = wastePoints.metal;
            break;
    }
    
    // Check for combo
    const currentTime = performance.now();
    if (currentTime - lastCollectTime < settings.comboTimeWindow) {
        comboCount++;
        comboMultiplier = Math.min(settings.maxComboMultiplier, comboCount);
    } else {
        comboCount = 1;
        comboMultiplier = 1;
    }
    
    // Apply combo multiplier
    pointValue *= comboMultiplier;
    
    // Update score and stats
    score += pointValue;
    wasteCollected++;
    lastCollectTime = currentTime;
    lastCollectedWasteType = wasteType;
    
    // Check if we should trigger the waste sorting mini-game
    if (wasteSortingEnabled && wasteSortingGame && !inMiniGame && 
        wasteCollected > 0 && wasteCollected % wasteSortingThreshold === 0) {
        triggerWasteSortingGame();
    }
    
    // Reset combo timer
    comboTimer = settings.comboTimeWindow;
    
    // Create score popup
    scorePopups.push({
        x: collectible.x,
        y: collectible.y,
        value: pointValue,
        opacity: 1,
        velocityY: -2,
        combo: comboMultiplier > 1 ? comboMultiplier : null
    });
    
    // Remove the collectible
    collectibles.splice(collectibleIndex, 1);
    
    // Update UI
    updateScore();
    updateWasteCollected();
    
    // Play collect sound
    if (typeof soundManager !== 'undefined') {
        soundManager.play('collect');
    }
}

// Trigger waste sorting mini-game
function triggerWasteSortingGame() {
    if (!wasteSortingGame || inMiniGame) return;
    
    // Pause the main game
    pauseGame();
    
    // Set mini-game flag
    inMiniGame = true;
    
    // Show a message to the player
    setTimeout(() => {
        alert("You've collected enough waste to trigger the sorting challenge! Sort the waste correctly to earn bonus points!");
        
        // Start the mini-game
        wasteSortingGame.startGame();
    }, 500);
}

// Event listeners
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', pauseGame);
resumeButton.addEventListener('click', resumeGame);
restartButton.addEventListener('click', startGame);
restartFromPauseButton.addEventListener('click', startGame);

// Sound control event listeners
if (muteButton.id === 'mute-button') {
    muteButton.addEventListener('click', () => {
        if (typeof soundManager !== 'undefined') {
            const isMuted = soundManager.toggleMute();
            muteButton.textContent = isMuted ? '🔇' : '🔊';
        }
    });
}

if (musicButton.id === 'music-button') {
    musicButton.addEventListener('click', () => {
        if (typeof soundManager !== 'undefined') {
            const isMusicEnabled = soundManager.toggleMusic();
            musicButton.textContent = isMusicEnabled ? 'Music Off' : 'Music On';
        }
    });
}

if (soundEffectsButton.id === 'sound-effects-button') {
    soundEffectsButton.addEventListener('click', () => {
        if (typeof soundManager !== 'undefined') {
            const areSoundEffectsEnabled = soundManager.toggleSoundEffects();
            soundEffectsButton.textContent = areSoundEffectsEnabled ? 'Sound Effects Off' : 'Sound Effects On';
        }
    });
}

// Keyboard controls
document.addEventListener('keydown', (event) => {
    if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
        if (gameActive && !gamePaused) {
            pauseGame();
        } else if (gameActive && gamePaused) {
            resumeGame();
        }
        return;
    }
    
    if (!gameActive || gamePaused) return;
    
    switch (event.key) {
        case 'ArrowLeft':
            movePlayer(-1);
            break;
        case 'ArrowRight':
            movePlayer(1);
            break;
        case 'ArrowUp':
        case ' ': // Space
            playerJump();
            break;
        case 'm': // Toggle mute
            if (typeof soundManager !== 'undefined') {
                const isMuted = soundManager.toggleMute();
                if (muteButton.id === 'mute-button') {
                    muteButton.textContent = isMuted ? '🔇' : '🔊';
                }
            }
            break;
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (gameActive) {
        canvas.width = gamePlayScreen.offsetWidth;
        canvas.height = gamePlayScreen.offsetHeight;
    }
});

// Initialize the game when the page loads
window.addEventListener('load', () => {
    // Show the start screen
    gameStartScreen.classList.remove('hidden');
    gamePlayScreen.classList.add('hidden');
    gamePausedScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Set default difficulty
    setDifficulty('easy');
    
    // Display environmental facts
    displayEnvironmentalFacts();
});

// Player movement function for consistent controls
function movePlayer(direction) {
    if (!gameActive || gamePaused) return;
    
    if (player.lane + direction >= 0 && player.lane + direction < settings.lanes) {
        player.lane += direction;
        
        // Play sound effect if available
        if (typeof soundManager !== 'undefined') {
            soundManager.play('move');
        }
    }
} 