// Subwaste Surfer - Main Game Logic

// Game elements
const gameStartScreen = document.getElementById('game-start');
const gamePlayScreen = document.getElementById('game-play');
const gameOverScreen = document.getElementById('game-over');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const scoreElement = document.getElementById('score');
const wasteCollectedElement = document.getElementById('waste-collected');
const finalScoreElement = document.getElementById('final-score');
const finalWasteElement = document.getElementById('final-waste');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game state
let gameActive = false;
let score = 0;
let wasteCollected = 0;
let animationFrameId;
let lastTime = 0;
let animationTime = 0;

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
    lastDifficultyIncrease: 0
};

// Game objects
let player;
let obstacles = [];
let collectibles = [];

// Initialize the game
function init() {
    // Set canvas dimensions
    canvas.width = gamePlayScreen.offsetWidth;
    canvas.height = gamePlayScreen.offsetHeight;
    
    // Reset game state
    score = 0;
    wasteCollected = 0;
    obstacles = [];
    collectibles = [];
    animationTime = 0;
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

// Start the game
function startGame() {
    gameStartScreen.classList.add('hidden');
    gamePlayScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    
    init();
    gameActive = true;
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Game loop
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Update animation time
    animationTime += deltaTime;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game state
    updateGame(deltaTime);
    
    // Draw game objects
    drawGame();
    
    // Continue the loop if game is active
    if (gameActive) {
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
    
    // Check collisions
    checkCollisions();
    
    // Update score
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
            wasteCollected++;
            updateWasteCollected();
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
    cancelAnimationFrame(animationFrameId);
    
    finalScoreElement.textContent = `Score: ${score}`;
    finalWasteElement.textContent = `Waste Collected: ${wasteCollected}`;
    
    gamePlayScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
}

// Event listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Keyboard controls
document.addEventListener('keydown', (event) => {
    if (!gameActive) return;
    
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
    gameOverScreen.classList.add('hidden');
}); 