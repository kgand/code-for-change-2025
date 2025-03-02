/**
 * waste-sorting-game.js
 * Implements a waste sorting mini-game for Subwaste Surfer
 * This mini-game is triggered after collecting a certain amount of waste
 * and teaches players about proper waste sorting.
 */

class WasteSortingGame {
    constructor(parentGame) {
        this.parentGame = parentGame;
        this.isActive = false;
        this.score = 0;
        this.timeLeft = 30; // 30 seconds for the mini-game
        this.countdownTimer = null;
        this.items = [];
        this.bins = [
            { type: 'plastic', color: '#3498db', items: [] },
            { type: 'paper', color: '#f1c40f', items: [] },
            { type: 'metal', color: '#e74c3c', items: [] },
            { type: 'landfill', color: '#7f8c8d', items: [] }
        ];
        this.draggedItem = null;
        this.canvas = document.getElementById('sorting-game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Create the mini-game container
        this.createGameContainer();
    }
    
    createGameContainer() {
        // Check if container already exists
        if (document.getElementById('waste-sorting-container')) return;
        
        // Create main container
        const container = document.createElement('div');
        container.id = 'waste-sorting-container';
        container.className = 'game-screen hidden';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'sorting-game-header';
        
        const title = document.createElement('h2');
        title.textContent = 'Waste Sorting Challenge';
        header.appendChild(title);
        
        const scoreDisplay = document.createElement('div');
        scoreDisplay.id = 'sorting-score';
        scoreDisplay.textContent = 'Score: 0';
        header.appendChild(scoreDisplay);
        
        const timeDisplay = document.createElement('div');
        timeDisplay.id = 'sorting-time';
        timeDisplay.textContent = 'Time: 30s';
        header.appendChild(timeDisplay);
        
        container.appendChild(header);
        
        // Create game instructions
        const instructions = document.createElement('p');
        instructions.className = 'sorting-instructions';
        instructions.textContent = 'Drag and drop waste items into the correct recycling bins!';
        container.appendChild(instructions);
        
        // Create canvas for the game
        const canvas = document.createElement('canvas');
        canvas.id = 'sorting-game-canvas';
        canvas.width = 800;
        canvas.height = 400;
        container.appendChild(canvas);
        
        // Create bins container
        const binsContainer = document.createElement('div');
        binsContainer.className = 'sorting-bins-container';
        
        // Create bins
        this.bins.forEach(bin => {
            const binElement = document.createElement('div');
            binElement.className = 'sorting-bin';
            binElement.dataset.type = bin.type;
            binElement.style.backgroundColor = bin.color;
            
            const binLabel = document.createElement('div');
            binLabel.className = 'bin-label';
            binLabel.textContent = bin.type.charAt(0).toUpperCase() + bin.type.slice(1);
            binElement.appendChild(binLabel);
            
            binsContainer.appendChild(binElement);
        });
        
        container.appendChild(binsContainer);
        
        // Create buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'sorting-buttons';
        
        const exitButton = document.createElement('button');
        exitButton.id = 'exit-sorting-game';
        exitButton.textContent = 'Exit Game';
        exitButton.addEventListener('click', () => this.exitGame());
        buttonsContainer.appendChild(exitButton);
        
        container.appendChild(buttonsContainer);
        
        // Add to the game container
        document.getElementById('game-container').appendChild(container);
        
        // Store canvas reference
        this.canvas = document.getElementById('sorting-game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Make canvas responsive
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Add event listeners for drag and drop
        this.addEventListeners();
    }
    
    // New method to resize canvas based on screen size
    resizeCanvas() {
        const container = document.getElementById('waste-sorting-container');
        if (!container) return;
        
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        // Set maximum dimensions
        const maxWidth = Math.min(800, containerWidth - 40); // 20px padding on each side
        const maxHeight = Math.min(400, containerHeight * 0.5); // 50% of container height
        
        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
        
        // Redraw if game is active
        if (this.isActive) {
            this.drawGame();
        }
    }
    
    addEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup');
            this.canvas.dispatchEvent(mouseEvent);
        });
    }
    
    handleMouseDown(e) {
        if (!this.isActive) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if an item was clicked
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (x >= item.x && x <= item.x + item.width &&
                y >= item.y && y <= item.y + item.height) {
                // Item found, start dragging
                this.draggedItem = item;
                this.dragOffsetX = x - item.x;
                this.dragOffsetY = y - item.y;
                break;
            }
        }
    }
    
    handleMouseMove(e) {
        if (!this.isActive || !this.draggedItem) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Update dragged item position
        this.draggedItem.x = x - this.dragOffsetX;
        this.draggedItem.y = y - this.dragOffsetY;
        
        // Redraw the game
        this.drawGame();
    }
    
    handleMouseUp(e) {
        if (!this.isActive || !this.draggedItem) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if item was dropped on a bin
        const bins = document.querySelectorAll('.sorting-bin');
        let binDropped = false;
        
        bins.forEach(bin => {
            const binRect = bin.getBoundingClientRect();
            const binX = binRect.left - rect.left;
            const binY = binRect.top - rect.top;
            const binWidth = binRect.width;
            const binHeight = binRect.height;
            
            if (x >= binX && x <= binX + binWidth &&
                y >= binY && y <= binY + binHeight) {
                // Item dropped on bin
                binDropped = true;
                const binType = bin.dataset.type;
                
                // Check if correct bin
                if (this.draggedItem.type === binType) {
                    // Correct bin
                    this.score += 10;
                    this.showFeedback('Correct! +10 points', true);
                    
                    // Remove item
                    const index = this.items.indexOf(this.draggedItem);
                    if (index > -1) {
                        this.items.splice(index, 1);
                    }
                    
                    // Generate a new item
                    this.generateItem();
                } else {
                    // Wrong bin
                    this.score -= 5;
                    this.showFeedback('Wrong bin! -5 points', false);
                    
                    // Return item to starting position
                    this.draggedItem.x = this.draggedItem.startX;
                    this.draggedItem.y = this.draggedItem.startY;
                }
                
                // Update score display
                document.getElementById('sorting-score').textContent = `Score: ${this.score}`;
            }
        });
        
        // If not dropped on a bin, return to starting position
        if (!binDropped) {
            this.draggedItem.x = this.draggedItem.startX;
            this.draggedItem.y = this.draggedItem.startY;
        }
        
        // Clear dragged item
        this.draggedItem = null;
        
        // Redraw the game
        this.drawGame();
    }
    
    startGame() {
        // Show the sorting game container
        const container = document.getElementById('waste-sorting-container');
        container.classList.remove('hidden');
        
        // Hide main game
        document.getElementById('game-play').classList.add('hidden');
        
        // Reset game state
        this.isActive = true;
        this.score = 0;
        this.timeLeft = 30;
        this.items = [];
        
        // Update displays
        document.getElementById('sorting-score').textContent = `Score: ${this.score}`;
        document.getElementById('sorting-time').textContent = `Time: ${this.timeLeft}s`;
        
        // Ensure canvas is properly sized
        this.resizeCanvas();
        
        // Generate initial items
        for (let i = 0; i < 5; i++) {
            this.generateItem();
        }
        
        // Start countdown timer
        this.countdownTimer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('sorting-time').textContent = `Time: ${this.timeLeft}s`;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
        
        // Start game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    gameLoop() {
        if (!this.isActive) return;
        
        this.drawGame();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    drawGame() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw items
        this.items.forEach(item => {
            // Draw item background
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(item.x, item.y, item.width, item.height);
            
            // Draw item border
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(item.x, item.y, item.width, item.height);
            
            // Draw item label
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(item.name, item.x + item.width / 2, item.y + item.height / 2);
        });
    }
    
    generateItem() {
        const wasteTypes = [
            { type: 'plastic', items: ['Bottle', 'Container', 'Bag', 'Toy', 'Cup'], color: '#3498db' },
            { type: 'paper', items: ['Newspaper', 'Box', 'Carton', 'Book', 'Mail'], color: '#f1c40f' },
            { type: 'metal', items: ['Can', 'Foil', 'Wire', 'Scrap', 'Cap'], color: '#e74c3c' },
            { type: 'landfill', items: ['Food waste', 'Styrofoam', 'Diaper', 'Broken glass', 'Ceramics'], color: '#7f8c8d' }
        ];
        
        // Select random waste type
        const typeIndex = Math.floor(Math.random() * wasteTypes.length);
        const type = wasteTypes[typeIndex];
        
        // Select random item from that type
        const itemIndex = Math.floor(Math.random() * type.items.length);
        const itemName = type.items[itemIndex];
        
        // Create item object
        const item = {
            type: type.type,
            name: itemName,
            color: type.color,
            width: 80,
            height: 80,
            startX: Math.random() * (this.canvas.width - 100) + 10,
            startY: Math.random() * (this.canvas.height - 100) + 10
        };
        
        // Set initial position
        item.x = item.startX;
        item.y = item.startY;
        
        // Add to items array
        this.items.push(item);
    }
    
    showFeedback(message, isCorrect) {
        // Create feedback element if it doesn't exist
        let feedback = document.getElementById('sorting-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'sorting-feedback';
            document.getElementById('waste-sorting-container').appendChild(feedback);
        }
        
        // Set message and style
        feedback.textContent = message;
        feedback.className = isCorrect ? 'correct-feedback' : 'wrong-feedback';
        
        // Show feedback
        feedback.style.display = 'block';
        
        // Hide after a short delay
        setTimeout(() => {
            feedback.style.display = 'none';
        }, 1500);
    }
    
    endGame() {
        // Stop the timer
        clearInterval(this.countdownTimer);
        
        // Set game as inactive
        this.isActive = false;
        
        // Calculate bonus for main game
        const bonus = Math.floor(this.score / 2);
        
        // Show game over message
        alert(`Mini-game complete!\nYou scored ${this.score} points.\nBonus for main game: ${bonus} points.`);
        
        // Add bonus to main game score
        if (this.parentGame) {
            this.parentGame.addScore(bonus);
        }
        
        // Exit the mini-game
        this.exitGame();
    }
    
    exitGame() {
        // Stop the timer if it's running
        clearInterval(this.countdownTimer);
        
        // Set game as inactive
        this.isActive = false;
        
        // Hide the sorting game container
        const container = document.getElementById('waste-sorting-container');
        container.classList.add('hidden');
        
        // Show main game
        document.getElementById('game-play').classList.remove('hidden');
        
        // Resume parent game if it exists
        if (this.parentGame) {
            this.parentGame.resumeAfterMiniGame();
        }
    }
}

// Export for use in game.js
window.WasteSortingGame = WasteSortingGame; 