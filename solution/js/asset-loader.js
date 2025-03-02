/**
 * Asset Loader for Subwaste Surfer
 * Handles preloading of game assets (images, audio) for better performance
 */
class AssetLoader {
    constructor() {
        // Asset storage
        this.images = {};
        this.audios = {};
        this.loadedCount = 0;
        this.totalCount = 0;
        this.isLoading = false;
        this.loadingProgress = 0;
        this.onProgress = null;
        this.onComplete = null;
        
        // Loading display elements
        this.loadingOverlay = null;
        this.progressBar = null;
        this.progressText = null;
        
        // Asset paths
        this.imagePaths = {
            'player': 'solution/images/player.png',
            'background1': 'solution/images/background-layer1.png',
            'background2': 'solution/images/background-layer2.png',
            'background3': 'solution/images/background-layer3.png',
            'plasticWaste': 'solution/images/plastic-waste.png',
            'paperWaste': 'solution/images/paper-waste.png',
            'metalWaste': 'solution/images/metal-waste.png',
            'obstacle': 'solution/images/obstacle.png',
            'powerupSpeed': 'solution/images/powerup-speed.png',
            'powerupMagnet': 'solution/images/powerup-magnet.png',
            'powerupShield': 'solution/images/powerup-shield.png',
        };
        
        // Audio paths - these will be handled by sound-manager.js
        // We're just tracking them here for progress reporting
        this.audioPaths = {
            'background': 'solution/audio/background-music.mp3',
            'collect': 'solution/audio/collect.mp3',
            'jump': 'solution/audio/jump.mp3',
            'crash': 'solution/audio/crash.mp3',
            'gameOver': 'solution/audio/game-over.mp3',
            'powerUp': 'solution/audio/powerup.mp3'
        };
    }
    
    /**
     * Initialize the asset loader
     */
    init() {
        this.createLoadingUI();
    }
    
    /**
     * Create loading UI elements
     */
    createLoadingUI() {
        // Create loading overlay if it doesn't exist
        if (!this.loadingOverlay) {
            this.loadingOverlay = document.createElement('div');
            this.loadingOverlay.id = 'loading-overlay';
            this.loadingOverlay.className = 'loading-overlay';
            
            // Create loading content
            const loadingContent = document.createElement('div');
            loadingContent.className = 'loading-content';
            
            // Create loading title
            const loadingTitle = document.createElement('h2');
            loadingTitle.textContent = 'Loading Game Assets';
            
            // Create progress bar container
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container';
            
            // Create progress bar
            this.progressBar = document.createElement('div');
            this.progressBar.className = 'progress-bar';
            this.progressBar.style.width = '0%';
            
            // Create progress text
            this.progressText = document.createElement('div');
            this.progressText.className = 'progress-text';
            this.progressText.textContent = '0%';
            
            // Create loading tips
            const loadingTip = document.createElement('p');
            loadingTip.className = 'loading-tip';
            loadingTip.textContent = 'Tip: Collect waste quickly to build combo multipliers!';
            
            // Assemble elements
            progressContainer.appendChild(this.progressBar);
            loadingContent.appendChild(loadingTitle);
            loadingContent.appendChild(progressContainer);
            loadingContent.appendChild(this.progressText);
            loadingContent.appendChild(loadingTip);
            this.loadingOverlay.appendChild(loadingContent);
            
            // Add styles
            this.addLoadingStyles();
            
            // Add to document
            document.body.appendChild(this.loadingOverlay);
        }
    }
    
    /**
     * Add loading screen styles
     */
    addLoadingStyles() {
        // Check if styles already exist
        if (document.getElementById('loading-styles')) {
            return;
        }
        
        // Create style element
        const style = document.createElement('style');
        style.id = 'loading-styles';
        
        // Add CSS
        style.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                opacity: 1;
                transition: opacity 0.5s ease;
            }
            
            .loading-overlay.hidden {
                opacity: 0;
                pointer-events: none;
            }
            
            .loading-content {
                text-align: center;
                color: white;
                max-width: 80%;
            }
            
            .loading-content h2 {
                font-size: 28px;
                margin-bottom: 20px;
                color: #4cc9f0;
                text-shadow: 0 0 10px rgba(76, 201, 240, 0.5);
            }
            
            .progress-container {
                height: 20px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                margin-bottom: 10px;
                overflow: hidden;
                border: 1px solid rgba(76, 201, 240, 0.5);
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #4cc9f0, #f72585);
                width: 0%;
                transition: width 0.3s ease;
                border-radius: 10px;
            }
            
            .progress-text {
                font-size: 16px;
                margin-bottom: 30px;
            }
            
