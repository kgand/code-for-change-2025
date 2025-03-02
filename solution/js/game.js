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

// Game settings
const settings = {
    gameSpeed: 5,
    gravity: 0.5,
    jumpForce: -10,
    laneWidth: 200,
    lanes: 3,
    obstacleFrequency: 0.02, // Chance per frame
    collectibleFrequency: 0.01 // Chance per frame
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
    
    // Create player
    player = {
        x: canvas.width / 2,
        y: canvas.height - 100,
        width: 50,
        height: 70,
        velocityY: 0,
        lane: 1, // Middle lane
        isJumping: false
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
            lane: lane
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
            type: Math.floor(Math.random() * 3) // 0: plastic, 1: paper, 2: metal
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
    ctx.fillStyle = '#4cc9f0';
    ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    
    // Draw eyes (simple Wall-E style)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x - 15, player.y - 20, 10, 10);
    ctx.fillRect(player.x + 5, player.y - 20, 10, 10);
}

// Draw obstacles
function drawObstacles() {
    ctx.fillStyle = '#e63946';
    
    for (const obstacle of obstacles) {
        ctx.fillRect(obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height);
    }
}

// Draw collectibles
function drawCollectibles() {
    for (const collectible of collectibles) {
        // Different colors for different waste types
        switch (collectible.type) {
            case 0: // Plastic
                ctx.fillStyle = '#90e0ef';
                break;
            case 1: // Paper
                ctx.fillStyle = '#ffb703';
                break;
            case 2: // Metal
                ctx.fillStyle = '#adb5bd';
                break;
        }
        
        ctx.beginPath();
        ctx.arc(collectible.x, collectible.y, collectible.width / 2, 0, Math.PI * 2);
        ctx.fill();
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