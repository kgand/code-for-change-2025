/**
 * Animation Manager for Subwaste Surfer
 * 
 * This module manages advanced animations and visual effects for the game,
 * providing a more engaging and polished visual experience.
 */

class AnimationManager {
    constructor(canvas, ctx, settings) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.settings = settings;
        this.animations = [];
        this.particleEffects = {
            collection: [],
            celebration: [],
            trail: []
        };
        this.spriteAnimations = {};
        this.transitionEffects = {};
        
        // Animation timing
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Animation settings
        this.config = {
            particleDecay: 0.02,
            trailFrequency: 5,
            maxTrailParticles: 100,
            celebrationDuration: 2000,
            transitionDuration: 500
        };
        
        // Initialize particle pools for better performance
        this.particlePool = Array(200).fill().map(() => this.createParticle());
        this.availableParticles = [...this.particlePool];
    }
    
    /**
     * Update all animations based on time passed
     * @param {number} timestamp - Current timestamp from requestAnimationFrame
     */
    update(timestamp) {
        // Calculate delta time
        if (!this.lastTime) {
            this.lastTime = timestamp;
        }
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Update all animations
        this.updateParticleEffects();
        this.updateSpriteAnimations();
        this.updateTransitionEffects();
        
        // Clean up finished animations
        this.cleanupAnimations();
    }
    
    /**
     * Draw all active animations
     */
    draw() {
        this.drawParticleEffects();
        this.drawSpriteAnimations();
        this.drawTransitionEffects();
    }
    
    /**
     * Update all particle effects
     */
    updateParticleEffects() {
        // Update collection particles
        this.updateParticleGroup(this.particleEffects.collection);
        
        // Update celebration particles
        this.updateParticleGroup(this.particleEffects.celebration);
        
        // Update trail particles
        this.updateParticleGroup(this.particleEffects.trail);
    }
    
    /**
     * Update a group of particles
     * @param {Array} particles - Group of particles to update
     */
    updateParticleGroup(particles) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            
            // Update position
            particle.x += particle.vx * (this.deltaTime / 16);
            particle.y += particle.vy * (this.deltaTime / 16);
            
            // Apply forces (gravity, friction)
            particle.vy += particle.gravity * (this.deltaTime / 16);
            particle.vx *= particle.friction;
            particle.vy *= particle.friction;
            
            // Update properties
            particle.rotation += particle.rotationSpeed * (this.deltaTime / 16);
            particle.size += particle.growRate * (this.deltaTime / 16);
            particle.opacity -= this.config.particleDecay * (this.deltaTime / 16);
            
            // Remove dead particles
            if (particle.opacity <= 0 || particle.size <= 0) {
                particles.splice(i, 1);
                this.recycleParticle(particle);
            }
        }
    }
    
    /**
     * Draw all particle effects
     */
    drawParticleEffects() {
        this.ctx.save();
        
        // Group particles by color for better performance
        const particlesByColor = {};
        
        // Process all particle types
        const allParticles = [
            ...this.particleEffects.collection,
            ...this.particleEffects.celebration,
            ...this.particleEffects.trail
        ];
        
        // Skip if in low performance mode
        if (this.settings.lowPerformanceMode && allParticles.length > 20) {
            // Draw simplified particles
            this.drawSimplifiedParticles(allParticles.slice(0, 20));
            this.ctx.restore();
            return;
        }
        
        // Group particles by color
        for (const particle of allParticles) {
            if (!particlesByColor[particle.color]) {
                particlesByColor[particle.color] = [];
            }
            particlesByColor[particle.color].push(particle);
        }
        
        // Draw particles by color batches
        for (const color in particlesByColor) {
            this.ctx.fillStyle = color;
            
            for (const particle of particlesByColor[color]) {
                this.ctx.globalAlpha = particle.opacity;
                this.ctx.save();
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.rotation);
                
                // Draw based on particle shape
                if (particle.shape === 'circle') {
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (particle.shape === 'square') {
                    this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                } else if (particle.shape === 'triangle') {
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -particle.size);
                    this.ctx.lineTo(particle.size, particle.size);
                    this.ctx.lineTo(-particle.size, particle.size);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
                
                this.ctx.restore();
            }
        }
        
        this.ctx.globalAlpha = 1;
        this.ctx.restore();
    }
    
    /**
     * Draw simplified particles for low performance mode
     * @param {Array} particles - Particles to draw in simplified form
     */
    drawSimplifiedParticles(particles) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.globalAlpha = 0.7;
        
        for (const particle of particles) {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * Update sprite animations
     */
    updateSpriteAnimations() {
        // Implement sprite animation updates
        for (const key in this.spriteAnimations) {
            const animation = this.spriteAnimations[key];
            
            if (animation.active) {
                animation.elapsed += this.deltaTime;
                
                // Update frame if needed
                if (animation.elapsed >= animation.frameDelay) {
                    animation.currentFrame = (animation.currentFrame + 1) % animation.totalFrames;
                    animation.elapsed = 0;
                }
            }
        }
    }
    
    /**
     * Draw sprite animations
     */
    drawSpriteAnimations() {
        // Draw active sprite animations
        for (const key in this.spriteAnimations) {
            const animation = this.spriteAnimations[key];
            
            if (animation.active && animation.sprite) {
                const frameWidth = animation.sprite.width / animation.totalFrames;
                
                this.ctx.drawImage(
                    animation.sprite,
                    frameWidth * animation.currentFrame, 0,
                    frameWidth, animation.sprite.height,
                    animation.x, animation.y,
                    animation.width, animation.height
                );
            }
        }
    }
    
    /**
     * Update transition effects
     */
    updateTransitionEffects() {
        // Update active transition effects
        for (const key in this.transitionEffects) {
            const effect = this.transitionEffects[key];
            
            if (effect.active) {
                effect.progress = Math.min(1, effect.progress + (this.deltaTime / effect.duration));
                
                // Mark as complete if finished
                if (effect.progress >= 1) {
                    effect.active = false;
                    if (effect.onComplete) effect.onComplete();
                }
            }
        }
    }
    
    /**
     * Draw transition effects
     */
    drawTransitionEffects() {
        // Draw active transition effects
        for (const key in this.transitionEffects) {
            const effect = this.transitionEffects[key];
            
            if (effect.active) {
                // Apply the specific transition effect
                switch (effect.type) {
                    case 'fade':
                        this.ctx.fillStyle = effect.color || 'black';
                        this.ctx.globalAlpha = effect.direction === 'in' ? 
                            effect.progress : 1 - effect.progress;
                        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                        this.ctx.globalAlpha = 1;
                        break;
                        
                    case 'wipe':
                        this.ctx.fillStyle = effect.color || 'black';
                        const width = effect.direction === 'in' ? 
                            this.canvas.width * effect.progress : 
                            this.canvas.width * (1 - effect.progress);
                        this.ctx.fillRect(0, 0, width, this.canvas.height);
                        break;
                        
                    case 'spotlight':
                        const radius = effect.direction === 'in' ? 
                            this.canvas.width * (1 - effect.progress) : 
                            this.canvas.width * effect.progress;
                        
                        // Create spotlight effect
                        this.ctx.save();
                        this.ctx.globalCompositeOperation = 'destination-in';
                        this.ctx.beginPath();
                        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, radius, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.restore();
                        break;
                }
            }
        }
    }
    
    /**
     * Clean up finished animations
     */
    cleanupAnimations() {
        // Clean up finished sprite animations
        for (const key in this.spriteAnimations) {
            const animation = this.spriteAnimations[key];
            if (!animation.active && !animation.persistent) {
                delete this.spriteAnimations[key];
            }
        }
        
        // Clean up finished transition effects
        for (const key in this.transitionEffects) {
            const effect = this.transitionEffects[key];
            if (!effect.active && !effect.persistent) {
                delete this.transitionEffects[key];
            }
        }
    }
    
    /**
     * Create a collection effect when waste is collected
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Color based on waste type
     */
    createCollectionEffect(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const particle = this.getParticleFromPool();
            
            // Set random direction
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 2;
            
            // Configure particle
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.size = Math.random() * 4 + 2;
            particle.color = color;
            particle.opacity = 1;
            particle.gravity = 0.05;
            particle.friction = 0.98;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.2;
            particle.growRate = -0.05;
            particle.shape = Math.random() > 0.5 ? 'circle' : 'square';
            
            // Add to collection particles
            this.particleEffects.collection.push(particle);
        }
    }
    
    /**
     * Create celebration particles for achievements or milestones
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    createCelebrationEffect(x, y) {
        const colors = ['#ffde59', '#ff914d', '#ff66c4', '#5ce1e6', '#7cff6b'];
        
        for (let i = 0; i < 30; i++) {
            const particle = this.getParticleFromPool();
            
            // Set random properties
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 3;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Configure particle
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.size = Math.random() * 5 + 3;
            particle.color = color;
            particle.opacity = 1;
            particle.gravity = 0.1;
            particle.friction = 0.97;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.4;
            particle.growRate = -0.03;
            particle.shape = ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)];
            
            // Add to celebration particles
            this.particleEffects.celebration.push(particle);
        }
    }
    
    /**
     * Create trail particles behind player (useful for power-ups)
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Trail color
     */
    createTrailEffect(x, y, color) {
        // Limit trail particles for performance
        if (this.particleEffects.trail.length > this.config.maxTrailParticles) {
            return;
        }
        
        // Add trail particles at random intervals
        if (Math.random() > 0.6) {
            const particle = this.getParticleFromPool();
            
            // Small random offset
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 10;
            
            // Configure particle
            particle.x = x + offsetX;
            particle.y = y + offsetY;
            particle.vx = (Math.random() - 0.5) * 0.5;
            particle.vy = -Math.random() * 0.5;
            particle.size = Math.random() * 3 + 2;
            particle.color = color;
            particle.opacity = 0.7;
            particle.gravity = 0;
            particle.friction = 0.95;
            particle.rotation = 0;
            particle.rotationSpeed = 0;
            particle.growRate = -0.03;
            particle.shape = 'circle';
            
            // Add to trail particles
            this.particleEffects.trail.push(particle);
        }
    }
    
    /**
     * Create a fade transition effect
     * @param {string} direction - 'in' or 'out'
     * @param {number} duration - Duration in milliseconds
     * @param {Function} onComplete - Callback on completion
     */
    createFadeTransition(direction, duration, onComplete) {
        this.transitionEffects.fade = {
            type: 'fade',
            direction: direction,
            progress: 0,
            duration: duration || this.config.transitionDuration,
            active: true,
            persistent: false,
            color: 'black',
            onComplete: onComplete
        };
    }
    
    /**
     * Create a wipe transition effect
     * @param {string} direction - 'in' or 'out'
     * @param {number} duration - Duration in milliseconds
     * @param {Function} onComplete - Callback on completion
     */
    createWipeTransition(direction, duration, onComplete) {
        this.transitionEffects.wipe = {
            type: 'wipe',
            direction: direction,
            progress: 0,
            duration: duration || this.config.transitionDuration,
            active: true,
            persistent: false,
            color: 'black',
            onComplete: onComplete
        };
    }
    
    /**
     * Create a sprite animation from an image sprite sheet
     * @param {string} id - Unique ID for the animation
     * @param {Image} sprite - Sprite sheet image
     * @param {number} frames - Number of frames
     * @param {number} frameDelay - Delay between frames in ms
     * @param {Object} position - {x, y, width, height}
     */
    createSpriteAnimation(id, sprite, frames, frameDelay, position) {
        this.spriteAnimations[id] = {
            sprite: sprite,
            totalFrames: frames,
            currentFrame: 0,
            frameDelay: frameDelay,
            elapsed: 0,
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            active: true,
            persistent: false
        };
        
        return this.spriteAnimations[id];
    }
    
    /**
     * Update position of a sprite animation
     * @param {string} id - Animation ID
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    updateSpritePosition(id, x, y) {
        if (this.spriteAnimations[id]) {
            this.spriteAnimations[id].x = x;
            this.spriteAnimations[id].y = y;
        }
    }
    
    /**
     * Stop a sprite animation
     * @param {string} id - Animation ID
     */
    stopSpriteAnimation(id) {
        if (this.spriteAnimations[id]) {
            this.spriteAnimations[id].active = false;
        }
    }
    
    /**
     * Create a particle object with default properties
     * @return {Object} - Particle object
     */
    createParticle() {
        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            size: 0,
            color: '#ffffff',
            opacity: 1,
            gravity: 0,
            friction: 1,
            rotation: 0,
            rotationSpeed: 0,
            growRate: 0,
            shape: 'circle',
            active: false
        };
    }
    
    /**
     * Get a particle from the pool
     * @return {Object} - Particle from the pool
     */
    getParticleFromPool() {
        if (this.availableParticles.length > 0) {
            const particle = this.availableParticles.pop();
            particle.active = true;
            return particle;
        }
        
        // If pool is empty, create a new particle
        const newParticle = this.createParticle();
        newParticle.active = true;
        return newParticle;
    }
    
    /**
     * Recycle a particle back to the pool
     * @param {Object} particle - Particle to recycle
     */
    recycleParticle(particle) {
        // Reset particle properties
        particle.active = false;
        particle.x = 0;
        particle.y = 0;
        particle.vx = 0;
        particle.vy = 0;
        particle.size = 0;
        particle.opacity = 1;
        
        // Add back to available pool
        this.availableParticles.push(particle);
    }
}

// Export the AnimationManager class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationManager;
} 