            .loading-tip {
                font-style: italic;
                opacity: 0.8;
                font-size: 14px;
                margin-top: 20px;
            }
            
            @media (max-width: 768px) {
                .loading-content h2 {
                    font-size: 24px;
                }
                
                .progress-container {
                    height: 16px;
                }
                
                .progress-text {
                    font-size: 14px;
                }
            }
        `;
        
        // Add to document
        document.head.appendChild(style);
    }
    
    /**
     * Show the loading screen
     */
    showLoadingScreen() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('hidden');
        }
    }
    
    /**
     * Hide the loading screen
     */
    hideLoadingScreen() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
            
            // Remove from DOM after transition
            setTimeout(() => {
                if (this.loadingOverlay && this.loadingOverlay.parentNode) {
                    this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
                    this.loadingOverlay = null;
                }
            }, 500);
        }
    }
    
    /**
     * Update loading progress
     * @param {number} progress - Loading progress (0-100)
     */
    updateProgress(progress) {
        this.loadingProgress = progress;
        
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }
        
        if (this.progressText) {
            this.progressText.textContent = `${Math.round(progress)}%`;
        }
        
        if (this.onProgress) {
            this.onProgress(progress);
        }
    }
    
    /**
     * Load all game assets
     * @param {function} onProgress - Progress callback
     * @param {function} onComplete - Completion callback
     * @returns {Promise} - Promise that resolves when all assets are loaded
     */
    loadAll(onProgress = null, onComplete = null) {
        if (this.isLoading) {
            return Promise.reject('Already loading assets');
        }
        
        this.isLoading = true;
        this.loadedCount = 0;
        this.totalCount = Object.keys(this.imagePaths).length + Object.keys(this.audioPaths).length;
        this.onProgress = onProgress;
        this.onComplete = onComplete;
        
        // Show loading screen
        this.showLoadingScreen();
        
        return Promise.all([
            this.loadImages(),
            // Note: Audio is loaded by sound-manager.js
            // This just simulates loading for progress reporting
            this.simulateAudioLoading()
        ]).then(() => {
            // Hide loading screen
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 500);
            
            this.isLoading = false;
            
            if (this.onComplete) {
                this.onComplete();
            }
            
            return this.images;
        }).catch(error => {
            console.error('Error loading assets:', error);
            this.isLoading = false;
            throw error;
        });
    }
    
    /**
     * Load all images
     * @returns {Promise} - Promise that resolves when all images are loaded
     */
    loadImages() {
        const promises = [];
        
        for (const [key, path] of Object.entries(this.imagePaths)) {
            promises.push(this.loadImage(key, path));
        }
        
        return Promise.all(promises);
    }
    
    /**
     * Load a single image
     * @param {string} key - Image key
     * @param {string} path - Image path
     * @returns {Promise} - Promise that resolves when the image is loaded
     */
    loadImage(key, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.images[key] = img;
                this.loadedCount++;
                this.updateProgress((this.loadedCount / this.totalCount) * 100);
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`Failed to load image: ${path}`);
                // Still increment to avoid blocking loading
                this.loadedCount++;
                this.updateProgress((this.loadedCount / this.totalCount) * 100);
                // Use a placeholder instead
                this.images[key] = this.createPlaceholderImage();
                resolve(this.images[key]);
            };
            
            img.src = path;
        });
    }
    
    /**
     * Create a placeholder image for failed loads
     * @returns {HTMLImageElement} - Placeholder image
     */
    createPlaceholderImage() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Draw placeholder
        ctx.fillStyle = '#ff00ff'; // Magenta for visibility
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Missing', 32, 32);
        
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }
    
    /**
     * Simulate audio loading (actual loading happens in sound-manager.js)
     * @returns {Promise} - Promise that resolves after simulating audio loading
     */
    simulateAudioLoading() {
        return new Promise(resolve => {
            const audioCount = Object.keys(this.audioPaths).length;
            let loaded = 0;
            
            const loadNextAudio = () => {
                if (loaded >= audioCount) {
                    resolve();
                    return;
                }
                
                loaded++;
                this.loadedCount++;
                this.updateProgress((this.loadedCount / this.totalCount) * 100);
                
                // Simulate network delay
                setTimeout(loadNextAudio, 100);
            };
            
            loadNextAudio();
        });
    }
    
    /**
     * Get a loaded image
     * @param {string} key - Image key
     * @returns {HTMLImageElement|null} - The loaded image or null if not found
     */
    getImage(key) {
        return this.images[key] || null;
    }
}

// Create and export instance
const assetLoader = new AssetLoader(); 