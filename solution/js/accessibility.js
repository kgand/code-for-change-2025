/**
 * Accessibility Manager for Subwaste Surfer game
 * Handles accessibility features including:
 * - Keyboard navigation
 * - Screen reader support
 * - High contrast mode
 * - Color blindness modes
 * - Larger text mode
 * - Reduced motion mode
 * - Focus management
 * - Text-to-Speech announcements
 */
class AccessibilityManager {
    constructor() {
        // DOM Elements
        this.highContrastButton = document.getElementById('high-contrast-toggle');
        this.largerTextButton = document.getElementById('larger-text-toggle');
        this.screenReaderInfoButton = document.getElementById('screen-reader-info');
        this.a11yDialog = document.getElementById('a11y-dialog');
        this.closeDialogButton = document.getElementById('close-a11y-dialog');
        this.gameAnnouncer = document.getElementById('game-announcer');
        
        // Create additional accessibility controls if they don't exist
        this.createAdditionalControls();
        
        // User preferences
        this.preferences = {
            highContrast: false,
            largerText: false,
            focusTrap: false,
            colorBlindMode: 'none', // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
            reducedMotion: false,
            textToSpeech: false,
            keyboardHelpers: true
        };
        
        // Track active keyboard shortcuts
        this.activeShortcuts = new Set();
        
        // Initialize
        this.loadPreferences();
        this.setupEventListeners();
        this.applyPreferences();
    }
    
