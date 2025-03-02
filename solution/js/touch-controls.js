/**
 * touch-controls.js
 * Adds touch-based controls for mobile devices to the Subwaste Surfer game
 * Includes haptic feedback, orientation handling, and improved touch performance
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
        this.isOrientationLandscape = window.innerWidth > window.innerHeight;
        this.controlsVisible = true;
        
        this.initTouchEvents();
        this.handleOrientationChange();
    }
    
    initTouchEvents() {
        // Add touch event listeners to the canvas
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Listen for orientation changes
        window.addEventListener('resize', this.handleOrientationChange.bind(this));
        
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
                this.triggerHapticFeedback("medium");
            }
            this.lastTapTime = now;
        } else if (Math.abs(deltaX) > this.swipeThreshold || Math.abs(deltaY) > this.swipeThreshold) {
            // It's a swipe - determine direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    // Swipe right
                    this.game.movePlayer(1);
                    this.triggerHapticFeedback("light");
                } else {
                    // Swipe left
                    this.game.movePlayer(-1);
                    this.triggerHapticFeedback("light");
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    // Swipe up
                    this.game.jump();
                    this.triggerHapticFeedback("medium");
                } else if (deltaY < -this.swipeThreshold) {
                    // Swipe down - could be used for ducking or special action
                    // this.game.duck(); // Uncomment if game implements ducking
                    this.triggerHapticFeedback("light");
                }
            }
            
            // Check for diagonal swipes (if the game supports diagonal movement)
            if (Math.abs(deltaX) > this.swipeThreshold && Math.abs(deltaY) > this.swipeThreshold) {
                // Diagonal swipe detected
                console.log('Diagonal swipe detected', deltaX, deltaY);
                // Could trigger special moves or combinations
            }
        }
    }
    
    /**
     * Triggers haptic feedback on devices that support it
     * @param {string} intensity - "light", "medium", or "heavy"
     */
    triggerHapticFeedback(intensity = "medium") {
        if (!window.navigator.vibrate) return; // Check if vibration API is supported
        
        switch(intensity) {
            case "light":
                window.navigator.vibrate(10); // 10ms vibration
                break;
            case "medium":
                window.navigator.vibrate(20); // 20ms vibration
                break;
            case "heavy":
                window.navigator.vibrate([30, 20, 30]); // Pattern of vibrations
                break;
            default:
                window.navigator.vibrate(20);
        }
    }
    
    /**
     * Handles orientation changes and adjusts control positions accordingly
     */
    handleOrientationChange() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // Only make changes if orientation actually changed
        if (this.isOrientationLandscape !== isLandscape) {
            this.isOrientationLandscape = isLandscape;
            
            const controlsContainer = document.getElementById('mobile-controls');
            if (controlsContainer) {
                if (isLandscape) {
                    controlsContainer.classList.add('landscape');
                    controlsContainer.classList.remove('portrait');
                } else {
                    controlsContainer.classList.add('portrait');
                    controlsContainer.classList.remove('landscape');
                }
            }
            
            // Force redraw of controls with new positioning
            this.updateControlsVisibility(this.controlsVisible);
        }
    }
    
    /**
     * Show or hide the on-screen controls
     * @param {boolean} visible - Whether controls should be visible
     */
    updateControlsVisibility(visible) {
        this.controlsVisible = visible;
        const controlsContainer = document.getElementById('mobile-controls');
        if (controlsContainer) {
            controlsContainer.style.display = visible ? 'flex' : 'none';
        }
    }
    
    createMobileControlButtons() {
        // Only create mobile controls if they don't already exist
        if (document.getElementById('mobile-controls')) return;
        
        // Create container for mobile control buttons
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'mobile-controls';
        controlsContainer.className = 'mobile-only';
        
        // Add orientation class based on current orientation
        if (this.isOrientationLandscape) {
            controlsContainer.classList.add('landscape');
        } else {
            controlsContainer.classList.add('portrait');
        }
        
        // Create left button
        const leftButton = document.createElement('button');
        leftButton.className = 'mobile-control-button';
        leftButton.id = 'mobile-left';
        leftButton.innerHTML = '&#8592;'; // Left arrow
        leftButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.movePlayer(-1);
            this.triggerHapticFeedback("light");
        });
        
        // Create jump button
        const jumpButton = document.createElement('button');
        jumpButton.className = 'mobile-control-button';
        jumpButton.id = 'mobile-jump';
        jumpButton.innerHTML = '&#8593;'; // Up arrow
        jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.jump();
            this.triggerHapticFeedback("medium");
        });
        
        // Create right button
        const rightButton = document.createElement('button');
        rightButton.className = 'mobile-control-button';
        rightButton.id = 'mobile-right';
        rightButton.innerHTML = '&#8594;'; // Right arrow
        rightButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.movePlayer(1);
            this.triggerHapticFeedback("light");
        });
        
        // Create pause button
        const pauseButton = document.createElement('button');
        pauseButton.className = 'mobile-control-button';
        pauseButton.id = 'mobile-pause';
        pauseButton.innerHTML = '&#10074;&#10074;'; // Pause symbol
        pauseButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.game.togglePause();
            this.triggerHapticFeedback("medium");
        });
        
        // Create toggle controls visibility button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'mobile-control-button toggle-controls';
        toggleButton.id = 'toggle-controls';
        toggleButton.innerHTML = '&#9776;'; // Menu symbol
        toggleButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.controlsVisible = !this.controlsVisible;
            this.updateControlsVisibility(this.controlsVisible);
            this.triggerHapticFeedback("light");
        });
        
        // Append buttons to container
        controlsContainer.appendChild(leftButton);
        controlsContainer.appendChild(jumpButton);
        controlsContainer.appendChild(rightButton);
        controlsContainer.appendChild(pauseButton);
        controlsContainer.appendChild(toggleButton);
        
        // Add to game play screen
        const gamePlayScreen = document.getElementById('game-play');
        gamePlayScreen.appendChild(controlsContainer);
        
        // Add relevant CSS for mobile controls
        this.addMobileControlsStyles();
    }
    
    /**
     * Add CSS styles for the mobile controls
     */
    addMobileControlsStyles() {
        // Only add styles if they don't already exist
        if (document.getElementById('mobile-controls-styles')) return;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'mobile-controls-styles';
        styleSheet.innerHTML = `
            #mobile-controls {
                position: absolute;
                display: flex;
                justify-content: space-between;
                width: 100%;
                bottom: 20px;
                z-index: 1000;
            }
            
            #mobile-controls.landscape {
                flex-direction: row;
                padding: 0 5%;
            }
            
            #mobile-controls.portrait {
                flex-direction: column;
                right: 20px;
                height: 70%;
                width: auto;
                bottom: 15%;
                align-items: flex-end;
            }
            
            .mobile-control-button {
                background-color: rgba(255, 255, 255, 0.3);
                border: 2px solid rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                width: 60px;
                height: 60px;
                font-size: 24px;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 5px;
                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);
                touch-action: manipulation;
            }
            
            .mobile-control-button:active {
                background-color: rgba(255, 255, 255, 0.5);
                transform: scale(0.95);
            }
            
            #mobile-pause, #toggle-controls {
                position: absolute;
                top: 20px;
                width: 50px;
                height: 50px;
            }
            
            #mobile-pause {
                right: 20px;
            }
            
            #toggle-controls {
                left: 20px;
            }
            
            @media (orientation: landscape) {
                .mobile-control-button {
                    width: 50px;
                    height: 50px;
                    font-size: 20px;
                }
                
                #mobile-pause, #toggle-controls {
                    width: 40px;
                    height: 40px;
                }
            }
        `;
        document.head.appendChild(styleSheet);
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