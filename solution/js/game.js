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
let lastPowerUpTime = 0; // Last time a power-up was generated
let particles = []; // Array to hold particle effects
let backgroundLayers = []; // Array to hold background parallax layers
let powerUps = []; // Array to hold active power-ups
let activePowerUps = {}; // Object to track active power-up effects

// Game settings and variables
let settings = {
    lanes: 3,
    laneWidth: 0,
    playerSpeed: 0.4,
    jumpHeight: 100,
    jumpDuration: 500,
    gameSpeed: 1,
    baseObstacleFrequency: 0.02,
    baseCollectibleFrequency: 0.01,
    obstacleFrequency: 0.02,
    collectibleFrequency: 0.01,
    powerUpFrequency: 0.002,
    difficultyIncrementInterval: 20000,  // 20 seconds
    maxObstacles: 15,                    // Maximum obstacles to render
    maxCollectibles: 15,                 // Maximum collectibles to render
    maxParticles: 100,                   // Maximum particles to render
    targetFPS: 60,                       // Target frames per second
    frameTimeLimit: 16.67                // ~60 FPS in ms (1000/60)
};

// Difficulty settings
const difficultySettings = {
    easy: {
        gameSpeed: 4,
        obstacleFrequency: 0.015,
        collectibleFrequency: 0.02,
        difficultyIncreaseRate: 0.2,
        jumpForce: -9,
        wasteSortingThreshold: 15
    },
    medium: {
        gameSpeed: 6,
        obstacleFrequency: 0.025,
        collectibleFrequency: 0.015,
        difficultyIncreaseRate: 0.4,
        jumpForce: -10,
        wasteSortingThreshold: 10
    },
    hard: {
        gameSpeed: 8,
        obstacleFrequency: 0.035,
        collectibleFrequency: 0.01,
        difficultyIncreaseRate: 0.6,
        jumpForce: -11,
        wasteSortingThreshold: 8
    }
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

// Power-up types and effects
const powerUpTypes = {
    shield: {
        duration: 10000, // 10 seconds
        color: '#4cc9f0',
        description: 'Shield: Protects from obstacles',
        icon: '🛡️'
    },
    magnet: {
        duration: 8000, // 8 seconds
        color: '#f72585',
        description: 'Magnet: Attracts collectibles',
        attractRadius: 150,
        icon: '🧲'
    },
    speedBoost: {
        duration: 5000, // 5 seconds
        color: '#4361ee',
        description: 'Speed Boost: Temporarily increases speed',
        speedMultiplier: 1.5,
        icon: '⚡'
    }
};

// Performance monitoring variables
let performanceMetrics = {
    fps: 0,
    frameTimes: [],
    lastFpsUpdate: 0,
    objectCounts: {
        obstacles: 0,
        collectibles: 0,
        particles: 0,
        powerUps: 0
    },
    showMonitor: false
};

// Set difficulty
function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    
    // Update settings based on difficulty
    settings.gameSpeed = difficultySettings[difficulty].gameSpeed;
    settings.obstacleFrequency = difficultySettings[difficulty].obstacleFrequency;
    settings.collectibleFrequency = difficultySettings[difficulty].collectibleFrequency;
    settings.difficultyIncreaseRate = difficultySettings[difficulty].difficultyIncreaseRate;
    settings.jumpForce = difficultySettings[difficulty].jumpForce;
    wasteSortingThreshold = difficultySettings[difficulty].wasteSortingThreshold;
    
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
    
    // Calculate lane width
    settings.laneWidth = canvas.width / settings.lanes;
    
    // Initialize player
    player = {
        x: (Math.floor(settings.lanes / 2) * settings.laneWidth) - (playerWidth / 2),
        y: canvas.height - playerHeight - 20,
        width: playerWidth,
        height: playerHeight,
        lane: Math.floor(settings.lanes / 2),
        jumping: false,
        jumpHeight: 0,
        jumpProgress: 0,
        fallSpeed: 0,
        sprite: {
            frameX: 0,
            frameY: 0,
            maxFrame: 3,
            animationSpeed: 5,
            frameTimer: 0
        }
    };
    
    // Reset game state
    obstacles = [];
    collectibles = [];
    particles = [];
    scorePopups = [];
    powerUps = [];
    activePowerUps = {};
    score = 0;
    wasteCollected = 0;
    gameActive = true;
    gamePaused = false;
    lastObstacleTime = 0;
    lastCollectibleTime = 0;
    lastPowerUpTime = 0;
    lastTime = 0;
    animationTime = 0;
    comboCount = 0;
    comboTimer = 0;
    comboMultiplier = 1;
    comboDisplayTime = 0;
    
    // Reset performance metrics
    performanceMetrics.frameTimes = [];
    performanceMetrics.fps = 0;
    performanceMetrics.lastFpsUpdate = 0;
    
    // Reset difficulty settings
    settings.lastDifficultyIncrease = 0;
    
    // Initialize settings based on selected difficulty
    setDifficulty(selectedDifficulty);
    
    // Initialize background layers
    initBackgroundLayers();
    
    // Update UI
    updateScore();
    updateWasteCollected();
    
    // Create object pools for better performance
    initializeObjectPools();
    
    // Reset and initialize sound manager if available
    if (typeof soundManager !== 'undefined') {
        soundManager.resetAll();
    }
    
    // Set initial high score
    highScore = parseInt(localStorage.getItem('subwasteSurferHighScore')) || 0;
    
    // Announce game start for screen readers
    if (typeof accessibilityManager !== 'undefined') {
        accessibilityManager.announceGameEvent('gameStart');
    }
    
    // Set up keyboard event for performance monitor toggle
    document.addEventListener('keydown', (event) => {
        // Toggle performance monitor with F key
        if (event.key === 'F' && event.ctrlKey) {
            performanceMetrics.showMonitor = !performanceMetrics.showMonitor;
            event.preventDefault();
        }
    });
}

