import * as THREE from "../three.js-dev/build/three.module.js";

export default function Obstacles() {
  // Enemy obstacles that the player must avoid
  this.obstacles = [];
  this.obstacle_rotations = [];
  
  // Collectible items that increase player score
  this.collectibles = [];
  this.collectible_rotations = [];
  
  // Special items that give temporary abilities
  this.powerups = [];
  this.powerup_rotations = [];
  
  this.mode = 0;
  this.last_mode = 0;
  this.mode_began = true;
  this.planet_count = 5;

  // Particle effect parameters for comets
  this.comet_particles = [];
  this.comet_count = 5;

  this.initial_obstacle_count = 10;
  this.initial_collectible_count = 5;
  this.initial_powerup_count = 3;
  
  // Difficulty scaling parameters
  this.game_start_time = Date.now();
  this.collected_count = 0; // Tracks collection progress for achievement purposes
  this.max_collectibles = 20; // Max density of collectibles at highest difficulty

  /**
   * Creates AUTO enemy obstacles and positions them in a grid formation
   * @param {THREE.Scene} scene - The scene to add obstacles to
   * @param {THREE.Mesh} asteroid_mesh - The 3D model to use for enemy obstacles
   */
  this.initialiseAsteroids = function (scene, asteroid_mesh) {
    this.mode_began = true;

    // Define lane positions for consistent obstacle placement
    const positions = [
      { x: -2000, y: 375 },  // Left lane, lower position
      { x: -1000, y: 375 },  // Center-left lane, lower position
      { x: 0, y: 375 },      // Center lane, lower position
      { x: 1000, y: 375 },   // Center-right lane, lower position
      { x: 2000, y: 375 },   // Right lane, lower position
      { x: -2000, y: 1500 }, // Left lane, upper position
      { x: -1000, y: 1500 }, // Center-left lane, upper position
      { x: 0, y: 1500 },     // Center lane, upper position
      { x: 1000, y: 1500 },  // Center-right lane, upper position
      { x: 2000, y: 1500 }   // Right lane, upper position
    ];

    for (let i = 0; i < this.initial_obstacle_count; i++) {
      // Clone the mesh to avoid shared geometry issues
      const obstacle = asteroid_mesh.clone();
      
      // Standardize obstacle size for consistent gameplay experience
      const baseScale = 150;
      obstacle.scale.set(baseScale, baseScale, baseScale);

      // Position in lane grid using predefined coordinates
      const posIndex = i % positions.length;
      const pos = positions[posIndex];
      
      // Apply exact position from our lane configuration
      obstacle.position.x = pos.x;
      obstacle.position.y = pos.y;
      
      // Stagger obstacles with even spacing along z-axis
      obstacle.position.z = -50000 - (i * 5000);
      
      // Orient obstacles to face the player for better visual impact
      obstacle.rotation.y = Math.PI; // Face the player
      obstacle.rotation.x = 0;
      obstacle.rotation.z = 0;
      
      obstacle.name = "AUTO"; // Name for collision detection and game logic
      
      // Ensure all mesh components have proper naming and materials
      obstacle.traverse(function(node) {
        if (node.isMesh) {
          node.name = "AUTO_part";
          // Create unique material instances to prevent shared material issues
          if (node.material) {
            node.material = node.material.clone();
          }
        }
      });

      scene.add(obstacle);
      this.obstacles[i] = obstacle;

      // Apply minimal rotation to add visual interest
      this.obstacle_rotations[i] = [
        0.05, // Subtle rotation speed for x-axis
        0, // No y-axis rotation to maintain orientation
      ];
    }

    this.initial_obstacle_count += 2;
    
    // Initialize collectibles and powerups with same positioning logic
    this.initialiseCollectibles(scene);
    this.initialisePowerups(scene);

    return true;
  };
  
  /**
   * Initialises the collectible objects (metal and plastic only).
   */
  this.initialiseCollectibles = function(scene) {
    // Define fixed positions to match auto.glb - 3 lanes and 2 heights = 6 positions
    const positions = [
      { x: -1000, y: 375 },  // Left lane, lower position
      { x: 0, y: 375 },      // Center lane, lower position
      { x: 1000, y: 375 },   // Right lane, lower position
      { x: -1000, y: 1500 }, // Left lane, upper position
      { x: 0, y: 1500 },     // Center lane, upper position
      { x: 1000, y: 1500 }   // Right lane, upper position
    ];
    
    // Calculate how many collectibles to spawn based on game progress
    const gameTimeMinutes = (Date.now() - this.game_start_time) / 60000;
    const progressFactor = Math.min(1, gameTimeMinutes / 2); // Reach max difficulty after 2 minutes
    const collectibleCount = Math.floor(this.initial_collectible_count + 
                            (progressFactor * (this.max_collectibles - this.initial_collectible_count)));
    
    console.log(`Spawning ${collectibleCount} collectibles at game time: ${gameTimeMinutes.toFixed(2)} minutes`);
    
    // Track used positions to avoid overlap
    const usedPositions = new Map();
    
    for (let i = 0; i < collectibleCount; i++) {
      // Choose random collectible type - only metal or plastic (removed paper)
      let collectible;
      const randomType = Math.floor(Math.random() * 2); // Changed from 3 to 2
      
      if (randomType === 0 && window.metal_mesh) {
        collectible = window.metal_mesh.clone();
        collectible.name = "Metal";
        // Increased metal collectible size by 75%
        const metalScale = 175; // Increased from 75 to 175 (original 100 × 1.75)
        collectible.scale.set(metalScale, metalScale, metalScale);
      } else if (window.plastic_mesh) {
        collectible = window.plastic_mesh.clone();
        collectible.name = "Plastic";
        const baseScale = 50; // Plastic size remains the same
        collectible.scale.set(baseScale, baseScale, baseScale);
      }
      
      // Only proceed if we have a valid collectible
      if (collectible) {
        // Find an unused position
        let attempts = 0;
        let posIndex, pos, zPos;
        let positionKey;
        
        // Try to find a position that's not already used
        do {
          posIndex = i % positions.length;
          pos = positions[posIndex];
          
          // Space collectibles out in the z direction with increasing spread as game progresses
          // First one starts at -15000 and then they're separated by min 5000 units
          const baseSpacing = 5000 + (2000 * progressFactor); // Spacing increases with game progress
          zPos = -15000 - (i * baseSpacing) - (Math.random() * 3000);
          
          // Create a key for the position (rounded to nearest 1000 for z to create "zones")
          positionKey = `${pos.x},${pos.y},${Math.round(zPos/1000)*1000}`;
          attempts++;
        } while (usedPositions.has(positionKey) && attempts < 10);
        
        // Mark this position as used
        usedPositions.set(positionKey, true);
        
        // Position the collectible with exact coordinates
        collectible.position.x = pos.x;
        collectible.position.y = pos.y;
        collectible.position.z = zPos;
        
        scene.add(collectible);
        this.collectibles.push(collectible);
      }
      
      // Set rotation for coin-like effect
      this.collectible_rotations.push([
        0.05,  // Consistent rotation speed
        1      // Rotate around y-axis only (coin-like)
      ]);
    }
    
    return true;
  };
  
  /**
   * Initializes powerups (plant boot)
   */
  this.initialisePowerups = function(scene) {
    // Check if mesh is available
    if (!window.plant_boot_mesh) {
      console.error("Plant boot mesh not available - powerups not initialized");
      return false;
    }
    
    // Same positions as collectibles for consistency
    const positions = [
      { x: -1000, y: 375 },  // Left lane, lower position
      { x: 0, y: 375 },      // Center lane, lower position
      { x: 1000, y: 375 },   // Right lane, lower position
      { x: -1000, y: 1500 }, // Left lane, upper position
      { x: 0, y: 1500 },     // Center lane, upper position
      { x: 1000, y: 1500 }   // Right lane, upper position
    ];
    
    // Make sure to clear any existing powerups first
    for (let i = 0; i < this.powerups.length; i++) {
      if (this.powerups[i]) {
        scene.remove(this.powerups[i]);
      }
    }
    this.powerups = [];
    this.powerup_rotations = [];
    
    // Make powerups spawn at about half the frequency of collectibles
    // Calculate how many powerups to spawn based on game progress (similar to collectibles but halved)
    const gameTimeMinutes = (Date.now() - this.game_start_time) / 60000;
    const progressFactor = Math.min(1, gameTimeMinutes / 2); // Reach max difficulty after 2 minutes
    
    // Use half the number of collectibles (rounded up to ensure at least 2-3 powerups)
    const collectibleCount = Math.floor(5 + (progressFactor * 5)); // Base collectible formula: 5-10
    const powerupCount = Math.ceil(collectibleCount / 2); // About half as many powerups: 3-5
    
    console.log(`Spawning ${powerupCount} plant boot powerups at game time: ${gameTimeMinutes.toFixed(2)} minutes (half of ${collectibleCount} collectibles)`);
    
    // Track used positions to avoid overlap
    const usedPositions = new Map();
    
    for (let i = 0; i < powerupCount; i++) {
      const powerup = window.plant_boot_mesh.clone();
      powerup.name = "PlantBoot";
      
      // Use a consistent size
      const baseScale = 50;
      powerup.scale.set(baseScale, baseScale, baseScale);
      
      // Rotate the boot so the flat part points down
      powerup.rotation.x = Math.PI / 2; // 90 degrees around X-axis to match Wall-E
      powerup.rotation.y = Math.PI; // 180 degrees around Y-axis to match Wall-E
      
      // Find an unused position
      let attempts = 0;
      let posIndex, pos, zPos;
      let positionKey;
      
      // Try to find a position that's not already used
      do {
        posIndex = i % positions.length;
        pos = positions[posIndex];
        
        // Space powerups out with greater distance between them
        // First one starts at -20000 and then they're separated by 10000-15000 units
        // This is approximately twice the distance compared to collectibles
        const baseSpacing = 10000 + (Math.random() * 5000);
        zPos = -20000 - (i * baseSpacing) - (Math.random() * 5000);
        
        // Create a key for the position (rounded to nearest 1000 for z to create "zones")
        positionKey = `${pos.x},${pos.y},${Math.round(zPos/1000)*1000}`;
        attempts++;
      } while (usedPositions.has(positionKey) && attempts < 10);
      
      // Mark this position as used
      usedPositions.set(positionKey, true);
      
      // Position the powerup with exact coordinates
      powerup.position.x = pos.x;
      powerup.position.y = pos.y;
      powerup.position.z = zPos;
      powerup.visible = true; // Ensure visibility
      
      // Traverse through powerup mesh to ensure materials are properly set
      powerup.traverse(function(node) {
        if (node.isMesh) {
          // Ensure unique materials
          if (node.material) {
            node.material = node.material.clone();
            node.material.needsUpdate = true;
          }
        }
      });
      
      console.log(`Added plant boot powerup at position ${powerup.position.x}, ${powerup.position.y}, ${powerup.position.z}`);
      scene.add(powerup);
      this.powerups.push(powerup);
      
      // Give it a consistent rotation like collectibles
      this.powerup_rotations.push([
        0.05, // Consistent rotation speed
        1     // Rotate around y-axis only (coin-like)
      ]);
    }
    
    return true;
  };
  
  /**
   * Initialises the comet trail level.
   */
  this.initialiseCometTrail = function (scene, asteroid_mesh) {
    this.mode_began = true;

    for (let i = 0; i < this.comet_count; i++) {
      // Create comet
      const obstacle = asteroid_mesh.clone();
      obstacle.scale.set(
        obstacle.scale.x * (Math.random() + 0.75),
        obstacle.scale.y * (Math.random() + 0.75),
        obstacle.scale.z * (Math.random() + 0.75)
      );
      obstacle.position.x = -1000 + 1000 * Math.round(3 * Math.random() - 0.5);
      obstacle.position.y = 375 + Math.round(Math.random()) * 1125;
      obstacle.position.z =
        -50000 - i * (50000 / this.comet_count) - Math.random() * 1000;
      obstacle.name = "Comet Trail";

      scene.add(obstacle);
      this.obstacles[i] = obstacle;
      this.obstacle_rotations[i] = [
        Math.random() - 0.5,
        Math.round(Math.random() * 4 - 0.5),
      ];

      // Create comet particles that trail behind comet
      this.comet_particles[i] = [];
      for (let j = 0; j < 10; j++) {
        const geometry = new THREE.CircleGeometry(200, 16);

        var col = 0x40e0d0;

        const material = new THREE.MeshBasicMaterial({ color: col });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.x = this.obstacles[i].position.x;
        particle.position.y = this.obstacles[i].position.y;
        particle.position.z =
          this.obstacles[i].position.z - 500 - Math.random() * 7500;
        scene.add(particle);
        this.comet_particles[i][j] = particle;
      }
    }

    if (Math.random() < 0.5) this.comet_count++;
  };

  /**
   * Initialises the solar system level.
   */
  this.initialisePlanetMode = function (scene, planetMeshes) {
    this.mode_began = true;

    // Initialise planets
    for (let i = 0; i < this.planet_count; i++) {
      var mesh =
        planetMeshes[
          Math.round(Math.random() * planetMeshes.length - 0.5)
        ].clone();

      if (mesh.position.x != 0)
        mesh.position.x = -500 + 1000 * Math.round(2 * Math.random() - 0.5);

      mesh.position.y = 1000;
      mesh.position.z = -50000 - (i * 50000) / this.planet_count;

      // Give the mesh either left or right leaning rotation
      var rotMatrix = new THREE.Matrix4();
      var orientation = -1;
      if (Math.random() < 0.5) orientation = 1;

      // Create the rotation axis and apply to the mesh
      rotMatrix.makeRotationAxis(
        new THREE.Vector4(0, 0, 1).normalize(),
        (orientation * Math.PI) / 5
      );

      mesh.matrix.multiply(rotMatrix);

      mesh.rotation.setFromRotationMatrix(mesh.matrix);

      scene.add(mesh);

      this.obstacles[this.obstacles.length] = mesh;

      // Give the mesh a random rotation speed
      this.obstacle_rotations[this.obstacle_rotations.length] = [
        Math.random() - 0.5,
        1,
      ];
    }
  };

  /**
   * Moves obstacles forwards.
   */
  this.move = function (car_speed, scene, asteroid_mesh, planetMeshes) {
    // Define fixed positions for consistent reset positioning
    const positions = [
      { x: -2000, y: 375 },  // Left lane, lower position
      { x: -1000, y: 375 },  // Center-left lane, lower position
      { x: 0, y: 375 },      // Center lane, lower position
      { x: 1000, y: 375 },   // Center-right lane, lower position
      { x: 2000, y: 375 },   // Right lane, lower position
      { x: -2000, y: 1500 }, // Left lane, upper position
      { x: -1000, y: 1500 }, // Center-left lane, upper position
      { x: 0, y: 1500 },     // Center lane, upper position
      { x: 1000, y: 1500 },  // Center-right lane, upper position
      { x: 2000, y: 1500 }   // Right lane, upper position
    ];
    
    // Move all the objects forward
    for (let i = 0; i < this.obstacles.length; i++) {
      // If comet mode, move quicker than other modes
      if (
        (this.mode == 2 && this.mode_began) ||
        (!this.mode_began && this.last_mode == 2)
      ) {
        if (car_speed > 0) {
          this.obstacles[i].position.z += 2.5 * car_speed;
        } else {
          this.obstacles[i].position.z += 250;
        }

        // Move and update the particles trailing the comet
        if (this.comet_particles[i] != undefined) {
          for (let j = 0; j < this.comet_particles[i].length; j++) {
            this.comet_particles[i][j].position.z += car_speed;
            if (
              this.comet_particles[i][j].position.z <
                this.obstacles[i].position.z - 7500 ||
              this.comet_particles[i][j].position.z >
                this.obstacles[i].position.z
            ) {
              this.comet_particles[i][j].position.z =
                this.obstacles[i].position.z;
            }

            this.comet_particles[i][j].scale.x =
              1 -
              (this.obstacles[i].position.z -
                this.comet_particles[i][j].position.z) /
                7500;
            this.comet_particles[i][j].scale.y =
              1 -
              (this.obstacles[i].position.z -
                this.comet_particles[i][j].position.z) /
                7500;
          }
        }
      } else {
        // Otherwise, just move the object at the speed of the car
        this.obstacles[i].position.z += car_speed;
      }

      // Reset objects when they are out of view, also clear obstacles when next mode
      if (this.obstacles[i].position.z > 5000) {
        if ((this.mode == 0 || this.mode == 2) && this.mode_began) {
          // Select a fixed position for the reset object
          const posIndex = i % positions.length;
          const pos = positions[posIndex];
          
          // Use exact coordinates for consistent positioning
          this.obstacles[i].position.x = pos.x;
          this.obstacles[i].position.y = pos.y;
          this.obstacles[i].position.z = -50000 - (i * 5000);
          this.obstacles[i].visible = true; // Ensure AUTO is visible when respawned

          if (this.mode == 2) {
            for (let j = 0; j < this.comet_particles[i].length; j++) {
              this.comet_particles[i][j].position.x =
                this.obstacles[i].position.x;
              this.comet_particles[i][j].position.y =
                this.obstacles[i].position.y;
              this.comet_particles[i][j].position.z =
                this.obstacles[i].position.z - 500 - Math.random() * 7500;
            }
          }
        } else if (this.mode == 1 && this.mode_began) {
          if (this.obstacles[i].position.x != 0)
            this.obstacles[i].position.x =
              -500 + 1000 * Math.round(2 * Math.random() - 0.5);

          this.obstacles[i].position.y = 1000;
          this.obstacles[i].position.z -= 50000;
        } else if (!this.mode_began) {
          // Clear obstacles
          scene.remove(this.obstacles[i]);
          this.obstacles.splice(i, 1);
          this.obstacle_rotations.splice(i, 1);

          if (this.comet_particles[i] != undefined) {
            for (let j = 0; j < this.comet_particles[i].length; j++)
              scene.remove(this.comet_particles[i][j]);

            this.comet_particles.splice(i, 1);
          }
        }
      }
    }
    
    // Move collectibles forward
    for (let i = 0; i < this.collectibles.length; i++) {
      if (this.collectibles[i]) { // Make sure the collectible exists
        this.collectibles[i].position.z += car_speed;
        
        // Reset collectibles when they are out of view
        if (this.collectibles[i].position.z > 5000) {
          // Same positions as before
          const positions = [
            { x: -1000, y: 375 },  // Left lane, lower position
            { x: 0, y: 375 },      // Center lane, lower position
            { x: 1000, y: 375 },   // Right lane, lower position
            { x: -1000, y: 1500 }, // Left lane, upper position
            { x: 0, y: 1500 },     // Center lane, upper position
            { x: 1000, y: 1500 }   // Right lane, upper position
          ];
          
          // Calculate game progress for difficulty scaling
          const gameTimeMinutes = (Date.now() - this.game_start_time) / 60000;
          const progressFactor = Math.min(1, gameTimeMinutes / 2); // Reach max difficulty after 2 minutes
          
          // Track used positions to avoid overlap with existing collectibles
          const usedPositions = new Map();
          
          // Mark all existing collectible positions as used
          for (let j = 0; j < this.collectibles.length; j++) {
            if (j !== i && this.collectibles[j]) {
              const existing = this.collectibles[j];
              const posKey = `${existing.position.x},${existing.position.y},${Math.round(existing.position.z/1000)*1000}`;
              usedPositions.set(posKey, true);
            }
          }
          
          // Find an unused position
          let attempts = 0;
          let posIndex, pos, zPos;
          let positionKey;
          
          // Try to find a position that's not already used
          do {
            posIndex = (i + Math.floor(Math.random() * positions.length)) % positions.length;
            pos = positions[posIndex];
            
            // Space collectibles out with increasing density as game progresses
            const baseDistance = 35000;
            const spacing = 6000 - (2000 * progressFactor); // Spacing decreases with game progress (more collectibles)
            zPos = -baseDistance - (Math.random() * 15000) - (progressFactor * 5000);
            
            // Create a key for the position
            positionKey = `${pos.x},${pos.y},${Math.round(zPos/1000)*1000}`;
            attempts++;
          } while (usedPositions.has(positionKey) && attempts < 10);
          
          // Use exact coordinates for consistent positioning
          this.collectibles[i].position.x = pos.x;
          this.collectibles[i].position.y = pos.y;
          this.collectibles[i].position.z = zPos;
          this.collectibles[i].visible = true; // Reset visibility
          
          // Choose a new type randomly when respawning
          if (Math.random() < 0.5 && window.metal_mesh && this.collectibles[i].name !== "Metal") {
            // Remove the old collectible
            scene.remove(this.collectibles[i]);
            
            // Create a new metal collectible
            const newCollectible = window.metal_mesh.clone();
            newCollectible.name = "Metal";
            const metalScale = 175;
            newCollectible.scale.set(metalScale, metalScale, metalScale);
            
            // Position it
            newCollectible.position.x = pos.x;
            newCollectible.position.y = pos.y;
            newCollectible.position.z = zPos;
            
            scene.add(newCollectible);
            this.collectibles[i] = newCollectible;
          } else if (window.plastic_mesh && this.collectibles[i].name !== "Plastic") {
            // Remove the old collectible
            scene.remove(this.collectibles[i]);
            
            // Create a new plastic collectible
            const newCollectible = window.plastic_mesh.clone();
            newCollectible.name = "Plastic";
            const baseScale = 50;
            newCollectible.scale.set(baseScale, baseScale, baseScale);
            
            // Position it
            newCollectible.position.x = pos.x;
            newCollectible.position.y = pos.y;
            newCollectible.position.z = zPos;
            
            scene.add(newCollectible);
            this.collectibles[i] = newCollectible;
          }
        }
      }
    }
    
    // Move powerups forward
    for (let i = 0; i < this.powerups.length; i++) {
      // Move all powerups regardless of position
      this.powerups[i].position.z += car_speed;
      
      // Make the powerup bob up and down slightly
      this.powerups[i].position.y += Math.sin(Date.now() * 0.003) * 0.5;
      
      // Reset powerups when they are out of view
      if (this.powerups[i].position.z > 500) {
        this.resetPowerup(i);
      }
    }

    this.rotateObjects();

    // If objects cleared, initialise the objects for the new mode
    if (this.obstacles.length == 0 && !this.mode_began) {
      if (this.mode == 2) this.initialiseCometTrail(scene, asteroid_mesh);

      if (this.mode == 1) this.initialisePlanetMode(scene, planetMeshes);

      if (this.mode == 0) {
        this.initialiseAsteroids(scene, asteroid_mesh);
      }
    }
    
    // If collectibles array is empty or too small, add more collectibles
    // The size gradually increases with game progress
    const gameTimeMinutes = (Date.now() - this.game_start_time) / 60000;
    const progressFactor = Math.min(1, gameTimeMinutes / 2);
    const minCollectibles = Math.floor(5 + (progressFactor * 5)); // 5 at start, 10 at peak
    
    if (this.collectibles.length < minCollectibles) {
      this.initialiseCollectibles(scene);
    }
    
    // If powerups array is almost empty, add more powerups (but keep count lower than collectibles)
    // Calculate half the number of collectibles (rounded up) for powerups
    const collectibleCount = Math.floor(5 + (progressFactor * 5));
    const minPowerups = Math.ceil(collectibleCount / 2);
    
    // Only add new powerups if we have significantly fewer than the target
    if (this.powerups.length < Math.max(2, minPowerups - 1)) {
      this.initialisePowerups(scene);
    }
  };

  /**
   * Moves obstacles backwards in the z axis so that they are out of view.
   */
  this.moveOutOfView = function () {
    // Moves all the obstacles out of view
    for (let i = 0; i < this.obstacles.length; i++) {
      this.obstacles[i].position.z -= 55000;

      // Move and update the particles trailing the comet
      if (this.comet_particles[i] != undefined) {
        for (let j = 0; j < this.comet_particles[i].length; j++)
          this.comet_particles[i][j].position.z -= 55000;
      }
    }
  };

  /**
   * Rotates the obstacles.
   */
  this.rotateObjects = function () {
    // Rotate and reset objects when they pass
    for (let i = 0; i < this.obstacles.length; i++) {
      // Rotate objects
      if (
        ((this.mode == 0 || this.mode == 2) && this.mode_began) ||
        ((this.mode == 1 || this.mode == 2) && !this.mode_began)
      ) {
        if (this.obstacle_rotations[i][1] == 0) {
          // For AUTO objects, keep facing forward with minimal rotation
          if (this.obstacles[i].name === "AUTO") {
            // Keep AUTO facing the player with minimal or no rotation
            this.obstacles[i].rotation.y = Math.PI; // Always face player
            // Apply very minimal x rotation for slight movement
            this.obstacles[i].rotation.x += 0.01 * Math.sin(Date.now() * 0.001);
          } else {
            // For other objects, use the standard rotation
            this.obstacles[i].rotation.x += this.obstacle_rotations[i][0] / 10;
          }
        } else if (this.obstacle_rotations[i][1] == 1) {
          // For AUTO objects, keep facing forward with minimal rotation
          if (this.obstacles[i].name === "AUTO") {
            // Keep AUTO facing the player
            this.obstacles[i].rotation.y = Math.PI; // Always face player
          } else {
            // For other objects, use the standard rotation
            this.obstacles[i].rotation.y += this.obstacle_rotations[i][0] / 10;
          }
        } else if (this.obstacle_rotations[i][1] == 2) {
          this.obstacles[i].rotation.z += this.obstacle_rotations[i][0] / 10;
        }
      } else if (
        (this.mode == 1 && this.mode_began) ||
        (this.last_mode == 1 && this.mode == 0 && !this.mode_began)
      ) {
        // If in planet mode, rotate around a non-normal axis
        var axis = new THREE.Vector3(0, 1, 0);
        this.obstacles[i].rotateOnAxis(
          axis.normalize(),
          this.obstacle_rotations[i][0] / 10
        );
      }
    }
    
    // Rotate collectibles - coin-like Y-axis rotation only
    for (let i = 0; i < this.collectibles.length; i++) {
      if (this.collectible_rotations[i]) {
        // Only rotate around Y axis for coin-like effect
        this.collectibles[i].rotation.y += 0.02;
        
        // Reset any other rotations to keep them flat/aligned
        this.collectibles[i].rotation.x = 0;
        this.collectibles[i].rotation.z = 0;
      }
    }
    
    // Rotate powerups - coin-like Y-axis rotation only
    for (let i = 0; i < this.powerups.length; i++) {
      if (this.powerup_rotations[i]) {
        // Add a gentle Y-axis oscillation instead of continuous rotation
        // This looks better with the fixed orientation matching Wall-E
        const time = Date.now() * 0.001; // Time in seconds
        this.powerups[i].rotation.y = Math.PI + Math.sin(time * 1.5) * 0.1; // Oscillate ±0.1 radians around Math.PI
        
        // Keep the proper x-rotation for plant boot to match Wall-E
        this.powerups[i].rotation.x = Math.PI / 2;
        this.powerups[i].rotation.z = 0;
      }
    }
  };

  /**
   * Utility function that clears a list of objects from the scene.
   * @param {list} List of objects to remove.
   */
  this.clearListFromScene = function (list, scene) {
    for (var i = 0; i < list.length; i++) scene.remove(list[i]);

    list.length = 0;
  };

  /**
   * Resets the obstacles for the next round.
   */
  this.reset = function (scene) {
    // Clear existing objects from the scene
    this.clearListFromScene(this.obstacles, scene);
    this.clearListFromScene(this.collectibles, scene);
    this.clearListFromScene(this.powerups, scene);

    for (let i = 0; i < this.comet_particles.length; i++)
      this.clearListFromScene(this.comet_particles[i], scene);

    // Obstacles/scenery
    this.particles = [];
    this.obstacles = [];
    this.collectibles = [];
    this.powerups = [];

    this.obstacle_rotations = [];
    this.collectible_rotations = [];
    this.powerup_rotations = [];

    this.mode = 0;
    this.mode_began = true;

    // For comet trail
    this.comet_particles = [];
    this.last_mode = 0;

    this.initial_obstacle_count = 16;
    this.comet_count = 5;
    
    // Set initial collectible and powerup counts - powerups at about half the frequency
    this.initial_collectible_count = 5;
    this.initial_powerup_count = 3; // Was 5, now reduced to 3 (about half)
    
    // Reset game progress tracking
    this.game_start_time = Date.now();
    this.collected_count = 0;
  };

  /**
   * Returns int identifying the current level.
   */
  this.getMode = function () {
    return this.mode;
  };

  /**
   * Returns int identifying the previous level.
   */
  this.getLastMode = function () {
    return this.last_mode;
  };

  /**
   * Returns boolean indicating if last mode has completed and new mode
   * has begun.
   */
  this.getModeBegan = function () {
    return this.mode_began;
  };

  /**
   * Returns level summary for the dash.
   * @returns Current status.
   */
  this.getCurrentStatus = function () {
    return "WALL-E ACTIVE";
  };

  /**
   * Check for level changes based on the time variable.
   */
  this.modeChanges = function (last_time) {
    // Exit challenge level after 20 seconds
    if (
      this.mode != 0 &&
      Math.round(new Date().getTime() / 1000) >= last_time + 20
    ) {
      // Change modes
      this.last_mode = this.mode;
      if (this.mode == 1 && this.mode_began) {
        this.mode = 0;
        this.mode_began = false;
      } else if (this.mode == 2 && this.mode_began) {
        this.mode = 0;
        this.mode_began = false;
      }
    }

    // Change from default mode after 40 seconds
    if (Math.round(new Date().getTime() / 1000) >= last_time + 40) {
      // Change modes to random challenge mode
      this.mode = Math.round(Math.random() * 2 + 0.5);
      this.mode_began = false;
      this.last_mode = 0;

      return Math.round(new Date().getTime() / 1000);
    }
    return last_time;
  };

  /**
   * Get a random number between 0 and 1.
   * @returns Random float between 0 and 1.
   */
  this.random = function () {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  };

  // Get collectibles for collision detection
  this.getCollectibles = function() {
    return this.collectibles;
  };
  
  // Get powerups for collision detection
  this.getPowerups = function() {
    return this.powerups;
  };

  // Track when a collectible is collected to adjust difficulty
  this.collectibleCollected = function() {
    this.collected_count++;
    return this.collected_count;
  };

  /**
   * Reset a powerup to a new position
   * @param {number} index Index of the powerup to reset
   */
  this.resetPowerup = function(index) {
    if (!this.powerups[index]) {
      console.error("Cannot reset powerup - index out of bounds:", index);
      return;
    }
    
    // Same positions as before
    const positions = [
      { x: -1000, y: 375 },  // Left lane, lower position
      { x: 0, y: 375 },      // Center lane, lower position
      { x: 1000, y: 375 },   // Right lane, lower position
      { x: -1000, y: 1500 }, // Left lane, upper position
      { x: 0, y: 1500 },     // Center lane, upper position
      { x: 1000, y: 1500 }   // Right lane, upper position
    ];
    
    // Calculate game progress for difficulty scaling
    const gameTimeMinutes = (Date.now() - this.game_start_time) / 60000;
    const progressFactor = Math.min(1, gameTimeMinutes / 2); // Reach max difficulty after 2 minutes
    
    // Track used positions to avoid overlap with existing powerups
    const usedPositions = new Map();
    
    // Mark all existing powerup positions as used
    for (let j = 0; j < this.powerups.length; j++) {
      if (j !== index && this.powerups[j]) {
        const existing = this.powerups[j];
        const posKey = `${existing.position.x},${existing.position.y},${Math.round(existing.position.z/1000)*1000}`;
        usedPositions.set(posKey, true);
      }
    }
    
    // Find an unused position
    let attempts = 0;
    let posIndex, pos, zPos;
    let positionKey;
    
    // Try to find a position that's not already used
    do {
      posIndex = (index + Math.floor(Math.random() * positions.length)) % positions.length;
      pos = positions[posIndex];
      
      // Space powerups out similar to collectibles but more spread out
      // Base distance is longer to make them appear less often
      const baseDistance = 30000; // Increased from 15000
      const spacing = 7000 - (2000 * progressFactor); // Spacing decreases with game progress but still more spread out
      zPos = -baseDistance - (Math.random() * 10000) - (progressFactor * 5000);
      
      // Create a key for the position
      positionKey = `${pos.x},${pos.y},${Math.round(zPos/1000)*1000}`;
      attempts++;
    } while (usedPositions.has(positionKey) && attempts < 10);
    
    // Use exact coordinates for consistent positioning
    this.powerups[index].position.x = pos.x;
    this.powerups[index].position.y = pos.y;
    this.powerups[index].position.z = zPos;
    
    // Ensure boot has proper rotation
    this.powerups[index].rotation.x = Math.PI / 2;
    this.powerups[index].rotation.y = Math.PI;
    this.powerups[index].rotation.z = 0;
    
    this.powerups[index].visible = true; // Reset visibility
    console.log(`Reset plant boot powerup to position ${this.powerups[index].position.x}, ${this.powerups[index].position.y}, ${this.powerups[index].position.z}`);
  };
}
