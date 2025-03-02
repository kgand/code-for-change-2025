// Subwaste Surfer - Sound Manager

/**
 * Sound Manager for Subwaste Surfer
 * Handles loading, playing, and controlling all game audio
 * Features:
 * - Environmental sounds based on waste type
 * - Spatial audio for immersive experience
 * - Dynamic audio mixing
 * - Audio compression for mobile devices
 * - Accessibility features for hearing impaired
 */

class SoundManager {
    constructor() {
        // Initialize audio context
        this.initAudioContext();
        
        // Sound paths
        this.soundPaths = {
            // Basic game sounds
            jump: 'assets/sounds/jump.mp3',
            collect: 'assets/sounds/collect.mp3',
            crash: 'assets/sounds/crash.mp3',
            gameOver: 'assets/sounds/game-over.mp3',
            backgroundMusic: 'assets/sounds/background-music.mp3',
            powerUp: 'assets/sounds/power-up.mp3',
            move: 'assets/sounds/move.mp3',
            
            // Environmental sounds
            ocean: 'assets/sounds/environment/ocean.mp3',
            beach: 'assets/sounds/environment/beach.mp3',
            seagulls: 'assets/sounds/environment/seagulls.mp3',
            wind: 'assets/sounds/environment/wind.mp3',
            
            // Waste type sounds
            plastic: 'assets/sounds/waste/plastic.mp3',
            glass: 'assets/sounds/waste/glass.mp3',
            paper: 'assets/sounds/waste/paper.mp3',
            metal: 'assets/sounds/waste/metal.mp3',
            organic: 'assets/sounds/waste/organic.mp3',
            
            // UI sounds
            buttonClick: 'assets/sounds/ui/button-click.mp3',
            menuOpen: 'assets/sounds/ui/menu-open.mp3',
            menuClose: 'assets/sounds/ui/menu-close.mp3',
            notification: 'assets/sounds/ui/notification.mp3'
        };
        
        // Initialize sound objects
        this.sounds = {};
        this.audioBuffers = {};
        this.audioSources = {};
        
        // Audio nodes for processing
        this.gainNodes = {};
        this.pannerNodes = {};
        this.compressor = null;
        
        // Sound state
        this.muted = false;
        this.musicEnabled = true;
        this.soundEffectsEnabled = true;
        this.environmentalSoundsEnabled = true;
        this.spatialAudioEnabled = true;
        
        // Volume levels (0-1)
        this.volumes = {
            master: 0.8,
            music: 0.5,
            effects: 0.7,
            environmental: 0.4,
            ui: 0.6
        };
        
        // Create audio groups
        this.audioGroups = {
            music: ['backgroundMusic'],
            effects: ['jump', 'collect', 'crash', 'gameOver', 'powerUp', 'move'],
            environmental: ['ocean', 'beach', 'seagulls', 'wind', 'plastic', 'glass', 'paper', 'metal', 'organic'],
            ui: ['buttonClick', 'menuOpen', 'menuClose', 'notification']
        };
        
        // Setup audio processing
        this.setupAudioProcessing();
        
        // Load default sounds
        this.loadDefaultSounds();
    }
    
