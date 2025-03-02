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

// Import or reference the animation manager
let animationManager = null;

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
let stars = [];
let clouds = [];

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
    frameTimeLimit: 16.67,               // ~60 FPS in ms (1000/60)
    isMobileDevice: false,               // Will be set during initialization
    mobileScaleFactor: 0.7,              // Scale factor for mobile devices
    lowPerformanceMode: false            // For very low-end devices
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
    // Set up canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Calculate lane width based on canvas width
    settings.laneWidth = canvas.width / settings.lanes;
    
    // Initialize player
    initPlayer();
    
    // Initialize animation manager
    animationManager = new AnimationManager(canvas, ctx, settings);
    
    // Initialize object pools
    initializeObjectPools();
    
    // Initialize background layers
    initBackgroundLayers();
    
    // Initialize environmental facts
    displayEnvironmentalFacts();
    
    // Initialize touch controls if on mobile
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        settings.isMobileDevice = true;
        touchControls = new TouchControls(canvas, {
            onSwipeLeft: () => movePlayer(-1),
            onSwipeRight: () => movePlayer(1),
            onSwipeUp: playerJump,
            onTap: playerJump
        });
    }
    
    // Initialize waste sorting game
    wasteSortingGame = new WasteSortingGame(canvas, ctx, {
        onComplete: (score, correctSorts) => {
            // Apply bonus based on sorting performance
            const bonus = score * 10;
            this.score += bonus;
            
            // Resume main game
            inMiniGame = false;
            resumeGame();
            
            // Show bonus notification
            scorePopups.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                value: `Bonus: +${bonus}`,
                opacity: 1,
                velocityY: -1,
                color: '#ffde59'
            });
        }
    });
    
    // Detect device capabilities and adjust settings
    detectDeviceCapabilities();
    
    // Set up event listeners
    window.addEventListener('keydown', (e) => {
        if (!gameActive || inMiniGame) return;
        
        switch (e.key) {
            case 'ArrowLeft':
                movePlayer(-1);
                break;
            case 'ArrowRight':
                movePlayer(1);
                break;
            case 'ArrowUp':
            case ' ':
                playerJump();
                break;
            case 'p':
            case 'Escape':
                if (gamePaused) {
                    resumeGame();
                } else {
                    pauseGame();
                }
                break;
            case 'm':
                // Toggle mute
                if (typeof soundManager !== 'undefined') {
                    soundManager.toggleMute();
                    muteButton.textContent = soundManager.isMuted ? '🔇' : '🔊';
                    muteButton.setAttribute('aria-label', soundManager.isMuted ? 'Unmute' : 'Mute');
                }
                break;
        }
    });
}