// Initialize object pools for better performance
function initializeObjectPools() {
    // Pre-allocate particles for better performance
    particlePool = new Array(settings.maxParticles * 2).fill().map(() => ({
        x: 0, 
        y: 0, 
        velocityX: 0, 
        velocityY: 0, 
        size: 0, 
        color: '', 
        opacity: 0, 
        life: 0,
        active: false
    }));
    
    // Pre-allocate score popups for better performance
    scorePopupPool = new Array(20).fill().map(() => ({
        x: 0, 
        y: 0, 
        value: 0, 
        opacity: 0, 
        velocityY: 0, 
        combo: null,
        isPowerUpPopup: false,
        color: '',
        active: false
    }));
}

// Get a particle from the pool
function getParticleFromPool() {
    // Find an inactive particle
    for (let i = 0; i < particlePool.length; i++) {
        if (!particlePool[i].active) {
            particlePool[i].active = true;
            return particlePool[i];
        }
    }
    
    // If no inactive particles, reuse the oldest one
    const particle = particlePool[0];
    particlePool.push(particlePool.shift());
    return particle;
}

// Get a score popup from the pool
function getScorePopupFromPool() {
    // Find an inactive score popup
    for (let i = 0; i < scorePopupPool.length; i++) {
        if (!scorePopupPool[i].active) {
            scorePopupPool[i].active = true;
            return scorePopupPool[i];
        }
    }
    
    // If no inactive score popups, reuse the oldest one
    const popup = scorePopupPool[0];
    scorePopupPool.push(scorePopupPool.shift());
    return popup;
}

// Initialize background parallax layers
function initBackgroundLayers() {
    backgroundLayers = [
        {
            y: 0,
            speed: 0.2,
            color: '#0a2342',
            elements: generateStars(30)
        },
        {
            y: 0,
            speed: 0.5,
            color: '#126872',
            elements: generateClouds(5)
        },
        {
            y: 0,
            speed: 1,
            color: '#1e5f74',
            elements: []
        }
    ];
}

// Generate stars for background
function generateStars(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.5
        });
    }
    return stars;
}

// Generate clouds for background
function generateClouds(count) {
    const clouds = [];
    for (let i = 0; i < count; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height / 2),
            width: Math.random() * 100 + 50,
            height: Math.random() * 40 + 20,
            opacity: Math.random() * 0.3 + 0.1
        });
    }
    return clouds;
}

// Display environmental facts
function displayEnvironmentalFacts() {
    // Display a random fact on the start screen
    startScreenFactElement.textContent = getRandomFact();
    
    // The pause and game over facts will be set when those screens are shown
}