    /**
     * Initialize Web Audio API context
     */
    initAudioContext() {
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volumes.master;
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('Audio context initialized');
        } catch (error) {
            console.error('Web Audio API not supported:', error);
            // Fallback to basic Audio elements
            this.audioContext = null;
        }
    }
    
    /**
     * Setup audio processing nodes
     */
    setupAudioProcessing() {
        if (!this.audioContext) return;
        
        // Create compressor for dynamic range compression
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;
        this.compressor.connect(this.masterGain);
        
        // Create group gain nodes
        const groups = ['music', 'effects', 'environmental', 'ui'];
        groups.forEach(group => {
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = this.volumes[group];
            gainNode.connect(this.compressor);
            this.gainNodes[group] = gainNode;
        });
    }
    
    /**
     * Load default sounds needed for basic gameplay
     */
    loadDefaultSounds() {
        // Basic sounds needed for immediate gameplay
        const essentialSounds = ['jump', 'collect', 'crash', 'gameOver', 'backgroundMusic', 'buttonClick'];
        
        essentialSounds.forEach(sound => {
            this.loadSound(sound);
        });
    }
    
    /**
     * Load a specific sound
     * @param {string} soundName - Name of the sound to load
     * @returns {Promise} Promise that resolves when the sound is loaded
     */
    loadSound(soundName) {
        const path = this.soundPaths[soundName];
        if (!path) {
            console.warn(`Sound path not found for: ${soundName}`);
            return Promise.reject(new Error(`Sound path not found for: ${soundName}`));
        }
        
        if (this.audioContext) {
            // Use Web Audio API
            return fetch(path)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    this.audioBuffers[soundName] = audioBuffer;
                    console.log(`Loaded sound: ${soundName}`);
                    return audioBuffer;
                })
                .catch(error => {
                    console.error(`Error loading sound ${soundName}:`, error);
                    // Fallback to Audio element
                    this.loadFallbackSound(soundName, path);
                });
        } else {
            // Fallback to Audio element
            return this.loadFallbackSound(soundName, path);
        }
    }
    
    /**
     * Load a sound using the Audio element (fallback)
     * @param {string} soundName - Name of the sound
     * @param {string} path - Path to the sound file
     * @returns {Promise} Promise that resolves when the sound is loaded
     */
    loadFallbackSound(soundName, path) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(path);
            
            // Configure sound properties
            if (soundName === 'backgroundMusic') {
                audio.loop = true;
                audio.volume = this.volumes.music;
            } else {
                audio.volume = this.getVolumeForSound(soundName);
            }
            
            audio.addEventListener('canplaythrough', () => {
                this.sounds[soundName] = audio;
                console.log(`Loaded fallback sound: ${soundName}`);
                resolve(audio);
            }, { once: true });
            
            audio.addEventListener('error', (error) => {
                console.error(`Error loading fallback sound ${soundName}:`, error);
                reject(error);
            }, { once: true });
            
            audio.load();
        });
    }
    
    /**
     * Get the appropriate volume for a sound based on its group
     * @param {string} soundName - Name of the sound
     * @returns {number} Volume level (0-1)
     */
    getVolumeForSound(soundName) {
        // Find which group the sound belongs to
        for (const [group, sounds] of Object.entries(this.audioGroups)) {
            if (sounds.includes(soundName)) {
                return this.volumes[group];
            }
        }
        return this.volumes.effects; // Default to effects volume
    }
    
    /**
     * Preload all sound assets
     * @returns {Promise} Promise that resolves when all sounds are loaded
     */
    preloadSounds() {
        const soundNames = Object.keys(this.soundPaths);
        const loadPromises = soundNames.map(soundName => this.loadSound(soundName));
        
        return Promise.all(loadPromises);
    }
    
    /**
     * Play a sound effect with optional spatial positioning
     * @param {string} soundName - Name of the sound to play
     * @param {Object} options - Options for playing the sound
     * @param {number} options.x - X position for spatial audio (-1 to 1)
     * @param {number} options.y - Y position for spatial audio (-1 to 1)
     * @param {number} options.volume - Volume override (0-1)
     * @param {boolean} options.loop - Whether the sound should loop
     */
    play(soundName, options = {}) {
        // Check if sound should be played
        if (this.muted) return;
        
        // Check if the sound belongs to a disabled group
        if (!this.soundEffectsEnabled && this.audioGroups.effects.includes(soundName)) return;
        if (!this.environmentalSoundsEnabled && this.audioGroups.environmental.includes(soundName)) return;
        if (!this.musicEnabled && this.audioGroups.music.includes(soundName)) return;
        
        // Default options
        const defaultOptions = {
            x: 0,
            y: 0,
            volume: null,
            loop: false
        };
        
        const playOptions = { ...defaultOptions, ...options };
        
        if (this.audioContext && this.audioBuffers[soundName]) {
            this.playWithWebAudio(soundName, playOptions);
        } else if (this.sounds[soundName]) {
            this.playWithAudioElement(soundName, playOptions);
        } else {
            // Sound not loaded yet, try to load it first
            this.loadSound(soundName)
                .then(() => this.play(soundName, options))
                .catch(error => console.warn(`Could not play sound ${soundName}:`, error));
        }
    }
    
    /**
     * Play a sound using Web Audio API
     * @param {string} soundName - Name of the sound
     * @param {Object} options - Playback options
     */
    playWithWebAudio(soundName, options) {
        // Stop previous instance of this sound if it exists
        if (this.audioSources[soundName]) {
            try {
                this.audioSources[soundName].stop();
            } catch (e) {
                // Ignore errors from already stopped sources
            }
        }
        
        // Create source node
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers[soundName];
        source.loop = options.loop;
        
        // Create gain node for this specific sound
        const gainNode = this.audioContext.createGain();
        const volume = options.volume !== null ? options.volume : this.getVolumeForSound(soundName);
        gainNode.gain.value = volume;
        
        // Determine which group gain node to connect to
        let groupGainNode = this.gainNodes.effects; // Default
        for (const [group, sounds] of Object.entries(this.audioGroups)) {
            if (sounds.includes(soundName)) {
                groupGainNode = this.gainNodes[group];
                break;
            }
        }
        
        // Apply spatial audio if enabled
        if (this.spatialAudioEnabled && (options.x !== 0 || options.y !== 0)) {
            const panner = this.audioContext.createPanner();
            panner.panningModel = 'equalpower'; // Simple stereo panning
            panner.setPosition(options.x, options.y, 0);
            
            // Connect nodes: source -> gain -> panner -> group gain -> compressor -> master
            source.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(groupGainNode);
            
            // Store panner node
            this.pannerNodes[soundName] = panner;
        } else {
            // Connect nodes: source -> gain -> group gain -> compressor -> master
            source.connect(gainNode);
            gainNode.connect(groupGainNode);
        }
        
        // Store source and start playback
        this.audioSources[soundName] = source;
        source.start(0);
        
        // Clean up when playback ends
        source.onended = () => {
            delete this.audioSources[soundName];
            delete this.pannerNodes[soundName];
        };
    }
    
    /**
     * Play a sound using Audio element (fallback)
     * @param {string} soundName - Name of the sound
     * @param {Object} options - Playback options
     */
    playWithAudioElement(soundName, options) {
        const sound = this.sounds[soundName];
        
        // Set volume if specified
        if (options.volume !== null) {
            sound.volume = options.volume;
        }
        
        // Set loop state
        sound.loop = options.loop;
        
        // Reset the sound to the beginning if it's already playing
        sound.currentTime = 0;
        
        // Apply basic stereo panning if supported
        if (this.spatialAudioEnabled && 'StereoPannerNode' in window) {
            // This is a very basic approximation of spatial audio
            // Real implementation would use the Web Audio API
            sound.preservesPitch = false; // For pitch effects if supported
            
            // Simple left/right panning based on x value
            if (options.x < 0) {
                sound.volume = sound.volume * (1 + options.x * 0.5); // Reduce volume slightly for left pan
            } else if (options.x > 0) {
                sound.volume = sound.volume * (1 - options.x * 0.5); // Reduce volume slightly for right pan
            }
        }
        
        // Play the sound
        sound.play().catch(error => {
            console.warn(`Error playing sound ${soundName}:`, error);
        });
    }
    
    /**
     * Play environmental sounds based on the current game state
     * @param {string} environment - Current environment ('beach', 'ocean', etc.)
     * @param {number} intensity - Intensity level (0-1)
     */
    playEnvironmentalSounds(environment, intensity = 0.5) {
        if (!this.environmentalSoundsEnabled || this.muted) return;
        
        // Map of environments to sounds
        const environmentSounds = {
            beach: ['beach', 'seagulls'],
            ocean: ['ocean', 'wind'],
            underwater: ['ocean']
        };
        
        // Get sounds for the current environment
        const sounds = environmentSounds[environment] || [];
        
        // Play each environmental sound
        sounds.forEach(soundName => {
            // Adjust volume based on intensity
            const volume = this.volumes.environmental * intensity;
            
            // Play with looping enabled
            this.play(soundName, { volume, loop: true });
        });
    }
    
    /**
     * Play a sound effect for a specific waste type
     * @param {string} wasteType - Type of waste ('plastic', 'glass', etc.)
     */
    playWasteSound(wasteType) {
        if (!this.environmentalSoundsEnabled || this.muted) return;
        
        // Play the waste-specific sound if available
        if (this.soundPaths[wasteType]) {
            this.play(wasteType);
        } else {
            // Fallback to generic collect sound
            this.play('collect');
        }
    }
    
    /**
     * Start playing background music
     */
    startBackgroundMusic() {
        if (this.muted || !this.musicEnabled) return;
        
        this.play('backgroundMusic', { loop: true });
    }
    
    /**
     * Pause background music
     */
    pauseBackgroundMusic() {
        if (this.audioContext && this.audioSources.backgroundMusic) {
            this.audioSources.backgroundMusic.stop();
        } else if (this.sounds.backgroundMusic) {
            this.sounds.backgroundMusic.pause();
        }
    }
    
    /**
     * Resume background music
     */
    resumeBackgroundMusic() {
        if (this.muted || !this.musicEnabled) return;
        
        if (this.audioContext) {
            // If using Web Audio API, we need to create a new source
            this.play('backgroundMusic', { loop: true });
        } else if (this.sounds.backgroundMusic) {
            // If using Audio element, we can just resume
            this.sounds.backgroundMusic.play().catch(error => {
                console.warn('Error resuming background music:', error);
            });
        }
    }
    
    /**
     * Play a UI sound
     * @param {string} soundName - Name of the UI sound ('buttonClick', 'menuOpen', etc.)
     */
    playUISound(soundName) {
        if (this.muted) return;
        
        // Check if it's a valid UI sound
        if (this.audioGroups.ui.includes(soundName)) {
            this.play(soundName);
        }
    }
    
    /**
     * Set volume for a specific audio group
     * @param {string} group - Audio group ('master', 'music', 'effects', 'environmental', 'ui')
     * @param {number} level - Volume level (0-1)
     */
    setVolume(group, level) {
        // Ensure level is between 0 and 1
        level = Math.max(0, Math.min(1, level));
        
        // Update volume setting
        this.volumes[group] = level;
        
        // Update gain node if available
        if (this.audioContext) {
            if (group === 'master') {
                this.masterGain.gain.value = level;
            } else if (this.gainNodes[group]) {
                this.gainNodes[group].gain.value = level;
            }
        } else {
            // Update Audio elements
            Object.keys(this.sounds).forEach(soundName => {
                if (group === 'master' || this.audioGroups[group]?.includes(soundName)) {
                    const baseVolume = group === 'master' ? this.getVolumeForSound(soundName) : this.volumes[group];
                    this.sounds[soundName].volume = group === 'master' ? baseVolume * level : baseVolume;
                }
            });
        }
    }
    
    /**
     * Toggle mute state for all sounds
     * @returns {boolean} New mute state
     */
    toggleMute() {
        this.muted = !this.muted;
        
        if (this.audioContext) {
            // Using Web Audio API
            this.masterGain.gain.value = this.muted ? 0 : this.volumes.master;
            
            // Stop all currently playing sounds if muted
            if (this.muted) {
                Object.values(this.audioSources).forEach(source => {
                    try {
                        source.stop();
                    } catch (e) {
                        // Ignore errors from already stopped sources
                    }
                });
                this.audioSources = {};
            } else {
                // Resume background music if it was playing
                if (this.musicEnabled) {
                    this.startBackgroundMusic();
                }
            }
        } else {
            // Using Audio elements
            Object.values(this.sounds).forEach(sound => {
                sound.muted = this.muted;
                
                // Pause all sounds if muted
                if (this.muted && !sound.paused) {
                    sound.pause();
                }
            });
            
            // Resume background music if unmuting
            if (!this.muted && this.musicEnabled) {
                this.resumeBackgroundMusic();
            }
        }
        
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
    
    /**
     * Toggle environmental sounds
     * @returns {boolean} New environmental sounds enabled state
     */
    toggleEnvironmentalSounds() {
        this.environmentalSoundsEnabled = !this.environmentalSoundsEnabled;
        
        // Stop all environmental sounds if disabled
        if (!this.environmentalSoundsEnabled) {
            this.audioGroups.environmental.forEach(soundName => {
                if (this.audioSources[soundName]) {
                    try {
                        this.audioSources[soundName].stop();
                    } catch (e) {
                        // Ignore errors from already stopped sources
                    }
                    delete this.audioSources[soundName];
                } else if (this.sounds[soundName] && !this.sounds[soundName].paused) {
                    this.sounds[soundName].pause();
                }
            });
        }
        
        return this.environmentalSoundsEnabled;
    }
    
    /**
     * Toggle spatial audio
     * @returns {boolean} New spatial audio enabled state
     */
    toggleSpatialAudio() {
        this.spatialAudioEnabled = !this.spatialAudioEnabled;
        return this.spatialAudioEnabled;
    }
    
    /**
     * Clean up and release resources
     */
    dispose() {
        // Stop all sounds
        if (this.audioContext) {
            Object.values(this.audioSources).forEach(source => {
                try {
                    source.stop();
                } catch (e) {
                    // Ignore errors from already stopped sources
                }
            });
            
            // Close audio context
            if (this.audioContext.state !== 'closed') {
                this.audioContext.close();
            }
        } else {
            Object.values(this.sounds).forEach(sound => {
                sound.pause();
                sound.src = '';
            });
        }
        
        // Clear references
        this.audioSources = {};
        this.pannerNodes = {};
        this.sounds = {};
        this.audioBuffers = {};
    }
}

// Export the sound manager
const soundManager = new SoundManager(); 