    /**
     * Create additional accessibility controls if they don't exist
     */
    createAdditionalControls() {
        // Create color blindness mode selector if it doesn't exist
        if (!document.getElementById('colorblind-mode-selector')) {
            const settingsContainer = document.querySelector('.settings-container');
            if (settingsContainer) {
                // Create color blindness section
                const colorBlindSection = document.createElement('div');
                colorBlindSection.className = 'settings-section';
                
                const colorBlindLabel = document.createElement('label');
                colorBlindLabel.textContent = 'Color Blindness Mode:';
                colorBlindLabel.setAttribute('for', 'colorblind-mode-selector');
                
                const colorBlindSelect = document.createElement('select');
                colorBlindSelect.id = 'colorblind-mode-selector';
                colorBlindSelect.setAttribute('aria-label', 'Select color blindness mode');
                
                // Add options
                const options = [
                    { value: 'none', text: 'None' },
                    { value: 'protanopia', text: 'Protanopia (Red-Blind)' },
                    { value: 'deuteranopia', text: 'Deuteranopia (Green-Blind)' },
                    { value: 'tritanopia', text: 'Tritanopia (Blue-Blind)' }
                ];
                
                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    colorBlindSelect.appendChild(option);
                });
                
                // Create reduced motion toggle
                const reducedMotionContainer = document.createElement('div');
                reducedMotionContainer.className = 'settings-option';
                
                const reducedMotionButton = document.createElement('button');
                reducedMotionButton.id = 'reduced-motion-toggle';
                reducedMotionButton.className = 'toggle-button';
                reducedMotionButton.setAttribute('aria-pressed', 'false');
                reducedMotionButton.textContent = 'Reduced Motion';
                
                const textToSpeechContainer = document.createElement('div');
                textToSpeechContainer.className = 'settings-option';
                
                const textToSpeechButton = document.createElement('button');
                textToSpeechButton.id = 'text-to-speech-toggle';
                textToSpeechButton.className = 'toggle-button';
                textToSpeechButton.setAttribute('aria-pressed', 'false');
                textToSpeechButton.textContent = 'Text to Speech';
                
                // Add elements to DOM
                colorBlindSection.appendChild(colorBlindLabel);
                colorBlindSection.appendChild(colorBlindSelect);
                settingsContainer.appendChild(colorBlindSection);
                
                reducedMotionContainer.appendChild(reducedMotionButton);
                settingsContainer.appendChild(reducedMotionContainer);
                
                textToSpeechContainer.appendChild(textToSpeechButton);
                settingsContainer.appendChild(textToSpeechContainer);
                
                // Store references
                this.colorBlindSelect = colorBlindSelect;
                this.reducedMotionButton = reducedMotionButton;
                this.textToSpeechButton = textToSpeechButton;
            }
        } else {
            // Get references to existing elements
            this.colorBlindSelect = document.getElementById('colorblind-mode-selector');
            this.reducedMotionButton = document.getElementById('reduced-motion-toggle');
            this.textToSpeechButton = document.getElementById('text-to-speech-toggle');
        }
        
        // Create keyboard shortcut display if it doesn't exist
        if (!document.getElementById('keyboard-shortcuts-display')) {
            const gamePlayScreen = document.getElementById('game-play');
            if (gamePlayScreen) {
                const shortcutsDisplay = document.createElement('div');
                shortcutsDisplay.id = 'keyboard-shortcuts-display';
                shortcutsDisplay.className = 'keyboard-shortcuts-display hidden';
                shortcutsDisplay.setAttribute('role', 'status');
                shortcutsDisplay.setAttribute('aria-live', 'polite');
                
                gamePlayScreen.appendChild(shortcutsDisplay);
                this.shortcutsDisplay = shortcutsDisplay;
            }
        } else {
            this.shortcutsDisplay = document.getElementById('keyboard-shortcuts-display');
        }
    }
    
    /**
     * Load user preferences from localStorage
     */
    loadPreferences() {
        try {
            const savedPrefs = localStorage.getItem('subwaste_a11y_prefs');
            if (savedPrefs) {
                this.preferences = { ...this.preferences, ...JSON.parse(savedPrefs) };
                
                // Update button states
                if (this.preferences.highContrast) {
                    this.highContrastButton.setAttribute('aria-pressed', 'true');
                }
                
                if (this.preferences.largerText) {
                    this.largerTextButton.setAttribute('aria-pressed', 'true');
                }
                
                if (this.reducedMotionButton && this.preferences.reducedMotion) {
                    this.reducedMotionButton.setAttribute('aria-pressed', 'true');
                }
                
                if (this.textToSpeechButton && this.preferences.textToSpeech) {
                    this.textToSpeechButton.setAttribute('aria-pressed', 'true');
                }
                
                if (this.colorBlindSelect) {
                    this.colorBlindSelect.value = this.preferences.colorBlindMode;
                }
            }
        } catch (error) {
            console.error('Error loading accessibility preferences:', error);
        }
    }
    
    /**
     * Save user preferences to localStorage
     */
    savePreferences() {
        try {
            localStorage.setItem('subwaste_a11y_prefs', JSON.stringify(this.preferences));
        } catch (error) {
            console.error('Error saving accessibility preferences:', error);
        }
    }
    
    /**
     * Apply current preferences to the game
     */
    applyPreferences() {
        // High contrast mode
        if (this.preferences.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        
        // Larger text mode
        if (this.preferences.largerText) {
            document.body.classList.add('larger-text');
        } else {
            document.body.classList.remove('larger-text');
        }
        
        // Color blindness mode
        document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
        if (this.preferences.colorBlindMode !== 'none') {
            document.body.classList.add(this.preferences.colorBlindMode);
        }
        
        // Reduced motion
        if (this.preferences.reducedMotion) {
            document.body.classList.add('reduced-motion');
        } else {
            document.body.classList.remove('reduced-motion');
        }
        
        // Keyboard helpers visibility
        if (this.shortcutsDisplay) {
            if (this.preferences.keyboardHelpers) {
                this.shortcutsDisplay.classList.remove('hidden');
            } else {
                this.shortcutsDisplay.classList.add('hidden');
            }
        }
        
        // Add CSS if it doesn't exist
        this.injectAccessibilityCSS();
    }
    
    /**
     * Inject CSS for accessibility features
     */
    injectAccessibilityCSS() {
        if (document.getElementById('accessibility-css')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'accessibility-css';
        styleElement.textContent = `
            /* High contrast mode */
            body.high-contrast {
                --bg-color: #000000;
                --text-color: #FFFFFF;
                --primary-color: #FFFF00;
                --secondary-color: #00FFFF;
                --obstacle-color: #FF00FF;
                --waste-color: #00FF00;
            }
            
            /* Larger text mode */
            body.larger-text {
                font-size: 120%;
            }
            
            /* Color blindness modes */
            body.protanopia {
                filter: url('#protanopia-filter');
            }
            
            body.deuteranopia {
                filter: url('#deuteranopia-filter');
            }
            
            body.tritanopia {
                filter: url('#tritanopia-filter');
            }
            
            /* Reduced motion */
            body.reduced-motion * {
                transition-duration: 0.001s !important;
                animation-duration: 0.001s !important;
            }
            
            body.reduced-motion .parallax-layer {
                animation: none !important;
            }
            
            /* Keyboard shortcuts display */
            .keyboard-shortcuts-display {
                position: absolute;
                bottom: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-size: 14px;
                z-index: 1000;
                pointer-events: none;
            }
            
            .keyboard-shortcut-key {
                display: inline-block;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.4);
                border-radius: 3px;
                padding: 2px 6px;
                margin: 0 3px;
                font-family: monospace;
            }
            
            /* Focus outline */
            *:focus {
                outline: 3px solid var(--primary-color, #FFD700) !important;
                outline-offset: 2px !important;
            }
        `;
        
        document.head.appendChild(styleElement);
        
        // Add SVG filters for color blindness simulation if they don't exist
        if (!document.getElementById('colorblind-filters')) {
            const svgFilters = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgFilters.id = 'colorblind-filters';
            svgFilters.style.display = 'none';
            
            svgFilters.innerHTML = `
                <filter id="protanopia-filter">
                    <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0"/>
                </filter>
                <filter id="deuteranopia-filter">
                    <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0"/>
                </filter>
                <filter id="tritanopia-filter">
                    <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0"/>
                </filter>
            `;
            
            document.body.appendChild(svgFilters);
        }
    }
    
    /**
     * Set up event listeners for accessibility controls
     */
    setupEventListeners() {
        // High contrast toggle
        this.highContrastButton.addEventListener('click', () => {
            this.preferences.highContrast = !this.preferences.highContrast;
            this.highContrastButton.setAttribute('aria-pressed', this.preferences.highContrast);
            this.applyPreferences();
            this.savePreferences();
            
            // Announce change to screen readers
            this.announce(`High contrast mode ${this.preferences.highContrast ? 'enabled' : 'disabled'}`);
        });
        
        // Larger text toggle
        this.largerTextButton.addEventListener('click', () => {
            this.preferences.largerText = !this.preferences.largerText;
            this.largerTextButton.setAttribute('aria-pressed', this.preferences.largerText);
            this.applyPreferences();
            this.savePreferences();
            
            // Announce change to screen readers
            this.announce(`Larger text mode ${this.preferences.largerText ? 'enabled' : 'disabled'}`);
        });
        
        // Screen reader info button
        this.screenReaderInfoButton.addEventListener('click', () => {
            this.openAccessibilityDialog();
        });
        
        // Close dialog button
        this.closeDialogButton.addEventListener('click', () => {
            this.closeAccessibilityDialog();
        });
        
        // Color blindness selector
        if (this.colorBlindSelect) {
            this.colorBlindSelect.addEventListener('change', () => {
                this.preferences.colorBlindMode = this.colorBlindSelect.value;
                this.applyPreferences();
                this.savePreferences();
                
                // Announce change to screen readers
                const modeName = this.colorBlindSelect.options[this.colorBlindSelect.selectedIndex].text;
                this.announce(`Color blindness mode changed to ${modeName}`);
            });
        }
        
        // Reduced motion toggle
        if (this.reducedMotionButton) {
            this.reducedMotionButton.addEventListener('click', () => {
                this.preferences.reducedMotion = !this.preferences.reducedMotion;
                this.reducedMotionButton.setAttribute('aria-pressed', this.preferences.reducedMotion);
                this.applyPreferences();
                this.savePreferences();
                
                // Announce change to screen readers
                this.announce(`Reduced motion ${this.preferences.reducedMotion ? 'enabled' : 'disabled'}`);
            });
        }
        
        // Text-to-speech toggle
        if (this.textToSpeechButton) {
            this.textToSpeechButton.addEventListener('click', () => {
                this.preferences.textToSpeech = !this.preferences.textToSpeech;
                this.textToSpeechButton.setAttribute('aria-pressed', this.preferences.textToSpeech);
                this.savePreferences();
                
                // Announce change to screen readers
                this.announce(`Text to speech ${this.preferences.textToSpeech ? 'enabled' : 'disabled'}`);
                
                // Test text-to-speech if enabled
                if (this.preferences.textToSpeech) {
                    this.speakText('Text to speech is now enabled');
                }
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Handle difficulty button ARIA roles
        const difficultyButtons = document.querySelectorAll('.difficulty-button');
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update ARIA states
                difficultyButtons.forEach(btn => {
                    btn.setAttribute('aria-checked', 'false');
                });
                button.setAttribute('aria-checked', 'true');
            });
        });
        
        // Make sure Tab key navigation works properly
        this.setupFocusManagement();
    }
    
    /**
     * Handle keydown events for keyboard shortcuts
     * @param {KeyboardEvent} event - The keydown event
     */
    handleKeyDown(event) {
        // Only process if not in a text input
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'INPUT' && activeElement.type === 'text') {
            return;
        }
        
        const key = event.key.toLowerCase();
        
        // Track active keys for keyboard shortcuts display
        this.activeShortcuts.add(key);
        this.updateKeyboardShortcutsDisplay();
        
        switch (key) {
            case 'h':
                // Toggle high contrast
                if (!event.repeat) {
                    this.highContrastButton.click();
                    event.preventDefault();
                }
                break;
                
            case 't':
                // Toggle larger text
                if (!event.repeat) {
                    this.largerTextButton.click();
                    event.preventDefault();
                }
                break;
                
            case 'f':
                // Toggle focus trap
                if (!event.repeat) {
                    this.preferences.focusTrap = !this.preferences.focusTrap;
                    this.savePreferences();
                    this.announce(`Focus trap ${this.preferences.focusTrap ? 'enabled' : 'disabled'}`);
                    event.preventDefault();
                }
                break;
                
            case 'm':
                // Toggle reduced motion
                if (this.reducedMotionButton && !event.repeat) {
                    this.reducedMotionButton.click();
                    event.preventDefault();
                }
                break;
                
            case 'c':
                // Cycle through color blindness modes
                if (this.colorBlindSelect && !event.repeat) {
                    const options = this.colorBlindSelect.options;
                    let currentIndex = Array.from(options).findIndex(opt => opt.value === this.preferences.colorBlindMode);
                    currentIndex = (currentIndex + 1) % options.length;
                    this.colorBlindSelect.selectedIndex = currentIndex;
                    this.colorBlindSelect.dispatchEvent(new Event('change'));
                    event.preventDefault();
                }
                break;
                
            case 's':
                // Toggle text-to-speech
                if (this.textToSpeechButton && !event.repeat) {
                    this.textToSpeechButton.click();
                    event.preventDefault();
                }
                break;
                
            case 'escape':
                // Close dialog if open
                if (!this.a11yDialog.classList.contains('hidden')) {
                    this.closeAccessibilityDialog();
                    event.preventDefault();
                }
                break;
                
            case 'k':
                // Toggle keyboard shortcuts display
                if (!event.repeat) {
                    this.preferences.keyboardHelpers = !this.preferences.keyboardHelpers;
                    this.savePreferences();
                    this.applyPreferences();
                    event.preventDefault();
                }
                break;
        }
    }
    
    /**
     * Handle keyup events for keyboard shortcuts display
     * @param {KeyboardEvent} event - The keyup event
     */
    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        this.activeShortcuts.delete(key);
        this.updateKeyboardShortcutsDisplay();
    }
    
    /**
     * Update the keyboard shortcuts display based on currently pressed keys
     */
    updateKeyboardShortcutsDisplay() {
        if (!this.shortcutsDisplay || !this.preferences.keyboardHelpers) return;
        
        // Only show if there are active shortcuts
        if (this.activeShortcuts.size > 0) {
            // Generate HTML for active shortcuts
            const shortcutsHTML = Array.from(this.activeShortcuts)
                .map(key => `<span class="keyboard-shortcut-key">${key === ' ' ? 'Space' : key}</span>`)
                .join(' + ');
            
            // Display active shortcuts and their function
            let functionText = '';
            if (this.activeShortcuts.has('h')) functionText = 'Toggle High Contrast';
            else if (this.activeShortcuts.has('t')) functionText = 'Toggle Larger Text';
            else if (this.activeShortcuts.has('f')) functionText = 'Toggle Focus Trap';
            else if (this.activeShortcuts.has('m')) functionText = 'Toggle Reduced Motion';
            else if (this.activeShortcuts.has('c')) functionText = 'Cycle Color Blindness Modes';
            else if (this.activeShortcuts.has('s')) functionText = 'Toggle Text-to-Speech';
            else if (this.activeShortcuts.has('k')) functionText = 'Toggle Keyboard Helpers';
            else if (this.activeShortcuts.has('arrowleft')) functionText = 'Move Left';
            else if (this.activeShortcuts.has('arrowright')) functionText = 'Move Right';
            else if (this.activeShortcuts.has('arrowup')) functionText = 'Jump';
            else if (this.activeShortcuts.has('p')) functionText = 'Pause Game';
            
            this.shortcutsDisplay.innerHTML = `${shortcutsHTML} ${functionText ? ': ' + functionText : ''}`;
            this.shortcutsDisplay.classList.remove('hidden');
        } else if (this.shortcutsDisplay.classList.contains('hidden') === false) {
            // Clear and hide if no shortcuts active
            setTimeout(() => {
                if (this.activeShortcuts.size === 0) {
                    this.shortcutsDisplay.classList.add('hidden');
                }
            }, 1000);
        }
    }
    
    /**
     * Open the accessibility information dialog
     */
    openAccessibilityDialog() {
        this.a11yDialog.classList.remove('hidden');
        
        // Focus the close button
        setTimeout(() => {
            this.closeDialogButton.focus();
        }, 10);
    }
    
    /**
     * Close the accessibility information dialog
     */
    closeAccessibilityDialog() {
        this.a11yDialog.classList.add('hidden');
        
        // Return focus to the button that opened the dialog
        this.screenReaderInfoButton.focus();
    }
    
    /**
     * Set up focus management for keyboard navigation
     */
    setupFocusManagement() {
        // Track last focused element in each screen
        this.lastFocusedElements = {
            'game-start': document.getElementById('start-button'),
            'game-paused': document.getElementById('resume-button'),
            'game-over': document.getElementById('restart-button')
        };
        
        // Set up observers to track screen changes
        const gameScreens = document.querySelectorAll('.game-screen');
        gameScreens.forEach(screen => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        const isHidden = screen.classList.contains('hidden');
                        
                        if (!isHidden) {
                            // Screen became visible, restore focus
                            const lastFocused = this.lastFocusedElements[screen.id];
                            if (lastFocused) {
                                setTimeout(() => {
                                    lastFocused.focus();
                                }, 10);
                            }
                        }
                    }
                });
            });
            
            observer.observe(screen, { attributes: true });
        });
    }
    
    /**
     * Announce a message to screen readers
     * @param {string} message - Message to announce
     */
    announce(message) {
        if (!this.gameAnnouncer) return;
        
        // Clear previous message
        this.gameAnnouncer.textContent = '';
        
        // Set new message (setTimeout provides better screen reader support)
        setTimeout(() => {
            this.gameAnnouncer.textContent = message;
        }, 50);
        
        // If text-to-speech is enabled, also speak the message
        if (this.preferences.textToSpeech) {
            this.speakText(message);
        }
    }
    
    /**
     * Use the Web Speech API for text-to-speech
     * @param {string} text - Text to be spoken
     */
    speakText(text) {
        // Check if speech synthesis is available
        if (!('speechSynthesis' in window)) {
            console.warn('Text-to-speech not supported in this browser');
            return;
        }
        
        // Cancel any current speech
        window.speechSynthesis.cancel();
        
        // Create speech utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0; // Speech rate
        utterance.pitch = 1.0; // Speech pitch
        utterance.volume = 1.0; // Volume
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
    }
    
    /**
     * Announce game events for screen readers
     * @param {string} eventType - Type of event
     * @param {Object} data - Event data
     */
    announceGameEvent(eventType, data = {}) {
        let message = '';
        
        switch (eventType) {
            case 'gameStart':
                message = 'Game started. Use left and right arrows to move, up arrow to jump.';
                break;
                
            case 'gamePause':
                message = 'Game paused.';
                break;
                
            case 'gameResume':
                message = 'Game resumed.';
                break;
                
            case 'gameOver':
                message = `Game over. Final score: ${data.score}. Waste collected: ${data.wasteCollected}.`;
                break;
                
            case 'collectWaste':
                message = `Collected ${data.type} waste. +${data.points} points.`;
                if (data.combo > 1) {
                    message += ` Combo x${data.combo}!`;
                }
                break;
                
            case 'hitObstacle':
                message = 'Hit obstacle!';
                break;
                
            case 'levelUp':
                message = `Difficulty increased to level ${data.level}!`;
                break;
                
            case 'powerUp':
                message = `Collected ${data.type} power-up!`;
                break;
        }
        
        if (message) {
            this.announce(message);
        }
    }
}

// Create accessibility manager
const accessibilityManager = new AccessibilityManager(); 