// Start the game
function startGame() {
    gameActive = true;
    gamePaused = false;
    score = 0;
    wasteCollected = 0;
    comboCount = 0;
    comboMultiplier = 1;
    comboTimer = 0;
    lastCollectedWasteType = null;
    obstacles = [];
    collectibles = [];
    scorePopups = [];
    player.lane = 1; // Middle lane
    player.isJumping = false;
    player.velocityY = 0;
    
    // Reset animation timer
    animationTime = 0;
    
    // Reset difficulty setting timer
    settings.lastDifficultyIncrease = 0;
    
    // Update settings based on selected difficulty
    applyDifficultySettings();
    
    // Show game play screen
    gameStartScreen.classList.add('hidden');
    gamePlayScreen.classList.remove('hidden');
    gamePausedScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Start game loop
    lastTime = performance.now();
    gameLoop(lastTime);
    
    // Start background music
    if (typeof soundManager !== 'undefined') {
        soundManager.startBackgroundMusic();
    }
    
    // Initialize background layers
    if (backgroundLayers.length === 0) {
        initBackgroundLayers();
    }
    
    // Announce game start for screen readers
    if (typeof accessibilityManager !== 'undefined') {
        accessibilityManager.announceGameEvent('gameStart');
    }
}

// Pause the game
function pauseGame() {
    if (!gameActive) return;
    
    gameActive = false;
    gamePaused = true;
    cancelAnimationFrame(animationFrameId);
    
    // Display a fact in the pause screen
    pauseScreenFactElement.textContent = getRandomFact();
    
    // Update music button text based on current state
    musicButton.textContent = soundManager && soundManager.musicEnabled ? 'Music On' : 'Music Off';
    
    // Update sound effects button text based on current state
    soundEffectsButton.textContent = soundManager && soundManager.soundEffectsEnabled ? 'Sound Effects On' : 'Sound Effects Off';
    
    // Update ARIA pressed state for the buttons
    if (musicButton && soundManager) {
        musicButton.setAttribute('aria-pressed', soundManager.musicEnabled.toString());
    }
    
    if (soundEffectsButton && soundManager) {
        soundEffectsButton.setAttribute('aria-pressed', soundManager.soundEffectsEnabled.toString());
    }
    
    gamePlayScreen.classList.add('hidden');
    gamePausedScreen.classList.remove('hidden');
    
    // Announce game pause for screen readers
    if (typeof accessibilityManager !== 'undefined') {
        accessibilityManager.announceGameEvent('gamePause');
    }
}

// Resume the game
function resumeGame() {
    if (!gamePaused) return;
    
    gameActive = true;
    gamePaused = false;
    
    gamePlayScreen.classList.remove('hidden');
    gamePausedScreen.classList.add('hidden');
    
    // Resume game loop
    lastTime = performance.now();
    gameLoop(lastTime);
    
    // Resume background music if enabled
    if (typeof soundManager !== 'undefined' && soundManager.musicEnabled) {
        soundManager.resumeBackgroundMusic();
    }
    
    // Announce game resume for screen readers
    if (typeof accessibilityManager !== 'undefined') {
        accessibilityManager.announceGameEvent('gameResume');
    }
}

// Game loop with performance monitoring
function gameLoop(timestamp) {
    // Calculate delta time and throttle frame rate if needed
    const deltaTime = Math.min(timestamp - lastTime, settings.frameTimeLimit);
    lastTime = timestamp;
    
    // Performance monitoring - start time measurement
    const startTime = performance.now();
    
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
    
    // Performance monitoring - end time measurement
    const endTime = performance.now();
    const frameTime = endTime - startTime;
    
    // Update performance metrics
    updatePerformanceMetrics(frameTime, timestamp);
    
    // Throttle frame rate if running too fast
    const timeToNextFrame = Math.max(0, settings.frameTimeLimit - frameTime);
    
    // Continue the loop if game is active
    if (gameActive && !gamePaused) {
        animationFrameId = setTimeout(() => {
            requestAnimationFrame(gameLoop);
        }, timeToNextFrame);
    }
}

