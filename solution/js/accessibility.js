/**
 * Accessibility Manager for Subwaste Surfer game
 * Handles accessibility features including:
 * - Keyboard navigation
 * - Screen reader support
 * - High contrast mode
 * - Larger text mode
 * - Focus management
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
        
        // User preferences
        this.preferences = {
            highContrast: false,
            largerText: false,
            focusTrap: false
        };
        
        // Initialize
        this.loadPreferences();
        this.setupEventListeners();
        this.applyPreferences();
    }
    
    /**
     * Load user preferences from localStorage
     */
    loadPreferences() {
        try {
            const savedPrefs = localStorage.getItem('subwaste_a11y_prefs');
            if (savedPrefs) {
                this.preferences = JSON.parse(savedPrefs);
                
                // Update button states
                if (this.preferences.highContrast) {
                    this.highContrastButton.setAttribute('aria-pressed', 'true');
                }
                
                if (this.preferences.largerText) {
                    this.largerTextButton.setAttribute('aria-pressed', 'true');
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
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            // Only process if not in a text input
            const activeElement = document.activeElement;
            if (activeElement && activeElement.tagName === 'INPUT' && activeElement.type === 'text') {
                return;
            }
            
            switch (event.key) {
                case 'h':
                case 'H':
                    // Toggle high contrast
                    this.highContrastButton.click();
                    event.preventDefault();
                    break;
                    
                case 't':
                case 'T':
                    // Toggle larger text
                    this.largerTextButton.click();
                    event.preventDefault();
                    break;
                    
                case 'f':
                case 'F':
                    // Toggle focus trap
                    this.preferences.focusTrap = !this.preferences.focusTrap;
                    this.savePreferences();
                    this.announce(`Focus trap ${this.preferences.focusTrap ? 'enabled' : 'disabled'}`);
                    event.preventDefault();
                    break;
                    
                case 'Escape':
                    // Close dialog if open
                    if (!this.a11yDialog.classList.contains('hidden')) {
                        this.closeAccessibilityDialog();
                        event.preventDefault();
                    }
                    break;
            }
        });
        
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