// Detect device capabilities for performance optimizations
function detectDeviceCapabilities() {
    // Check if this is a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    settings.isMobileDevice = isMobile;
    
    // Check for device memory API
    let deviceMemory = 4; // Default to 4GB if not available
    if (navigator.deviceMemory) {
        deviceMemory = navigator.deviceMemory;
    }
    
    // Check for hardware concurrency (CPU cores)
    let cpuCores = 4; // Default to 4 cores if not available
    if (navigator.hardwareConcurrency) {
        cpuCores = navigator.hardwareConcurrency;
    }
    
    console.log(`Device info: Mobile=${isMobile}, Memory=${deviceMemory}GB, CPU cores=${cpuCores}`);
    
    // Try to load previously saved quality settings
    try {
        const savedQuality = localStorage.getItem('subwaste_quality_level');
        if (savedQuality) {
            console.log(`Loading saved quality level: ${savedQuality}`);
            setQualityLevel(savedQuality);
            return; // Exit early since we've loaded settings
        }
    } catch (error) {
        console.error('Error loading quality preference:', error);
    }
    
    // If no saved settings, set defaults based on device capabilities
    if (isMobile) {
        // Determine initial quality based on device capabilities
        if (deviceMemory <= 2 || cpuCores <= 2) {
            // Low-end device - use low quality
            setQualityLevel('low');
        } else if (deviceMemory <= 4 || cpuCores <= 4) {
            // Mid-range device - use medium quality
            setQualityLevel('medium');
        } else {
            // High-end device - use high quality but still mobile optimized
            setQualityLevel('high');
        }
    } else {
        // Desktop - use high quality
        setQualityLevel('high');
    }
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

// Initialize background layers
function initBackgroundLayers() {
    // Clear existing layers
    backgroundLayers = [];
    stars = [];
    clouds = [];
    
    // Create background layers differently based on device capabilities
    if (settings.lowPerformanceMode) {
        // For low-performance mode, don't create complex background elements
        return;
    }
    
    // Create stars (fewer on mobile)
    const starCount = settings.isMobileDevice ? 50 : 150;
    generateStars(starCount);
    
    // Create clouds (fewer on mobile)
    const cloudCount = settings.isMobileDevice ? 5 : 15;
    generateClouds(cloudCount);
    
    // Create background layers using preloaded images if available
    const backgroundImageNames = ['bg-layer1', 'bg-layer2', 'bg-layer3', 'bg-layer4', 'bg-layer5'];
    const layerDepths = [0.1, 0.2, 0.4, 0.7, 1.0]; // Depth factors for parallax effect
    const layerOpacities = [0.2, 0.3, 0.4, 0.6, 0.8]; // Opacity for each layer
    
    for (let i = 0; i < backgroundImageNames.length; i++) {
        // Use preloaded images if available, otherwise create placeholders
        const image = window.gameAssets && window.gameAssets.images[backgroundImageNames[i]] ? 
            window.gameAssets.images[backgroundImageNames[i]] : 
            { width: canvas.width, height: canvas.height };
            
        const layer = {
            image: image,
            x: 0,
            y: 0, // Add y position for vertical parallax
            scrollSpeed: 0.2 + (layerDepths[i] * 0.8), // Speed based on depth
            verticalScrollSpeed: 0.05 * layerDepths[i], // Vertical parallax speed
            opacity: layerOpacities[i],
            depth: layerDepths[i],
            width: canvas.width,
            height: canvas.height,
            scale: 1 + (0.2 * (1 - layerDepths[i])) // Scale based on depth
        };
        backgroundLayers.push(layer);
    }
    
    // Add foreground elements (silhouettes, etc.)
    if (window.gameAssets && window.gameAssets.images['foreground']) {
        backgroundLayers.push({
            image: window.gameAssets.images['foreground'],
            x: 0,
            y: canvas.height - (window.gameAssets.images['foreground'].height || 100),
            scrollSpeed: 1.2, // Faster than other layers
            verticalScrollSpeed: 0,
            opacity: 0.9,
            depth: 1.2,
            width: canvas.width,
            height: window.gameAssets.images['foreground'].height || 100,
            scale: 1
        });
    }
}

// Generate stars for background with enhanced properties
function generateStars(count) {
    for (let i = 0; i < count; i++) {
        const depth = Math.random() * 0.8 + 0.2; // Random depth between 0.2 and 1.0
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.7), // Stars only in top 70% of screen
            size: Math.random() * 2 + 0.5,
            phase: Math.random() * Math.PI * 2,
            twinkleSpeed: Math.random() * 0.01 + 0.005,
            depth: depth,
            speed: 0.1 + (depth * 0.3) // Speed based on depth
        });
    }
}

// Generate clouds with enhanced properties
function generateClouds(count) {
    for (let i = 0; i < count; i++) {
        const depth = Math.random() * 0.8 + 0.2; // Random depth between 0.2 and 1.0
        const size = (Math.random() * 30 + 20) * (1 + (1 - depth)); // Size based on depth
        
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.5),
            size: size,
            opacity: 0.3 + (depth * 0.5), // Opacity based on depth
            speed: 0.2 + (depth * 0.8), // Speed based on depth
            depth: depth,
            cloudParts: Array(Math.floor(Math.random() * 3) + 3).fill().map(() => ({
                offsetX: (Math.random() - 0.5) * size,
                offsetY: (Math.random() - 0.5) * size * 0.5,
                size: size * (Math.random() * 0.4 + 0.6)
            }))
        });
    }
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
    
    // Create a fade-in transition effect
    animationManager.createFadeTransition('in', 500);
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
    
    // Create a fade transition
    animationManager.createWipeTransition('out', 300);
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
    
    // Create a fade transition
    animationManager.createWipeTransition('in', 300);
}