// Update performance metrics
function updatePerformanceMetrics(frameTime, timestamp) {
    // Store last 60 frame times for FPS calculation
    performanceMetrics.frameTimes.push(frameTime);
    if (performanceMetrics.frameTimes.length > 60) {
        performanceMetrics.frameTimes.shift();
    }
    
    // Update FPS every 500ms
    if (timestamp - performanceMetrics.lastFpsUpdate > 500) {
        const averageFrameTime = performanceMetrics.frameTimes.reduce((sum, time) => sum + time, 0) / 
                                performanceMetrics.frameTimes.length;
        performanceMetrics.fps = Math.round(1000 / averageFrameTime);
        performanceMetrics.lastFpsUpdate = timestamp;
        
        // Update object counts
        performanceMetrics.objectCounts.obstacles = obstacles.length;
        performanceMetrics.objectCounts.collectibles = collectibles.length;
        performanceMetrics.objectCounts.particles = particles.length + particlePool.filter(p => p.active).length;
        performanceMetrics.objectCounts.powerUps = powerUps.length;
    }
    
    // Draw performance monitor if enabled
    if (performanceMetrics.showMonitor) {
        drawPerformanceMonitor();
    }
}

// Draw performance monitor
function drawPerformanceMonitor() {
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 110);
    ctx.strokeStyle = '#4cc9f0';
    ctx.strokeRect(10, 10, 200, 110);
    
    // Draw performance metrics
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS: ${performanceMetrics.fps}`, 20, 30);
    ctx.fillText(`Obstacles: ${performanceMetrics.objectCounts.obstacles}`, 20, 50);
    ctx.fillText(`Collectibles: ${performanceMetrics.objectCounts.collectibles}`, 20, 70);
    ctx.fillText(`Particles: ${performanceMetrics.objectCounts.particles}`, 20, 90);
    ctx.fillText(`Power-ups: ${performanceMetrics.objectCounts.powerUps}`, 20, 110);
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
    
    // Generate power-ups occasionally
    if (currentTime - lastPowerUpTime > 5000) { // Check every 5 seconds
        if (Math.random() < 0.2) { // 20% chance to generate a power-up
            generatePowerUp();
        }
        lastPowerUpTime = currentTime;
    }
    
    // Update obstacles
    updateObstacles(deltaTime);
    
    // Update collectibles
    updateCollectibles(deltaTime);
    
    // Update power-ups
    updatePowerUps(deltaTime);
    
    // Update active power-up effects
    updateActivePowerUps(deltaTime, currentTime);
    
    // Update particles
    updateParticles(deltaTime);
    
    // Update score popups
    updateScorePopups(deltaTime);
    
    // Check collisions
    checkCollisions();
    
    // Update score (base score from distance)
    score += Math.floor(deltaTime * 0.01);
    updateScore();
    
    // Increase difficulty over time
    if (animationTime - settings.lastDifficultyIncrease > settings.difficultyIncrementInterval) {
        // Count how many times difficulty has increased
        const difficultyLevel = Math.floor((animationTime - settings.lastDifficultyIncrease) / settings.difficultyIncrementInterval);
        
        if (difficultyLevel <= settings.maxDifficultyLevel) {
            // Apply difficulty increase with gradual diminishing returns
            const scaleFactor = 1 - (difficultyLevel / (settings.maxDifficultyLevel * 2));
            
            settings.gameSpeed += settings.difficultyIncreaseRate * scaleFactor;
            settings.obstacleFrequency += 0.002 * settings.difficultyIncreaseRate * scaleFactor;
            settings.collectibleFrequency += 0.001 * settings.difficultyIncreaseRate * scaleFactor;
            
            // Show difficulty increase notification
            createDifficultyPopup(difficultyLevel);
        }
        
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
    
    // Apply speed boost if active
    let moveSpeed = 0.1;
    if (activePowerUps.speedBoost) {
        moveSpeed *= powerUpTypes.speedBoost.speedMultiplier;
    }
    
    player.x += (targetX - player.x) * moveSpeed * deltaTime * 0.1;
    
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
    // Limit the number of obstacles processed
    const visibleCount = Math.min(obstacles.length, settings.maxObstacles);
    
    for (let i = 0; i < visibleCount; i++) {
        const obstacle = obstacles[i];
        
        // Move obstacle down
        obstacle.y += settings.gameSpeed * deltaTime * 0.3;
        
        // Remove obstacles that are off-screen
        if (obstacle.y > canvas.height) {
            // Use array splice for better performance when removing single items
            obstacles.splice(i, 1);
            i--;  // Adjust counter since we removed an item
        }
    }
    
    // If we have too many offscreen obstacles, trim the array
    if (obstacles.length > settings.maxObstacles * 1.5) {
        obstacles = obstacles.slice(-settings.maxObstacles);
    }
}

// Update collectibles
function updateCollectibles(deltaTime) {
    // Limit the number of collectibles processed
    const visibleCount = Math.min(collectibles.length, settings.maxCollectibles);
    
    for (let i = 0; i < visibleCount; i++) {
        const collectible = collectibles[i];
        
        // Move collectible down
        collectible.y += settings.gameSpeed * deltaTime * 0.2;
        
        // Animate floating effect
        collectible.floatOffset = Math.sin(animationTime * 0.003 + collectible.floatPhase) * 5;
        
        // Remove collectibles that are off-screen
        if (collectible.y > canvas.height) {
            collectibles.splice(i, 1);
            i--;  // Adjust counter since we removed an item
        }
    }
    
    // If we have too many offscreen collectibles, trim the array
    if (collectibles.length > settings.maxCollectibles * 1.5) {
        collectibles = collectibles.slice(-settings.maxCollectibles);
    }
}

// Update particles with optimized rendering
function updateParticles(deltaTime) {
    // Limit the number of particles processed
    const visibleCount = Math.min(particles.length, settings.maxParticles);
    
    for (let i = 0; i < visibleCount; i++) {
        const particle = particles[i];
        
        // Update particle position
        particle.x += particle.velocityX * deltaTime * 0.05;
        particle.y += particle.velocityY * deltaTime * 0.05;
        
        // Update opacity (fade out)
        particle.opacity -= deltaTime * 0.001;
        
        // Decrement life
        particle.life -= deltaTime;
        
        // Remove particles that are faded out or expired
        if (particle.opacity <= 0 || particle.life <= 0) {
            particles.splice(i, 1);
            i--;  // Adjust counter since we removed an item
        }
    }
    
    // If we have too many particles, remove oldest ones
    if (particles.length > settings.maxParticles) {
        particles = particles.slice(-settings.maxParticles);
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

// Check for collisions with optimized calculations
function checkCollisions() {
    // Skip collision detection if player is in jump animation
    if (player.jumping) {
        return;
    }
    
    // Get player bounds once for all collision checks
    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const playerTop = player.y;
    const playerBottom = player.y + player.height;
    
    // Check for collisions with obstacles (only check visible ones)
    const visibleObstacles = Math.min(obstacles.length, settings.maxObstacles);
    for (let i = 0; i < visibleObstacles; i++) {
        const obstacle = obstacles[i];
        
        // Skip objects that are clearly not in collision range
        if (obstacle.y > canvas.height || obstacle.y + obstacle.height < 0) {
            continue;
        }
        
        // Simple collision detection
        if (
            playerLeft < obstacle.x + obstacle.width &&
            playerRight > obstacle.x &&
            playerTop < obstacle.y + obstacle.height &&
            playerBottom > obstacle.y
        ) {
            // Collision detected
            gameOver();
            return;  // Exit early since game is over
        }
    }
    
    // Check for collisions with collectibles (only check visible ones)
    const visibleCollectibles = Math.min(collectibles.length, settings.maxCollectibles);
    for (let i = 0; i < visibleCollectibles; i++) {
        const collectible = collectibles[i];
        
        // Skip objects that are clearly not in collision range
        if (collectible.y > canvas.height || collectible.y + collectible.height < 0) {
            continue;
        }
        
        // Simple collision detection with float offset
        if (
            playerLeft < collectible.x + collectible.width &&
            playerRight > collectible.x &&
            playerTop < collectible.y + collectible.height + collectible.floatOffset &&
            playerBottom > collectible.y + collectible.floatOffset
        ) {
            collectWaste(i);
            return;  // Exit early to prevent multiple collections in a single frame
        }
    }
    
    // Check for collisions with power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        
        // Skip objects that are clearly not in collision range
        if (powerUp.y > canvas.height || powerUp.y + powerUp.height < 0) {
            continue;
        }
        
        // Simple collision detection
        if (
            playerLeft < powerUp.x + powerUp.width &&
            playerRight > powerUp.x &&
            playerTop < powerUp.y + powerUp.height &&
            playerBottom > powerUp.y
        ) {
            collectPowerUp(i);
            return;  // Exit early to prevent multiple collections in a single frame
        }
    }
}

// Draw game objects
function drawGame() {
    // Draw background with parallax effect
    drawBackground();
    
    // Draw lanes
    drawLanes();
    
    // Draw player
    drawPlayer();
    
    // Draw obstacles
    drawObstacles();
    
    // Draw collectibles
    drawCollectibles();
    
    // Draw power-ups
    drawPowerUps();
    
    // Draw particles
    drawParticles();
    
    // Draw score popups
    drawScorePopups();
    
    // Draw active power-up indicators
    drawActivePowerUps();
    
    // Draw combo indicator if active
    if (comboCount > 0 && comboMultiplier > 1) {
        drawComboIndicator();
    }
    
    // Draw performance monitor if enabled
    if (performanceMetrics.showMonitor) {
        drawPerformanceMonitor();
    }
}

// Draw background with parallax effect
function drawBackground() {
    // Draw base background
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw parallax layers
    for (const layer of backgroundLayers) {
        // Update layer position
        layer.y = (layer.y + settings.gameSpeed * layer.speed * 0.1) % canvas.height;
        
        // Draw layer
        ctx.fillStyle = layer.color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, layer.y - canvas.height, canvas.width, canvas.height);
        ctx.fillRect(0, layer.y, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        
        // Draw layer elements
        if (layer.elements) {
            for (const element of layer.elements) {
                if (element.size) {
                    // Draw star
                    ctx.fillStyle = '#ffffff';
                    ctx.globalAlpha = element.opacity;
                    ctx.beginPath();
                    ctx.arc(element.x, (element.y + layer.y) % canvas.height, element.size, 0, Math.PI * 2);
                    ctx.fill();
                } else if (element.width) {
                    // Draw cloud
                    ctx.fillStyle = '#ffffff';
                    ctx.globalAlpha = element.opacity;
                    ctx.beginPath();
                    ctx.ellipse(element.x, (element.y + layer.y) % canvas.height, element.width / 2, element.height / 2, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        
        ctx.globalAlpha = 1;
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
    
    // Add visual effect for active power-ups
    if (activePowerUps.shield) {
        // Draw shield effect
        ctx.save();
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.width * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = powerUpTypes.shield.color;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.restore();
    }
    
    if (activePowerUps.speedBoost) {
        // Draw speed lines behind player
        ctx.save();
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(player.x - player.width / 2 - 10 - i * 3, player.y - player.height / 2);
            ctx.lineTo(player.x - player.width / 2 - 20 - i * 5, player.y + player.height / 2);
            ctx.strokeStyle = powerUpTypes.speedBoost.color;
            ctx.globalAlpha = 0.5 - i * 0.1;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        ctx.restore();
    }
    
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

// Draw power-ups
function drawPowerUps() {
    for (const powerUp of powerUps) {
        const typeConfig = powerUpTypes[powerUp.type];
        
        ctx.save();
        ctx.translate(powerUp.x, powerUp.y);
        ctx.rotate(powerUp.rotation);
        
        // Draw power-up background
        ctx.fillStyle = typeConfig.color;
        ctx.beginPath();
        ctx.arc(0, 0, powerUp.width / 2 * (1 + powerUp.pulseSize), 0, Math.PI * 2);
        ctx.fill();
        
        // Draw power-up icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typeConfig.icon, 0, 0);
        
        ctx.restore();
        
        // Draw glow effect
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = typeConfig.color;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.width * 0.7 * (1 + powerUp.pulseSize), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Draw score popups
function drawScorePopups() {
    for (const popup of scorePopups) {
        ctx.save();
        ctx.globalAlpha = popup.opacity;
        
        if (popup.isDifficultyPopup) {
            // Draw difficulty popup
            ctx.font = 'bold 28px Arial';
            ctx.fillStyle = '#f72585';
            ctx.textAlign = 'center';
            ctx.fillText(popup.value, popup.x, popup.y);
        } else if (popup.isPowerUpPopup) {
            // Draw power-up notification
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = popup.color;
            ctx.textAlign = 'center';
            ctx.fillText(popup.value, popup.x, popup.y);
        } else {
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
    
    // Update leaderboard with current score
    if (typeof leaderboardManager !== 'undefined') {
        leaderboardManager.setCurrentScore(score, wasteCollected);
        
        // Reset submit button and input field
        const submitButton = document.getElementById('submit-score-button');
        const playerNameInput = document.getElementById('player-name');
        if (submitButton && playerNameInput) {
            submitButton.disabled = false;
            playerNameInput.disabled = false;
        }
    }
    
    gamePlayScreen.classList.add('hidden');
    gamePausedScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    
    // Play game over sound and stop background music
    if (typeof soundManager !== 'undefined') {
        soundManager.pauseBackgroundMusic();
        soundManager.play('gameOver');
    }
    
    // Announce game over for screen readers
    if (typeof accessibilityManager !== 'undefined') {
        accessibilityManager.announceGameEvent('gameOver', { score, wasteCollected });
    }
}

// Player jump function
function playerJump() {
    if (!player.isJumping) {
        // Apply speed boost to jump force if active
        let jumpForce = settings.jumpForce;
        if (activePowerUps.speedBoost) {
            jumpForce *= 1.2; // Jump higher with speed boost
        }
        
        player.velocityY = jumpForce;
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
    const collectibleType = collectible.type;
    const basePoints = collectible.points;
    
    // Apply combo multiplier
    const pointsEarned = Math.round(basePoints * comboMultiplier);
    
    // Add to score
    score += pointsEarned;
    updateScore();
    
    // Increment waste collected
    wasteCollected++;
    updateWasteCollected();
    
    // Update last collected waste type
    lastCollectedWasteType = collectibleType;
    
    // Reset combo timer
    const currentTime = performance.now();
    const timeSinceLastCollect = currentTime - lastCollectTime;
    lastCollectTime = currentTime;
    
    // Apply combo system: if collected within time window, increase combo
    if (timeSinceLastCollect < settings.comboTimeWindow) {
        comboCount++;
        comboMultiplier = Math.min(settings.maxComboMultiplier, 1 + (comboCount * settings.comboMultiplierStep));
        comboTimer = settings.comboDisplayTime;
    } else {
        // Reset combo if too much time has passed
        comboCount = 0;
        comboMultiplier = 1;
    }
    
    // Create score popup
    scorePopups.push({
        x: collectible.x,
        y: collectible.y,
        value: pointsEarned,
        opacity: 1,
        velocityY: -2,
        combo: comboMultiplier > 1 ? comboMultiplier : null
    });
    
    // Create particle effect
    createCollectionParticles(collectible.x, collectible.y, collectible.color);
    
    // Play sound effect
    if (typeof soundManager !== 'undefined') {
        soundManager.play('collect');
    }
    
    // Announce waste collection for screen readers
    if (typeof accessibilityManager !== 'undefined') {
        accessibilityManager.announceGameEvent('collectWaste', { 
            type: collectibleType,
            points: pointsEarned,
            combo: comboMultiplier
        });
    }
    
    // Remove collectible
    collectibles.splice(collectibleIndex, 1);
    
    // Check if we should trigger the waste sorting mini-game
    if (wasteSortingEnabled && wasteCollected % wasteSortingThreshold === 0) {
        triggerWasteSortingGame();
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

// Create difficulty increase popup
function createDifficultyPopup(level) {
    // Create popup
    scorePopups.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        value: `Difficulty Level ${level}!`,
        opacity: 1,
        velocityY: -1,
        isDifficultyPopup: true
    });
    
    // Play sound if available
    if (typeof soundManager !== 'undefined') {
        soundManager.play('collect'); // Use collect sound as a level up notification
    }
    
    // Announce level up for screen readers
    if (typeof accessibilityManager !== 'undefined') {
        accessibilityManager.announceGameEvent('levelUp', { level });
    }
}

// Create collection particles with object pooling
function createCollectionParticles(x, y, color) {
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        
        // Get a particle from the pool instead of creating a new object
        const particle = getParticleFromPool();
        
        // Set particle properties
        particle.x = x;
        particle.y = y;
        particle.velocityX = Math.cos(angle) * speed;
        particle.velocityY = Math.sin(angle) * speed;
        particle.size = Math.random() * 3 + 2;
        particle.color = color;
        particle.opacity = 1;
        particle.life = Math.random() * 30 + 20;
    }
}

// Generate a power-up
function generatePowerUp() {
    const lane = Math.floor(Math.random() * settings.lanes);
    const powerUpKeys = Object.keys(powerUpTypes);
    const type = powerUpKeys[Math.floor(Math.random() * powerUpKeys.length)];
    
    powerUps.push({
        x: (lane * settings.laneWidth) - (settings.laneWidth / 2),
        y: -30,
        width: 40,
        height: 40,
        lane: lane,
        type: type,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        pulseSize: 0,
        pulseDirection: 1
    });
}

// Update power-ups
function updatePowerUps(deltaTime) {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        
        // Move power-up down
        powerUp.y += settings.gameSpeed * deltaTime * 0.1;
        
        // Rotate power-up for visual interest
        powerUp.rotation += powerUp.rotationSpeed;
        
        // Pulse effect
        powerUp.pulseSize += powerUp.pulseDirection * 0.02;
        if (powerUp.pulseSize > 0.2 || powerUp.pulseSize < -0.2) {
            powerUp.pulseDirection *= -1;
        }
        
        // Remove power-ups that are off-screen
        if (powerUp.y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }
}

// Collect power-up
function collectPowerUp(index) {
    const powerUp = powerUps[index];
    const typeConfig = powerUpTypes[powerUp.type];
    
    // Apply power-up effect
    activePowerUps[powerUp.type] = {
        startTime: performance.now(),
        duration: typeConfig.duration
    };
    
    // Create particle effect
    createCollectionParticles(powerUp.x, powerUp.y, typeConfig.color);
    
    // Create notification popup
    scorePopups.push({
        x: canvas.width / 2,
        y: canvas.height / 3,
        value: typeConfig.description,
        opacity: 1,
        velocityY: -1,
        isPowerUpPopup: true,
        color: typeConfig.color
    });
    
    // Play power-up sound
    if (typeof soundManager !== 'undefined') {
        soundManager.play('powerUp');
    }
    
    // Announce power-up collection for screen readers
    if (typeof accessibilityManager !== 'undefined') {
        accessibilityManager.announceGameEvent('powerUp', { type: typeConfig.description });
    }
    
    // Add bonus points
    score += 100;
    updateScore();
    
    // Remove the power-up
    powerUps.splice(index, 1);
}

// Update active power-ups
function updateActivePowerUps(deltaTime, currentTime) {
    // Check for expired power-ups
    for (const [type, data] of Object.entries(activePowerUps)) {
        if (currentTime - data.startTime > data.duration) {
            delete activePowerUps[type];
            
            // Notification for power-up expiry
            scorePopups.push({
                x: canvas.width / 2,
                y: canvas.height / 3,
                value: `${powerUpTypes[type].description} expired!`,
                opacity: 1,
                velocityY: -1,
                isPowerUpPopup: true,
                color: '#888888'
            });
        }
    }
    
    // Apply power-up effects
    if (activePowerUps.speedBoost) {
        // Speed boost effect is applied directly in the player movement
    }
}

// Draw particles with optimized rendering
function drawParticles() {
    // Batch similar particles for better performance
    ctx.globalAlpha = 1;
    
    // Group particles by color for batch rendering
    const particlesByColor = {};
    
    // Only process active particles
    for (const particle of particles.concat(particlePool.filter(p => p.active))) {
        if (!particlesByColor[particle.color]) {
            particlesByColor[particle.color] = [];
        }
        particlesByColor[particle.color].push(particle);
    }
    
    // Draw particles in batches by color
    for (const color in particlesByColor) {
        const particleBatch = particlesByColor[color];
        ctx.fillStyle = color;
        
        for (const particle of particleBatch) {
            ctx.globalAlpha = particle.opacity;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Reset global alpha
    ctx.globalAlpha = 1;
}

// Draw active power-up indicators
function drawActivePowerUps() {
    let y = 100;
    const x = canvas.width - 100;
    
    for (const [type, data] of Object.entries(activePowerUps)) {
        const typeConfig = powerUpTypes[type];
        const timeRemaining = typeConfig.duration - (performance.now() - data.startTime);
        const percentRemaining = timeRemaining / typeConfig.duration;
        
        // Draw icon
        ctx.fillStyle = typeConfig.color;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typeConfig.icon, x, y);
        
        // Draw timer bar
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 25, y + 25, 50, 5);
        
        ctx.fillStyle = typeConfig.color;
        ctx.fillRect(x - 25, y + 25, 50 * percentRemaining, 5);
        
        // Move down for next power-up
        y += 60;
    }
} 