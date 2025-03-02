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
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

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

// Game settings
const settings = {
    gameSpeed: 5,
    gravity: 0.5,
    jumpForce: -10,
    laneWidth: 200,
    lanes: 3,
    obstacleFrequency: 0.02, // Chance per frame
    collectibleFrequency: 0.01, // Chance per frame
    difficultyIncreaseInterval: 10000, // Increase difficulty every 10 seconds
    lastDifficultyIncrease: 0,
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
    settings.gameSpeed = 5;
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
}

// Pause the game
function pauseGame() {
    if (!gameActive || gamePaused) return;
    
    gamePaused = true;
    cancelAnimationFrame(animationFrameId);
    
    // Display a fact related to the last collected waste type, or a general fact
    const factCategory = lastCollectedWasteType ? wasteCategories[lastCollectedWasteType] : null;
    pauseScreenFactElement.textContent = getRandomFact(factCategory);
    
    gamePlayScreen.classList.add('hidden');
    gamePausedScreen.classList.remove('hidden');
}

// Resume the game
function resumeGame() {
    if (!gameActive || !gamePaused) return;
    
    gamePaused = false;
    gamePlayScreen.classList.remove('hidden');
    gamePausedScreen.classList.add('hidden');
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
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
    
    // Generate obstacles and collectibles
    generateObstacles();
    generateCollectibles();
    
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
        settings.gameSpeed += 0.5;
        settings.obstacleFrequency += 0.002;
        settings.collectibleFrequency += 0.001;
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

// Generate obstacles
function generateObstacles() {
    if (Math.random() < settings.obstacleFrequency) {
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
}

// Generate collectibles
function generateCollectibles() {
    if (Math.random() < settings.collectibleFrequency) {
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
    // Check obstacle collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
        if (
            player.x < obstacles[i].x + obstacles[i].width &&
            player.x + player.width > obstacles[i].x &&
            player.y < obstacles[i].y + obstacles[i].height &&
            player.y + player.height > obstacles[i].y
        ) {
            gameOver();
            return;
        }
    }
    
    // Check collectible collisions
    for (let i = collectibles.length - 1; i >= 0; i--) {
        if (
            player.x < collectibles[i].x + collectibles[i].width &&
            player.x + player.width > collectibles[i].x &&
            player.y < collectibles[i].y + collectibles[i].height &&
            player.y + player.height > collectibles[i].y
        ) {
            // Store the waste type for environmental facts
            lastCollectedWasteType = collectibles[i].type;
            
            // Determine points based on waste type
            let pointsEarned = 0;
            switch (collectibles[i].type) {
                case 0: // Plastic
                    pointsEarned = wastePoints.plastic;
                    break;
                case 1: // Paper
                    pointsEarned = wastePoints.paper;
                    break;
                case 2: // Metal
                    pointsEarned = wastePoints.metal;
                    break;
            }
            
            // Check if this is part of a combo
            const now = animationTime;
            if (now - lastCollectTime < settings.comboTimeWindow) {
                comboCount++;
                comboMultiplier = Math.min(settings.maxComboMultiplier, 1 + Math.floor(comboCount / 3));
                pointsEarned *= comboMultiplier;
            } else {
                comboCount = 1;
                comboMultiplier = 1;
            }
            
            // Reset combo timer
            comboTimer = settings.comboTimeWindow;
            lastCollectTime = now;
            
            // Add points to score
            score += pointsEarned;
            
            // Create score popup
            scorePopups.push({
                x: collectibles[i].x,
                y: collectibles[i].y,
                value: pointsEarned,
                opacity: 1,
                combo: comboMultiplier > 1 ? comboMultiplier : null
            });
            
            // Update waste collected count
            wasteCollected++;
            updateWasteCollected();
            
            // Remove the collected item
            collectibles.splice(i, 1);
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
}

// Event listeners
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', pauseGame);
resumeButton.addEventListener('click', resumeGame);
restartButton.addEventListener('click', startGame);
restartFromPauseButton.addEventListener('click', startGame);

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
            if (player.lane > 0) player.lane--;
            break;
        case 'ArrowRight':
            if (player.lane < settings.lanes - 1) player.lane++;
            break;
        case 'ArrowUp':
        case ' ': // Space
            if (!player.isJumping) {
                player.velocityY = settings.jumpForce;
                player.isJumping = true;
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
    
    // Display environmental facts
    displayEnvironmentalFacts();
}); 