// Game loop with enhanced animations
function gameLoop(timestamp) {
    if (!lastTime) {
        lastTime = timestamp;
    }
    
    // Calculate delta time between frames
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Update animation time for various effects
    animationTime += deltaTime;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and render game if active and not paused
    if (gameActive && !gamePaused && !inMiniGame) {
        // Update game state
        updateGame(deltaTime);
        
        // Update animation manager
        animationManager.update(timestamp);
        
        // Draw game
        drawGame();
        
        // Draw animations on top
        animationManager.draw();
    }
    
    // Continue the game loop
    animationFrameId = requestAnimationFrame(gameLoop);
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
    
    // Update achievements
    updateAchievements();
}

// Update player position with enhanced animations
function updatePlayer(deltaTime) {
    // Apply gravity
    player.velocityY += settings.gravity;
    player.y += player.velocityY;
    
    // Check if player is on the ground
    if (player.y >= canvas.height - 100) {
        player.y = canvas.height - 100;
        player.velocityY = 0;
        
        // Only change jumping state if player was previously jumping
        if (player.isJumping) {
            player.isJumping = false;
            
            // Play landing animation
            if (animationManager) {
                animationManager.createCollectionEffect(
                    player.x, 
                    player.y + player.height / 2, 
                    '#cccccc'
                );
            }
        }
    }
    
    // Update player x position based on lane with smoother transitions
    const targetX = (player.lane * settings.laneWidth) - (settings.laneWidth / 2);
    const distanceToTarget = targetX - player.x;
    
    // Apply speed boost if active
    let moveSpeed = settings.playerSpeed;
    if (activePowerUps.speedBoost) {
        moveSpeed *= powerUpTypes.speedBoost.speedMultiplier;
    }
    
    // Smooth movement with easing
    player.x += distanceToTarget * moveSpeed * (deltaTime / 16);
    
    // Update animation states based on movement and actions
    if (Math.abs(distanceToTarget) > 5) {
        // Player is moving horizontally
        player.movementState = distanceToTarget > 0 ? 'moving-right' : 'moving-left';
        
        // Update lean angle based on movement direction and speed
        const targetLean = distanceToTarget > 0 ? 0.1 : -0.1;
        player.leanAngle += (targetLean - player.leanAngle) * 0.1;
    } else {
        // Player is relatively stationary
        player.movementState = 'idle';
        
        // Gradually return to upright position
        player.leanAngle *= 0.9;
    }
    
    // Update jump animation state
    if (player.isJumping) {
        player.jumpProgress = Math.min(1, (canvas.height - 100 - player.y) / settings.jumpHeight);
        
        // Set jump animation phase based on progress
        if (player.jumpProgress > 0.5) {
            player.jumpPhase = 'ascending';
        } else {
            player.jumpPhase = 'descending';
        }
    } else {
        player.jumpPhase = null;
        player.jumpProgress = 0;
    }
    
    // Update arm swing animation based on movement
    if (player.movementState === 'idle') {
        // Gentle arm swing when idle
        player.armSwing = Math.sin(animationTime / 500) * 0.2;
    } else {
        // More pronounced arm swing when moving
        player.armSwing = Math.sin(animationTime / 200) * 0.4;
    }
    
    // Update eye animation
    player.blinkTimer -= deltaTime;
    if (player.blinkTimer <= 0) {
        player.isBlinking = !player.isBlinking;
        
        // Set next blink timer
        if (player.isBlinking) {
            // Short blink duration
            player.blinkTimer = 150;
        } else {
            // Random time until next blink
            player.blinkTimer = Math.random() * 5000 + 2000;
        }
    }
    
    // Update eye position based on movement direction
    if (player.movementState === 'moving-right') {
        player.eyeOffset = Math.min(3, player.eyeOffset + 0.2);
    } else if (player.movementState === 'moving-left') {
        player.eyeOffset = Math.max(-3, player.eyeOffset - 0.2);
    } else {
        // Gradually return to center
        player.eyeOffset *= 0.9;
    }
    
    // Animate eyes (vertical movement)
    player.eyeHeight = -20 + Math.sin(animationTime / 300) * 3;
    
    // Add trail effect if player has active speed boost or invincibility
    if (activePowerUps.speedBoost || activePowerUps.invincibility) {
        const trailColor = activePowerUps.speedBoost ? '#00ffff' : '#ffff00';
        if (animationManager) {
            animationManager.createTrailEffect(player.x + player.width / 2, player.y + player.height, trailColor);
        }
    }
}

