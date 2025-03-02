// Subwaste Surfer - Leaderboard System

/**
 * LeaderboardManager class handles storing and retrieving high scores,
 * as well as displaying the leaderboard in the game-over screen.
 */
class LeaderboardManager {
    constructor() {
        // DOM elements
        this.leaderboardEl = document.getElementById('leaderboard');
        this.leaderboardTableEl = document.getElementById('leaderboard-table');
        this.leaderboardEntriesEl = document.getElementById('leaderboard-entries');
        this.leaderboardLoadingEl = document.getElementById('leaderboard-loading');
        this.scoreFormEl = document.getElementById('score-form');
        this.playerNameEl = document.getElementById('player-name');
        this.submitScoreButtonEl = document.getElementById('submit-score-button');
        this.scoreSubmitMessageEl = document.getElementById('score-submit-message');
        
        // Local storage key
        this.storageKey = 'subwaste_surfer_leaderboard';
        
        // Maximum number of scores to display
        this.maxLeaderboardEntries = 10;
        
        // Current game score data
        this.currentScore = 0;
        this.currentWasteCollected = 0;
        
        // Bind event listeners
        this.scoreFormEl.addEventListener('submit', this.handleScoreSubmit.bind(this));
        
        // Initialize
        this.loadLeaderboard();
    }
    
    /**
     * Set current game score data to prepare for submission
     * @param {number} score - Player's score
     * @param {number} wasteCollected - Amount of waste collected
     */
    setCurrentScore(score, wasteCollected) {
        this.currentScore = score;
        this.currentWasteCollected = wasteCollected;
        
        // Reset form and messages
        this.playerNameEl.value = localStorage.getItem('player_name') || '';
        this.scoreSubmitMessageEl.textContent = '';
        this.scoreSubmitMessageEl.className = '';
    }
    
    /**
     * Load the leaderboard from local storage
     */
    loadLeaderboard() {
        // Show loading message
        this.leaderboardLoadingEl.classList.remove('hidden');
        this.leaderboardTableEl.classList.add('hidden');
        
        // Load leaderboard data
        const leaderboardData = this.getLeaderboardData();
        
        // Simulate network delay (for effect)
        setTimeout(() => {
            // Hide loading and show table
            this.leaderboardLoadingEl.classList.add('hidden');
            this.leaderboardTableEl.classList.remove('hidden');
            
            // Display the leaderboard
            this.displayLeaderboard(leaderboardData);
        }, 800);
    }
    
    /**
     * Get leaderboard data from local storage
     * @returns {Array} Array of leaderboard entries
     */
    getLeaderboardData() {
        const storedData = localStorage.getItem(this.storageKey);
        let leaderboardData = [];
        
        if (storedData) {
            try {
                leaderboardData = JSON.parse(storedData);
                
                // Ensure it's an array
                if (!Array.isArray(leaderboardData)) {
                    leaderboardData = [];
                }
            } catch (error) {
                console.error('Error parsing leaderboard data:', error);
                leaderboardData = [];
            }
        }
        
        return leaderboardData;
    }
    
    /**
     * Display the leaderboard in the UI
     * @param {Array} leaderboardData - Array of leaderboard entries
     */
    displayLeaderboard(leaderboardData) {
        // Clear existing entries
        this.leaderboardEntriesEl.innerHTML = '';
        
        if (leaderboardData.length === 0) {
            // No entries yet
            const noEntriesRow = document.createElement('tr');
            const noEntriesCell = document.createElement('td');
            noEntriesCell.colSpan = 4;
            noEntriesCell.textContent = 'No high scores yet. Be the first!';
            noEntriesRow.appendChild(noEntriesCell);
            this.leaderboardEntriesEl.appendChild(noEntriesRow);
            return;
        }
        
        // Sort by score (descending)
        leaderboardData.sort((a, b) => b.score - a.score);
        
        // Display top entries
        const entriesToShow = Math.min(leaderboardData.length, this.maxLeaderboardEntries);
        
        for (let i = 0; i < entriesToShow; i++) {
            const entry = leaderboardData[i];
            const rank = i + 1;
            
            const row = document.createElement('tr');
            
            // Add rank
            const rankCell = document.createElement('td');
            rankCell.textContent = rank;
            row.appendChild(rankCell);
            
            // Add name
            const nameCell = document.createElement('td');
            nameCell.textContent = entry.name;
            row.appendChild(nameCell);
            
            // Add score
            const scoreCell = document.createElement('td');
            scoreCell.textContent = entry.score;
            row.appendChild(scoreCell);
            
            // Add waste collected
            const wasteCell = document.createElement('td');
            wasteCell.textContent = entry.wasteCollected;
            row.appendChild(wasteCell);
            
            this.leaderboardEntriesEl.appendChild(row);
        }
    }
    
    /**
     * Handle the form submission when a player submits their score
     * @param {Event} event - Form submit event
     */
    handleScoreSubmit(event) {
        event.preventDefault();
        
        const playerName = this.playerNameEl.value.trim();
        
        if (!playerName) {
            this.showSubmitMessage('Please enter your name', 'message-error');
            return;
        }
        
        // Save player name for future use
        localStorage.setItem('player_name', playerName);
        
        // Get current leaderboard data
        const leaderboardData = this.getLeaderboardData();
        
        // Create new entry
        const newEntry = {
            name: playerName,
            score: this.currentScore,
            wasteCollected: this.currentWasteCollected,
            timestamp: Date.now()
        };
        
        // Add entry to leaderboard
        leaderboardData.push(newEntry);
        
        // Sort by score (descending)
        leaderboardData.sort((a, b) => b.score - a.score);
        
        // Keep only top entries
        if (leaderboardData.length > this.maxLeaderboardEntries) {
            leaderboardData.splice(this.maxLeaderboardEntries);
        }
        
        // Save updated leaderboard
        localStorage.setItem(this.storageKey, JSON.stringify(leaderboardData));
        
        // Update the displayed leaderboard
        this.displayLeaderboard(leaderboardData);
        
        // Show success message
        this.showSubmitMessage('Score submitted successfully!', 'message-success');
        
        // Disable the form to prevent multiple submissions
        this.submitScoreButtonEl.disabled = true;
        this.playerNameEl.disabled = true;
    }
    
    /**
     * Show a message after score submission
     * @param {string} message - Message to display
     * @param {string} className - CSS class for styling
     */
    showSubmitMessage(message, className) {
        this.scoreSubmitMessageEl.textContent = message;
        this.scoreSubmitMessageEl.className = className;
    }
}

// Create the leaderboard manager
const leaderboardManager = new LeaderboardManager(); 