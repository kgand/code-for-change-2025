/**
 * touch-controls.js
 * Adds touch-based controls for mobile devices to the Subwaste Surfer game
 */

class TouchControls {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('game-canvas');
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.swipeThreshold = 30; // Minimum distance to detect a swipe
        this.tapThreshold = 10; // Maximum movement to consider a tap vs a swipe
        this.doubleTapDelay = 300; // Milliseconds allowed between taps for double tap
        this.lastTapTime = 0;
        
        this.initTouchEvents();
    }
    
    initTouchEvents() {
        // Add touch event listeners to the canvas
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Add UI control buttons for mobile
        this.createMobileControlButtons();
        
        console.log('Touch controls initialized');
    }
    
    handleTouchStart(event) {
        if (!this.game.isRunning()) return;
        
        // Prevent default to avoid scrolling
        event.preventDefault();
        
        // Store the initial touch position
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }
    
    handleTouchMove(event) {
        if (!this.game.isRunning()) return;
        event.preventDefault();
    }
    
    handleTouchEnd(event) {
        if (!this.game.isRunning()) return;
        event.preventDefault();
        
        // Get touch end position
        const touch = event.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        
        // Calculate distance moved
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = this.touchStartY - touchEndY; // Inverted for y-axis
        
        // Determine if it was a tap (short movement) or swipe
        const totalMovement = Math.abs(deltaX) + Math.abs(deltaY);
        
        if (totalMovement <= this.tapThreshold) {
            // It's a tap - check for double tap
            const now = Date.now();
            if (now - this.lastTapTime < this.doubleTapDelay) {
                // Double tap detected - pause the game
                this.game.togglePause();
            }
            this.lastTapTime = now;
        } else if (Math.abs(deltaX) > this.swipeThreshold || Math.abs(deltaY) > this.swipeThreshold) {
            // It's a swipe - determine direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    // Swipe right
                    this.game.movePlayer(1);
                } else {
                    // Swipe left
                    this.game.movePlayer(-1);
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    // Swipe up
                    this.game.jump();
                }
                // We don't use swipe down for anything currently
            }
        }
    }
    
    createMobileControlButtons() {
        // Only create mobile controls if they don't already exist
        if (document.getElementById('mobile-controls')) return;
        
        // Create container for mobile control buttons
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'mobile-controls';
        controlsContainer.className = 'mobile-only';
        
        // Create left button
        const leftButton = document.createElement('button');
        leftButton.className = 'mobile-control-button';
        leftButton.id = 'mobile-left';
        leftButton.innerHTML = '&#8592;'; // Left arrow
        leftButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.movePlayer(-1);
        });
        
        // Create jump button
        const jumpButton = document.createElement('button');
        jumpButton.className = 'mobile-control-button';
        jumpButton.id = 'mobile-jump';
        jumpButton.innerHTML = '&#8593;'; // Up arrow
        jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.jump();
        });
        
        // Create right button
        const rightButton = document.createElement('button');
        rightButton.className = 'mobile-control-button';
        rightButton.id = 'mobile-right';
        rightButton.innerHTML = '&#8594;'; // Right arrow
        rightButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.movePlayer(1);
        });
        
        // Append buttons to container
        controlsContainer.appendChild(leftButton);
        controlsContainer.appendChild(jumpButton);
        controlsContainer.appendChild(rightButton);
        
        // Add to game play screen
        const gamePlayScreen = document.getElementById('game-play');
        gamePlayScreen.appendChild(controlsContainer);
    }
    
    // Method to check if the device is touch-enabled
    static isTouchDevice() {
        return ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) || 
               (navigator.msMaxTouchPoints > 0);
    }
}

// Export for use in game.js
window.TouchControls = TouchControls; 