// Subwaste Surfer - Sound Manager

/**
 * Sound Manager for Subwaste Surfer
 * Handles loading, playing, and controlling all game audio
 */

class SoundManager {
    constructor() {
        // Initialize sound objects
        this.sounds = {
            jump: new Audio('assets/sounds/jump.mp3'),
            collect: new Audio('assets/sounds/collect.mp3'),
            crash: new Audio('assets/sounds/crash.mp3'),
            gameOver: new Audio('assets/sounds/game-over.mp3'),
            backgroundMusic: new Audio('assets/sounds/background-music.mp3'),
            powerUp: new Audio('assets/sounds/power-up.mp3'),
            move: new Audio('assets/sounds/move.mp3')
        };
        
        // Configure sound properties
        this.sounds.backgroundMusic.loop = true;
        this.sounds.backgroundMusic.volume = 0.5;
        
        // Sound state
        this.muted = false;
        this.musicEnabled = true;
        this.soundEffectsEnabled = true;
    }
    
    /**
     * Preload all sound assets
     * @returns {Promise} Promise that resolves when all sounds are loaded
     */
    preloadSounds() {
        const loadPromises = Object.values(this.sounds).map(sound => {
            return new Promise((resolve, reject) => {
                sound.addEventListener('canplaythrough', resolve, { once: true });
                sound.addEventListener('error', reject, { once: true });
                sound.load();
            });
        });
        
        return Promise.all(loadPromises);
    }
    
    /**
     * Play a sound effect
     * @param {string} soundName - Name of the sound to play
     */
    play(soundName) {
        if (this.muted || !this.soundEffectsEnabled) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            // Reset the sound to the beginning if it's already playing
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.warn(`Error playing sound ${soundName}:`, error);
            });
        }
    }
    
    /**
     * Start playing background music
     */
    startBackgroundMusic() {
        if (this.muted || !this.musicEnabled) return;
        
        this.sounds.backgroundMusic.play().catch(error => {
            console.warn('Error playing background music:', error);
        });
    }
    
    /**
     * Pause background music
     */
    pauseBackgroundMusic() {
        this.sounds.backgroundMusic.pause();
    }
    
    /**
     * Resume background music
     */
    resumeBackgroundMusic() {
        if (this.muted || !this.musicEnabled) return;
        
        this.sounds.backgroundMusic.play().catch(error => {
            console.warn('Error resuming background music:', error);
        });
    }
    
    /**
     * Toggle mute state for all sounds
     * @returns {boolean} New mute state
     */
    toggleMute() {
        this.muted = !this.muted;
        
        Object.values(this.sounds).forEach(sound => {
            sound.muted = this.muted;
        });
        
        return this.muted;
    }
    
    /**
     * Toggle background music
     * @returns {boolean} New music enabled state
     */
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        
        if (this.musicEnabled) {
            this.resumeBackgroundMusic();
        } else {
            this.pauseBackgroundMusic();
        }
        
        return this.musicEnabled;
    }
    
    /**
     * Toggle sound effects
     * @returns {boolean} New sound effects enabled state
     */
    toggleSoundEffects() {
        this.soundEffectsEnabled = !this.soundEffectsEnabled;
        return this.soundEffectsEnabled;
    }
}

// Export the sound manager
const soundManager = new SoundManager(); 