// Draw player with enhanced animations
function drawPlayer() {
    // Check if we have preloaded player sprite
    if (window.gameAssets && window.gameAssets.images['player-sprite']) {
        // Draw player using sprite sheet
        const sprite = window.gameAssets.images['player-sprite'];
        
        // Update animation frame
        player.sprite.frameTimer += 1;
        if (player.sprite.frameTimer >= player.sprite.animationSpeed) {
            player.sprite.frameTimer = 0;
            player.sprite.frameX = (player.sprite.frameX + 1) % player.sprite.maxFrame;
        }
        
        // Determine which animation row to use based on player state
        if (player.isJumping) {
            player.sprite.frameY = 1; // Jump animation row
        } else if (player.movementState !== 'idle') {
            player.sprite.frameY = 2; // Movement animation row
        } else {
            player.sprite.frameY = 0; // Idle animation row
        }
        
        // Draw sprite with animation
        const frameWidth = sprite.width / player.sprite.maxFrame;
        const frameHeight = sprite.height / player.sprite.rows;
        
        // Add visual effect for active power-ups
        if (activePowerUps.shield) {
            // Draw shield effect
            ctx.save();
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.width * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = powerUpTypes.shield.color;
            ctx.globalAlpha = 0.3 + Math.sin(animationTime / 200) * 0.1; // Pulsing effect
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
        
        // Apply rotation for leaning effect
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.leanAngle);
        
        // Draw sprite
        ctx.drawImage(
            sprite,
            player.sprite.frameX * frameWidth,
            player.sprite.frameY * frameHeight,
            frameWidth,
            frameHeight,
            -player.width / 2,
            -player.height / 2,
            player.width,
            player.height
        );
        
        ctx.restore();
    } else {
        // Fallback to enhanced rectangle drawing if sprite not available
        // Apply rotation for leaning effect
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.leanAngle);
        
        // Add visual effect for active power-ups
        if (activePowerUps.shield) {
            // Draw shield effect
            ctx.beginPath();
            ctx.arc(0, 0, player.width * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = powerUpTypes.shield.color;
            ctx.globalAlpha = 0.3 + Math.sin(animationTime / 200) * 0.1; // Pulsing effect
            ctx.fill();
        }
        
        if (activePowerUps.speedBoost) {
            // Draw speed lines behind player
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(-player.width / 2 - 10 - i * 3, -player.height / 2);
                ctx.lineTo(-player.width / 2 - 20 - i * 5, player.height / 2);
                ctx.strokeStyle = powerUpTypes.speedBoost.color;
                ctx.globalAlpha = 0.5 - i * 0.1;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }
        
        // Draw Wall-E body
        ctx.fillStyle = '#f9c74f'; // Yellow-orange for Wall-E
        ctx.globalAlpha = 1;
        ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
        
        // Draw treads/wheels with animation
        ctx.fillStyle = '#4d4d4d';
        
        // Left tread with animation
        const treadOffset = Math.sin(animationTime / 100) * 3;
        ctx.fillRect(-player.width / 2 - 5, 15 + treadOffset, 10, 20);
        
        // Right tread with animation (slightly out of phase)
        const rightTreadOffset = Math.sin(animationTime / 100 + Math.PI) * 3;
        ctx.fillRect(player.width / 2 - 5, 15 + rightTreadOffset, 10, 20);
        
        // Center tread
        ctx.fillRect(-player.width / 2, 15, player.width, 20);
        
        // Draw eyes (Wall-E style with animation)
        ctx.fillStyle = '#ffffff';
        
        // Left eye
        ctx.beginPath();
        ctx.arc(-10, player.eyeHeight, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye
        ctx.beginPath();
        ctx.arc(10, player.eyeHeight, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye pupils with blinking and direction animation
        if (!player.isBlinking) {
            ctx.fillStyle = '#000000';
            
            // Left pupil with direction offset
            ctx.beginPath();
            ctx.arc(-10 + player.eyeOffset, player.eyeHeight, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Right pupil with direction offset
            ctx.beginPath();
            ctx.arc(10 + player.eyeOffset, player.eyeHeight, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw closed eyes when blinking
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            
            // Left eye closed
            ctx.beginPath();
            ctx.moveTo(-15, player.eyeHeight);
            ctx.lineTo(-5, player.eyeHeight);
            ctx.stroke();
            
            // Right eye closed
            ctx.beginPath();
            ctx.moveTo(5, player.eyeHeight);
            ctx.lineTo(15, player.eyeHeight);
            ctx.stroke();
        }
        
        // Draw arms with animation based on state
        ctx.fillStyle = '#f9c74f';
        
        // Left arm with animation
        ctx.save();
        
        if (player.isJumping) {
            // Arms up when jumping
            ctx.translate(-player.width / 2 - 10, -10);
            ctx.rotate(-0.5 - player.jumpProgress * 0.3);
        } else {
            // Normal arm swing animation
            ctx.translate(-player.width / 2 - 10, -10);
            ctx.rotate(player.armSwing);
        }
        
        ctx.fillRect(0, 0, 10, 30);
        ctx.restore();
        
        // Right arm with animation (slightly out of phase)
        ctx.save();
        
        if (player.isJumping) {
            // Arms up when jumping
            ctx.translate(player.width / 2, -10);
            ctx.rotate(0.5 + player.jumpProgress * 0.3);
        } else {
            // Normal arm swing animation (opposite to left arm)
            ctx.translate(player.width / 2, -10);
            ctx.rotate(-player.armSwing);
        }
        
        ctx.fillRect(0, 0, 10, 30);
        ctx.restore();
        
        // Draw expression based on state
        if (player.isJumping) {
            // Excited expression when jumping
            ctx.fillStyle = '#f9c74f';
            ctx.beginPath();
            ctx.arc(0, 10, 8, 0, Math.PI, false);
            ctx.fill();
        } else if (activePowerUps.speedBoost || activePowerUps.invincibility) {
            // Determined expression with power-ups
            ctx.fillStyle = '#f9c74f';
            ctx.beginPath();
            ctx.arc(0, 15, 5, 0, Math.PI, true);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// Initialize player with animation properties
function initPlayer() {
    player = {
        x: (Math.floor(settings.lanes / 2) * settings.laneWidth) - (playerWidth / 2),
        y: canvas.height - playerHeight - 20,
        width: playerWidth,
        height: playerHeight,
        lane: Math.floor(settings.lanes / 2),
        targetLane: Math.floor(settings.lanes / 2),
        jumping: false,
        jumpHeight: 0,
        jumpProgress: 0,
        fallSpeed: 0,
        onGround: true,
        // Animation properties
        sprite: {
            frameX: 0,
            frameY: 0,
            maxFrame: 3,
            animationSpeed: 5,
            frameTimer: 0
        },
        // Advanced animation states
        animation: {
            state: 'idle', // idle, running, jumping, landing
            frameCounter: 0,
            frameDuration: 8, // frames to wait before changing animation frame
            currentFrame: 0,
            direction: 1, // 1 for right, -1 for left
            // Arm animation
            armSwing: 0,
            armSwingDirection: 1,
            armSwingSpeed: 0.05,
            // Eye animation
            eyeState: 'normal', // normal, blinking, looking
            eyeTimer: 0,
            blinkDuration: 10,
            lookDirection: { x: 0, y: 0 },
            // Expression
            expression: 'neutral', // neutral, happy, surprised, determined
            expressionTimer: 0,
            expressionDuration: 120
        },
        // Visual effects
        effects: {
            shield: {
                active: false,
                opacity: 0,
                radius: playerWidth * 1.2,
                color: 'rgba(64, 156, 255, 0.4)'
            },
            speedBoost: {
                active: false,
                particles: [],
                color: 'rgba(255, 215, 0, 0.7)'
            },
            magnetEffect: {
                active: false,
                radius: playerWidth * 3,
                opacity: 0.3,
                color: 'rgba(138, 43, 226, 0.3)'
            }
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
    
    // Update UI
    updateScore();
    updateWasteCollected();
    
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

// Draw particles with device-aware optimizations
function drawParticles() {
    // Skip detailed particle rendering in low performance mode
    if (settings.lowPerformanceMode) {
        // Draw simplified particles
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#ffffff';
        
        for (const particle of particles.slice(0, 20)) {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
        return;
    }
    
    // Regular optimized particle rendering for normal mode
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

// Draw background with enhanced parallax effects
function drawBackground() {
    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#0a1a3f'); // Dark blue at top
    skyGradient.addColorStop(0.5, '#0f3460'); // Medium blue in middle
    skyGradient.addColorStop(1, '#1a4a8c'); // Lighter blue at bottom
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars and parallax elements only if not in low performance mode
    if (!settings.lowPerformanceMode) {
        // Draw animated stars with parallax effect
        stars.forEach(star => {
            // Calculate star brightness with enhanced twinkling
            const brightness = 0.2 + Math.sin(animationTime * star.twinkleSpeed + star.phase) * 0.15;
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            
            // Move stars based on depth (parallax)
            star.x -= star.speed * settings.gameSpeed;
            
            // Wrap stars around when they go off-screen
            if (star.x < 0) {
                star.x = canvas.width;
                star.y = Math.random() * (canvas.height * 0.7);
            }
            
            // Draw the star
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw parallax background layers
        backgroundLayers.forEach(layer => {
            ctx.globalAlpha = layer.opacity;
            
            // Calculate scaled dimensions
            const scaledWidth = layer.width * layer.scale;
            const scaledHeight = layer.height * layer.scale;
            
            // Draw the layer with proper scaling
            ctx.drawImage(
                layer.image,
                layer.x,
                layer.y,
                scaledWidth,
                scaledHeight
            );
            
            // Draw a second copy for seamless scrolling
            ctx.drawImage(
                layer.image,
                layer.x + scaledWidth,
                layer.y,
                scaledWidth,
                scaledHeight
            );
            
            // Scroll the background layer horizontally
            layer.x -= layer.scrollSpeed * settings.gameSpeed;
            
            // Apply subtle vertical movement for some layers
            layer.y += Math.sin(animationTime * 0.0005) * layer.verticalScrollSpeed;
            
            // If the background has scrolled past its width, reset it
            if (layer.x <= -scaledWidth) {
                layer.x = 0;
            }
        });
        
        // Draw clouds with enhanced depth effect
        clouds.forEach(cloud => {
            ctx.globalAlpha = cloud.opacity;
            ctx.fillStyle = '#ffffff';
            
            // Move clouds based on depth (parallax)
            cloud.x -= cloud.speed * settings.gameSpeed;
            
            // Draw cloud with multiple parts for more natural look
            cloud.cloudParts.forEach(part => {
                ctx.beginPath();
                ctx.arc(
                    cloud.x + part.offsetX, 
                    cloud.y + part.offsetY, 
                    part.size / 2, 
                    0, Math.PI * 2
                );
                ctx.fill();
            });
            
            // If cloud moves off screen, reset it
            if (cloud.x + cloud.size * 2 < 0) {
                cloud.x = canvas.width + cloud.size;
                cloud.y = Math.random() * canvas.height * 0.5;
                
                // Regenerate cloud parts for variety
                cloud.cloudParts = Array(Math.floor(Math.random() * 3) + 3).fill().map(() => ({
                    offsetX: (Math.random() - 0.5) * cloud.size,
                    offsetY: (Math.random() - 0.5) * cloud.size * 0.5,
                    size: cloud.size * (Math.random() * 0.4 + 0.6)
                }));
            }
        });
    } else {
        // Simplified background for low-performance mode
        // Draw a simple gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0f3460');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.globalAlpha = 1;
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
    
    // Create a dramatic fade-out transition
    animationManager.createFadeTransition('out', 1000);
}

// Player jump function
function playerJump() {
    if (!gameActive || gamePaused || player.jumping) return;
    
    player.jumping = true;
    player.jumpProgress = 0;
    player.onGround = false;
    
    // Update animation state
    player.animation.state = 'jumping';
    player.animation.expression = 'surprised';
    player.animation.expressionTimer = player.animation.expressionDuration / 2;
    
    // Play sound effect if available
    if (typeof soundManager !== 'undefined') {
        soundManager.play('jump');
    }
    
    // Announce jump for accessibility
    if (typeof accessibilityManager !== 'undefined') {
        accessibilityManager.announceGameEvent('jump');
    }
    
    // Add jump particles
    if (!settings.lowPerformanceMode) {
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: player.x + player.width / 2,
                y: player.y + player.height,
                size: Math.random() * 5 + 2,
                speedX: (Math.random() - 0.5) * 3,
                speedY: Math.random() * 2 + 1,
                color: '#cccccc',
                opacity: 1,
                gravity: 0.1
            });
        }
    }
}

// Handle collectible collection
function collectWaste(collectibleIndex) {
    // Get the collected waste
    const collectible = collectibles[collectibleIndex];
    const wasteType = collectible.type;
    let points = 0;
    let color = '';
    
    // Calculate points based on waste type
    switch(wasteType) {
        case 'plastic':
            points = 10;
            color = '#2196f3'; // Blue for plastic
            break;
        case 'paper':
            points = 15;
            color = '#8bc34a'; // Green for paper
            break;
        case 'metal':
            points = 25;
            color = '#ff9800'; // Orange for metal
            break;
    }
    
    // Apply combo multiplier
    if (comboCount > 0) {
        points *= comboMultiplier;
    }
    
    // Update score and waste count
    score += points;
    wasteCollected++;
    
    // Create collection particle effect at the collectible's position
    animationManager.createCollectionEffect(collectible.x, collectible.y, color);
    
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
    const scorePopup = getScorePopupFromPool();
    scorePopup.x = collectible.x;
    scorePopup.y = collectible.y - 20;
    scorePopup.value = `+${points}`;
    scorePopup.opacity = 1;
    
    // Remove the collected waste
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
    // Initialize asset loader and preload game assets
    const assetLoader = new AssetLoader();
    
    // Show a simple loading screen
    assetLoader.showLoadingScreen();
    
    // Start loading assets
    assetLoader.loadAll(() => {
        // Assets loaded successfully, now initialize the game
        console.log('All assets preloaded successfully');
        
        // Hide loading screen
        assetLoader.hideLoadingScreen();
        
        // Show the start screen
        gameStartScreen.classList.remove('hidden');
        gamePlayScreen.classList.add('hidden');
        gamePausedScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        
        // Set default difficulty
        setDifficulty('easy');
        
        // Display environmental facts
        displayEnvironmentalFacts();
        
        // Initialize game for faster start when player clicks play
        init();
        
        // Store asset loader reference globally for access throughout the game
        window.gameAssets = assetLoader.assets;
    });
});

// Player movement function for consistent controls
function movePlayer(direction) {
    if (!gameActive || gamePaused || player.jumping) return;
    
    // Calculate new lane
    const newLane = Math.max(0, Math.min(settings.lanes - 1, player.lane + direction));
    
    // Only proceed if actually changing lanes
    if (newLane !== player.lane) {
        player.lane = newLane;
        player.targetLane = newLane;
        
        // Update animation state
        player.animation.state = 'running';
        player.animation.direction = direction > 0 ? 1 : -1;
        player.animation.expression = 'determined';
        player.animation.expressionTimer = player.animation.expressionDuration;
        
        // Play sound effect if available
        if (typeof soundManager !== 'undefined') {
            soundManager.play('move');
        }
        
        // Announce lane change for accessibility
        if (typeof accessibilityManager !== 'undefined') {
            accessibilityManager.announceGameEvent('laneChange', { lane: newLane + 1 });
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

// Create mobile quality settings UI
function createMobileQualitySettings() {
    // Check if UI already exists
    if (document.getElementById('mobile-quality-settings')) {
        return;
    }
    
    // Create container
    const container = document.createElement('div');
    container.id = 'mobile-quality-settings';
    container.className = 'mobile-quality-settings';
    
    // Create heading
    const heading = document.createElement('h3');
    heading.textContent = 'Performance Settings';
    container.appendChild(heading);
    
    // Create quality selector
    const qualitySelector = document.createElement('div');
    qualitySelector.className = 'quality-selector';
    
    // Create quality options
    const qualityOptions = [
        { id: 'high-quality', label: 'High Quality', value: 'high' },
        { id: 'medium-quality', label: 'Medium Quality', value: 'medium' },
        { id: 'low-quality', label: 'Low Quality', value: 'low' }
    ];
    
    // Create radio buttons for quality options
    for (const option of qualityOptions) {
        const label = document.createElement('label');
        label.htmlFor = option.id;
        label.className = 'quality-option';
        
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'quality';
        input.id = option.id;
        input.value = option.value;
        
        // Set default based on current settings
        if ((settings.lowPerformanceMode && option.value === 'low') ||
            (!settings.lowPerformanceMode && settings.targetFPS === 30 && option.value === 'medium') ||
            (!settings.lowPerformanceMode && settings.targetFPS === 60 && option.value === 'high')) {
            input.checked = true;
        }
        
        // Add event listener
        input.addEventListener('change', () => {
            setQualityLevel(option.value);
        });
        
        const span = document.createElement('span');
        span.textContent = option.label;
        
        label.appendChild(input);
        label.appendChild(span);
        qualitySelector.appendChild(label);
    }
    
    container.appendChild(qualitySelector);
    
    // Add to pause screen
    const pauseScreen = document.getElementById('game-paused');
    if (pauseScreen) {
        // Insert before the resume button
        const resumeButton = document.getElementById('resume-button');
        if (resumeButton && resumeButton.parentNode) {
            resumeButton.parentNode.insertBefore(container, resumeButton);
        } else {
            pauseScreen.appendChild(container);
        }
    }
    
    // Add styles
    addMobileQualityStyles();
}

// Add styles for mobile quality settings
function addMobileQualityStyles() {
    // Check if styles already exist
    if (document.getElementById('mobile-quality-styles')) {
        return;
    }
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'mobile-quality-styles';
    
    // Add CSS
    style.textContent = `
        .mobile-quality-settings {
            background-color: rgba(15, 52, 96, 0.7);
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0 20px;
            max-width: 90%;
            border: 1px solid rgba(76, 201, 240, 0.3);
        }
        
        .quality-selector {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 10px;
        }
        
        .quality-option {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
        }
        
        .quality-option input {
            margin: 0;
        }
        
        body.high-contrast .mobile-quality-settings {
            border-color: var(--highlight);
            background-color: var(--bg-color);
        }
        
        body.larger-text .mobile-quality-settings h3 {
            font-size: 26px;
        }
        
        body.larger-text .quality-option {
            font-size: 18px;
        }
    `;
    
    // Add to document
    document.head.appendChild(style);
}

// Set quality level based on user selection
function setQualityLevel(level) {
    console.log(`Setting quality level to: ${level}`);
    
    switch (level) {
        case 'high':
            settings.lowPerformanceMode = false;
            settings.targetFPS = 60;
            settings.frameTimeLimit = 1000 / settings.targetFPS;
            settings.maxParticles = settings.isMobileDevice ? 50 : 100;
            settings.maxObstacles = 15;
            settings.maxCollectibles = 15;
            break;
        
        case 'medium':
            settings.lowPerformanceMode = false;
            settings.targetFPS = 30;
            settings.frameTimeLimit = 1000 / settings.targetFPS;
            settings.maxParticles = 30;
            settings.maxObstacles = 10;
            settings.maxCollectibles = 10;
            break;
        
        case 'low':
            settings.lowPerformanceMode = true;
            settings.targetFPS = 30;
            settings.frameTimeLimit = 1000 / settings.targetFPS;
            settings.maxParticles = 10;
            settings.maxObstacles = 8;
            settings.maxCollectibles = 8;
            break;
    }
    
    // Reinitialize background layers
    initBackgroundLayers();
    
    // Save preference to localStorage
    try {
        localStorage.setItem('subwaste_quality_level', level);
    } catch (error) {
        console.error('Error saving quality preference:', error);
    }
}

// Update milestone achievements
function updateAchievements() {
    // Check for milestone achievements (every 100 points)
    if (score > 0 && score % 100 === 0) {
        createAchievementCelebration();
    }
    
    // Check for waste collection milestones
    if (wasteCollected > 0 && wasteCollected % 10 === 0) {
        createAchievementCelebration();
    }
}

// Create a major achievement celebration effect
function createAchievementCelebration() {
    // Create a celebration effect at the center of the canvas
    animationManager.createCelebrationEffect(canvas.width / 2, canvas.height / 2);
    
    // Create a fade transition to highlight the achievement
    animationManager.createFadeTransition('out', 500);
}