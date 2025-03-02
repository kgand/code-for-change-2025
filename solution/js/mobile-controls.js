// Subwaste Surfer - Mobile Controls

/**
 * Mobile Controls for Subwaste Surfer
 * Handles touch events and provides mobile-friendly controls
 */

class MobileControls {
    constructor(game) {
        // Store reference to game object
        this.game = game;
        
        // Control elements
        this.controlsContainer = null;
        this.leftButton = null;
        this.rightButton = null;
        this.jumpButton = null;
        this.pauseButton = null;
        
        // Touch state
        this.touchActive = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.swipeThreshold = 50; // Minimum distance for swipe detection
        
        // Device detection
        this.isMobileDevice = this.detectMobileDevice();
    }
    
    /**
     * Detect if the user is on a mobile device
     * @returns {boolean} True if mobile device detected
     */
    detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.innerWidth <= 800 && window.innerHeight <= 600);
    }
    
    /**
     * Initialize mobile controls
     */
    init() {
        // Only initialize on mobile devices
        if (!this.isMobileDevice) return;
        
        // Create mobile controls container
        this.createControlElements();
        
        // Add touch event listeners to the game canvas
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
            canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
            canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        }
        
        // Add orientation change listener
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
        
        console.log('Mobile controls initialized');
    }
    
    /**
     * Create mobile control elements
     */
    createControlElements() {
        // Create container for mobile controls
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.id = 'mobile-controls';
        this.controlsContainer.className = 'mobile-controls';
        
        // Create directional buttons
        this.leftButton = this.createButton('left-button', '←', this.handleLeftButton.bind(this));
        this.rightButton = this.createButton('right-button', '→', this.handleRightButton.bind(this));
        
        // Create jump button
        this.jumpButton = this.createButton('jump-button', '↑', this.handleJumpButton.bind(this));
        
        // Create pause button
        this.pauseButton = this.createButton('mobile-pause-button', '⏸️', this.handlePauseButton.bind(this));
        
        // Add buttons to container
        const directionalContainer = document.createElement('div');
        directionalContainer.className = 'directional-controls';
        directionalContainer.appendChild(this.leftButton);
        directionalContainer.appendChild(this.rightButton);
        
        this.controlsContainer.appendChild(directionalContainer);
        this.controlsContainer.appendChild(this.jumpButton);
        this.controlsContainer.appendChild(this.pauseButton);
        
        // Add container to game play screen
        const gamePlayScreen = document.getElementById('game-play');
        if (gamePlayScreen) {
            gamePlayScreen.appendChild(this.controlsContainer);
        }
    }
    
    /**
     * Create a control button
     * @param {string} id - Button ID
     * @param {string} text - Button text
     * @param {function} handler - Click handler
     * @returns {HTMLElement} Button element
     */
    createButton(id, text, handler) {
        const button = document.createElement('button');
        button.id = id;
        button.className = 'mobile-control-button';
        button.textContent = text;
        
        // Add event listeners for both touch and click
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handler();
        });
        
        button.addEventListener('click', handler);
        
        return button;
    }
    
    /**
     * Handle left button press
     */
    handleLeftButton() {
        if (this.game && this.game.player && this.game.player.lane > 0) {
            this.game.player.lane--;
        }
    }
    
    /**
     * Handle right button press
     */
    handleRightButton() {
        if (this.game && this.game.player && this.game.player.lane < this.game.settings.lanes - 1) {
            this.game.player.lane++;
        }
    }
    
    /**
     * Handle jump button press
     */
    handleJumpButton() {
        if (this.game && this.game.player && !this.game.player.isJumping) {
            this.game.player.velocityY = this.game.settings.jumpForce;
            this.game.player.isJumping = true;
            
            // Play jump sound if available
            if (typeof soundManager !== 'undefined') {
                soundManager.play('jump');
            }
        }
    }
    
    /**
     * Handle pause button press
     */
    handlePauseButton() {
        if (this.game) {
            if (this.game.gameActive && !this.game.gamePaused) {
                this.game.pauseGame();
            } else if (this.game.gameActive && this.game.gamePaused) {
                this.game.resumeGame();
            }
        }
    }
    
    /**
     * Handle touch start event
     * @param {TouchEvent} event - Touch event
     */
    handleTouchStart(event) {
        if (!this.game || !this.game.gameActive || this.game.gamePaused) return;
        
        this.touchActive = true;
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
    }
    
    /**
     * Handle touch move event
     * @param {TouchEvent} event - Touch event
     */
    handleTouchMove(event) {
        if (!this.touchActive || !this.game || !this.game.gameActive || this.game.gamePaused) return;
        
        const touchX = event.touches[0].clientX;
        const touchY = event.touches[0].clientY;
        
        const deltaX = touchX - this.touchStartX;
        const deltaY = touchY - this.touchStartY;
        
        // Detect horizontal swipe
        if (Math.abs(deltaX) > this.swipeThreshold) {
            if (deltaX > 0 && this.game.player.lane < this.game.settings.lanes - 1) {
                // Swipe right
                this.game.player.lane++;
            } else if (deltaX < 0 && this.game.player.lane > 0) {
                // Swipe left
                this.game.player.lane--;
            }
            
            // Reset touch start to allow for multiple swipes
            this.touchStartX = touchX;
        }
        
        // Detect vertical swipe up (jump)
        if (deltaY < -this.swipeThreshold && !this.game.player.isJumping) {
            this.game.player.velocityY = this.game.settings.jumpForce;
            this.game.player.isJumping = true;
            
            // Play jump sound if available
            if (typeof soundManager !== 'undefined') {
                soundManager.play('jump');
            }
            
            // Reset touch start to prevent multiple jumps
            this.touchStartY = touchY;
        }
    }
    
    /**
     * Handle touch end event
     */
    handleTouchEnd() {
        this.touchActive = false;
    }
    
    /**
     * Handle orientation change
     */
    handleOrientationChange() {
        // Adjust controls based on orientation
        setTimeout(() => {
            const isLandscape = window.innerWidth > window.innerHeight;
            
            if (this.controlsContainer) {
                if (isLandscape) {
                    this.controlsContainer.classList.add('landscape');
                    this.controlsContainer.classList.remove('portrait');
                } else {
                    this.controlsContainer.classList.add('portrait');
                    this.controlsContainer.classList.remove('landscape');
                }
            }
        }, 300); // Small delay to ensure orientation has completed
    }
    
    /**
     * Show mobile controls
     */
    show() {
        if (this.controlsContainer) {
            this.controlsContainer.style.display = 'flex';
        }
    }
    
    /**
     * Hide mobile controls
     */
    hide() {
        if (this.controlsContainer) {
            this.controlsContainer.style.display = 'none';
        }
    }
}

// Export the mobile controls
const mobileControls = new MobileControls(window.game); 