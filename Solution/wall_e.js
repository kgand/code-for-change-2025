import * as THREE from "../three.js-dev/build/three.module.js";

export default function WallE() {
	this.wallE_mesh;

	this.wallE_speed = 1;
	this.wallE_speed_cap = 300;
	this.initial_max_speed = 75;
	this.game_start_time = Date.now(); // Track when the game started
	this.speed_increase_factor = 0.02; // How much to increase speed over time

	// For floor planes
	this.wallE_hitbox;

	// For wallE animation
	this.sin_z = 0.0;
	this.sin_y = 0.0;

	// For lane change animation
	this.lane_sep = 1000;
	this.double = false;

	this.wallE_center_offset = 0;

	this.start_pos_x;
	this.target_pos_x;
	this.lane_change_iters = 45;
	this.lane_change = false;
	this.move_iters = 0;
	this.flip_iters = 0;

	// For height change animation
	this.height_sep = 1000;

	this.wallE_height_offset = 0;

	this.start_pos_y;
	this.target_pos_y;
	this.height_change_iters = 28;
	this.curr_height_change_iters = 0;
	this.height_change = false;

	this.particles = [];

	this.explosion_mesh;
	this.explosion_particles = [];
	this.explosion_particle_directions = [];
	this.engines = [];
	this.engine_directions = [];
	this.engine_fall_speeds = [];

	this.smashed_speed;
	this.explosion_complete = false;

	this.current_col = 1;
	this.current_row = 0;

	this.game_over_speed;

	/**
	 * Initialises the textures and raycaster/mouse used by the menu.
	 */
	this.initialise = function (scene) {
		this.initialiseRearParticles(scene);

		// Initialise the wallE hitbox - make it significantly larger to improve collision detection
		var cubeGeometry = new THREE.BoxGeometry(450, 350, 800);
		var wireMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			wireframe: true,
		});
		this.wallE_hitbox = new THREE.Mesh(cubeGeometry, wireMaterial);
		this.wallE_hitbox.position.set(0, 450, -2500);
		this.wallE_hitbox.visible = false;
		this.wallE_hitbox.name = "wallE Hitbox";
		scene.add(this.wallE_hitbox);
	};

	/**
	 * @returns Vertical lane seperation.
	 */
	this.getHeightSep = function () {
		return this.height_sep;
	};

	/**
	 * Get lane change flag..
	 * @returns Indicates if wallE is currently changing lane.
	 */
	this.isChangingLane = function () {
		return this.lane_change;
	};

	/**
	 * Get height change flag.
	 * @returns Indicates if wallE is currently changing height.
	 */
	this.isChangingHeight = function () {
		return this.height_change;
	};

	/**
	 * Set the class meshes to the loaded meshes.
	 * @param {*} wallE_mesh Imported wallE mesh.
	 */
	this.initialiseMeshes = function (wallE_mesh) {
		this.wallE_mesh = wallE_mesh;
		// Removed references to smashed_wallE_mesh and engine_mesh since they are not used
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
	 * Reset the wallE for a new game.
	 * @param {} scene Scene for old objects to be removed.
	 */
	this.reset = function (scene) {
		this.clearListFromScene(this.explosion_particles, scene);
		this.clearListFromScene(this.particles, scene);
		this.clearListFromScene(this.engines, scene);

		this.initialiseRearParticles(scene);

		if (this.explosion_mesh != undefined){
			scene.remove(this.explosion_mesh);
			this.explosion_mesh = undefined;
		}

		this.lane_change = false;
		this.move_iters = 0;
		this.flip_iters = 0;
		this.lane_change_iters = 45;

		this.curr_height_change_iters = 0;
		this.height_change = false;

		this.explosion_complete = false;

		// We don't use smashed_wallE_mesh for WallE
		// Just reset the original wallE_mesh (WallE)
		this.wallE_mesh.visible = true;
		this.wallE_speed = 0;
		this.game_start_time = Date.now(); // Reset the game timer
		this.collectedObject = null;
		this.collectedPowerup = null;
		
		// Keep WallE in his default imported orientation without any rotation
		this.wallE_mesh.rotation.x = Math.PI / 2; // Match initial rotation from Subwaste Surfer.html
		this.wallE_mesh.rotation.y = Math.PI; // Rotate 180 degrees around Y axis (facing backward)
		this.wallE_mesh.rotation.z = 0;
		
		// Reset any stored original rotation
		this.original_rotation = {
			x: Math.PI / 2,
			y: Math.PI,
			z: 0
		};
		
		// Update WallE's reset position to match the initial position
		this.wallE_mesh.position.x = 200; // Start slightly to the right
		this.wallE_center_offset = 0;
		this.wallE_mesh.position.y = 500; // Higher position
		this.wallE_mesh.position.z = 1500; // Further back

		this.start_pos_y = this.wallE_mesh.position.y;
		this.target_pos_y = this.wallE_mesh.position.y;

		this.wallE_height_offset = 0;

		this.current_col = 1;
		this.current_row = 0;

		this.resetEffects(scene);
		
		// Clear any references to hit AUTO objects
		this.hitAutoObject = null;
	};

	/**
	 * Returns the wallE's current speed.
	 */
	this.getSpeed = function () {
		return this.wallE_speed;
	};

	/**
	 * Returns the wallE's speed when the game ended.
	 */
	this.getEndSpeed = function () {
		return this.game_over_speed;
	};

	/**
	 * Allows the wallE's speed to be set.
	 * @param {float} speed
	 */
	this.setSpeed = function (speed) {
		this.wallE_speed = speed;
	};

	/**
	 * This is the function that initialises the game over animation
	 * when the player hits an obstacle.
	 */
	this.hit = function (scene) {
		this.game_over_speed = this.wallE_speed;
		this.smashed_speed = this.wallE_speed;
		this.wallE_speed = 0;

		// Make brake light particles invisible
		for (let i = 0; i < this.particles.length; i++)
			this.particles[i].visible = false;

		// Create a small spark effect instead of a large explosion
		const geometry = new THREE.IcosahedronGeometry(30, 2);
		var col = 0x00ffff; // Blue spark color for WallE
		const material = new THREE.MeshBasicMaterial({ color: col });
		this.explosion_mesh = new THREE.Mesh(geometry, material);

		scene.add(this.explosion_mesh);

		this.explosion_mesh.position.x = this.wallE_mesh.position.x;
		this.explosion_mesh.position.y = this.wallE_mesh.position.y;
		this.explosion_mesh.position.z = this.wallE_mesh.position.z + 100;

		// Initialise a few sparks instead of explosion particles
		for (let i = 0; i < 20; i++) {
			const geometry = new THREE.IcosahedronGeometry(
				3 + 5 * Math.random(),
				2
			);
			var col;

			var rand = Math.random();

			if (rand < 0.3) {
				col = 0x00ffff; // Cyan for electrical sparks
			} else if (rand < 0.6) {
				col = 0xffffff; // White sparks
			} else {
				col = 0x0000ff; // Blue sparks
			}

			const material = new THREE.MeshBasicMaterial({ color: col });
			this.explosion_particles[i] = new THREE.Mesh(geometry, material);

			this.explosion_particles[i].position.x = this.wallE_mesh.position.x;
			this.explosion_particles[i].position.y = this.wallE_mesh.position.y;
			this.explosion_particles[i].position.z = this.wallE_mesh.position.z;

			scene.add(this.explosion_particles[i]);

			this.explosion_particle_directions[i] = [
				Math.random() * 2 * Math.PI,
				(Math.random() * Math.PI) / 2,
			];
		}

		// We don't need falling engine parts for WallE
		// Just store the original position and rotation for use in afterHitPhysics
		this.original_position = {
			x: this.wallE_mesh.position.x,
			y: this.wallE_mesh.position.y,
			z: this.wallE_mesh.position.z
		};
		
		this.original_rotation = {
			x: this.wallE_mesh.rotation.x,
			y: this.wallE_mesh.rotation.y,
			z: this.wallE_mesh.rotation.z
		};
	};

	/**
	 * This function is executed after the hit function and gives the
	 * WallE collapse animation when the game is over.
	 */
	this.afterHitPhysics = function () {
		// Displays small spark effect, then handles WallE collapsing
		if (this.explosion_mesh.scale.x > 3 && !this.explosion_complete) {
			this.explosion_complete = true;
			this.explosion_mesh.visible = false;
			
			// Ensure WallE maintains the correct rotation
			this.wallE_mesh.rotation.x = Math.PI / 2;
			this.wallE_mesh.rotation.y = Math.PI;
			this.wallE_mesh.rotation.z = 0;
		} else {
			// Explosion expands until desired radius reached
			this.explosion_mesh.scale.x *= 1.25;
			this.explosion_mesh.scale.y *= 1.25;
		}

		/* Move the small spark particles */
		for (let i = 0; i < this.explosion_particles.length; i++) {
			if (this.explosion_particles[i].position.y >= 50) {
				this.explosion_particles[i].position.x +=
					20 * Math.sin(this.explosion_particle_directions[i][0]);
				this.explosion_particles[i].position.y +=
					20 * Math.sin(this.explosion_particle_directions[i][1]) - 5;
				this.explosion_particles[i].position.z +=
					20 * Math.cos(this.explosion_particle_directions[i][0]) - 10;

				this.explosion_particle_directions[i][1] -= 0.05;
			}
		}

		/* Once the explosion is complete, animate WallE collapsing */
		if (this.explosion_complete) {
			// Gradually tilt WallE forward as if collapsing - disabled to keep default orientation
			// if (this.wallE_mesh.rotation.x > -Math.PI/3) {
			// 	this.wallE_mesh.rotation.x -= 0.02;
			// }
			
			// Make WallE sink down a bit
			if (this.wallE_mesh.position.y > 200) {
				this.wallE_mesh.position.y -= (this.wallE_mesh.position.y - 200) / 30;
			}
			
			// Move WallE slightly forward as it collapses
			this.wallE_mesh.position.z -= this.smashed_speed / 5;
			this.smashed_speed /= 1.05;
			
			// Add a slight wobble to the collapse - disabled to keep default orientation
			// this.wallE_mesh.rotation.z += Math.sin(Date.now() / 200) * 0.01;
		}
	};

	/**
	 * Controls the movement of the wallE based on the user input.
	 */
	this.move = function () {
		this.rearParticles();

		// Check if wallE_mesh exists before accessing its properties
		if (!this.wallE_mesh) {
			console.warn("wallE mesh not initialized");
			return;
		}

		// Move wallE forwards when game started - adjust the target position
		if (this.wallE_mesh.position.z > -2000) // Changed from -2500 to -2000 to keep WallE closer to the camera
			this.wallE_mesh.position.z += (-2000 - this.wallE_mesh.position.z) * 0.04; // Slower movement (0.04 instead of 0.05)

		// Update wallE speed
		if (!this.lane_change && !this.height_change) {
			// Calculate how long the game has been running in seconds
			const gameTimeSeconds = (Date.now() - this.game_start_time) / 1000;
			
			// Increase speed cap based on game time - the longer the game runs, the faster it gets
			const timeBasedSpeedCap = this.wallE_speed_cap + (gameTimeSeconds * this.speed_increase_factor * this.wallE_speed_cap);
			
			// Apply the normal speed acceleration, but with a gradually increasing speed cap
			if (this.wallE_speed < this.initial_max_speed)
				this.wallE_speed +=
					(this.initial_max_speed - this.wallE_speed) / this.initial_max_speed;

			if (this.wallE_speed < timeBasedSpeedCap)
				this.wallE_speed +=
					0.08 * // Increased from 0.05 for faster acceleration
					(timeBasedSpeedCap - this.wallE_speed) / timeBasedSpeedCap;

			if (this.wallE_speed > this.initial_max_speed)
				this.lane_change_iters = 45 - Math.round(this.wallE_speed / 10);
		}

		// Ambient movement
		if (!this.lane_change && this.wallE_mesh != undefined) {
			// Disable rotation to keep WallE in default orientation
			// this.wallE_mesh.rotation.z = Math.sin((this.sin_z += 0.05 * Math.random())) / 10;
			// this.wallE_mesh.rotation.y = Math.sin((this.sin_y += 0.03 * Math.random())) / 25;
		}

		this.horizontalMovement();

		this.verticalMovement();
	};

	/**
	 * Controls the horizontal movement/animation of the wallE.
	 */
	this.horizontalMovement = function () {
		// Sideways flip animation
		if (this.lane_change && this.move_iters < this.lane_change_iters) {
			// Get influence of current iteration
			var move_influence =
				Math.abs(this.move_iters - this.lane_change_iters) /
				((this.lane_change_iters * (1 + this.lane_change_iters)) / 2);
			var flip_influence =
				Math.abs(this.flip_iters - this.lane_change_iters) /
				((this.lane_change_iters * (1 + this.lane_change_iters)) / 2);

			// Perform the rotation based on influences
			if (this.target_pos_x < this.start_pos_x) {
				// Disable rotation to keep WallE in default orientation
				// this.wallE_mesh.rotation.z += 2 * Math.PI * flip_influence;
			} else {
				// Disable rotation to keep WallE in default orientation
				// this.wallE_mesh.rotation.z -= 2 * Math.PI * flip_influence;
			}

			// Move the wallE based on influence
			this.wallE_mesh.position.x +=
				move_influence * (this.target_pos_x - this.start_pos_x);

			this.move_iters++;
			if (this.flip_iters < this.lane_change_iters) this.flip_iters++;
		} else if (this.lane_change) {
			// End of flip reached so reset variables
			this.wallE_center_offset = this.target_pos_x;
			this.lane_change = false;
			this.move_iters = 0;
			this.flip_iters = 0;
			this.double = false;
		}
	};

	/**
	 * Controls the vertical movement/animation of the wallE.
	 */
	this.verticalMovement = function () {
		// Upwards/downwards movement
		if (
			this.height_change &&
			this.curr_height_change_iters < this.height_change_iters
		) {
			// Calculate influence
			var influence =
				Math.abs(this.curr_height_change_iters - this.height_change_iters) /
				((this.height_change_iters * (1 + this.height_change_iters)) / 2);

			// Rotate wallE based on movement direction
			if (this.target_pos_y > this.start_pos_y) {
				// Disable rotation to keep WallE in default orientation
				// this.wallE_mesh.rotation.x -= 0.001 * (this.curr_height_change_iters - (this.height_change_iters - 1) / 2);
			} else {
				// Disable rotation to keep WallE in default orientation
				// this.wallE_mesh.rotation.x += 0.001 * (this.curr_height_change_iters - (this.height_change_iters - 1) / 2);
			}

			// Update wallE y position
			this.wallE_height_offset +=
				influence * (this.target_pos_y - this.start_pos_y);
			this.wallE_mesh.position.y = this.start_pos_y + this.wallE_height_offset;

			this.curr_height_change_iters++;
		} else if (this.height_change) {
			// End of movement reached so reset variables
			this.wallE_mesh.position.y = this.target_pos_y;
			this.wallE_height_offset = 0;
			this.height_change = false;
			this.curr_height_change_iters = 0;
		}
	};

	/**
	 * Initialises the particles that come from the wallE's tail lights.
	 */
	this.initialiseRearParticles = function (scene) {
		for (let i = 0; i < 50; i++) {
			const boxWidth = 5,
				boxHeight = 5,
				boxDepth = 5;
			const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

			// Select orange, red, or white
			var col;
			var rand = Math.random();
			if (rand < 0.3) {
				col = 0xff0000;
			} else if (rand < 0.6) {
				col = 0xffff00;
			} else {
				col = 0xffffff;
			}

			// Create mesh with selected colour and add to scene
			const material = new THREE.MeshBasicMaterial({ color: col });
			const particle = new THREE.Mesh(geometry, material);

			particle.position.x = (Math.random() - 0.5) * 500;
			particle.position.y = -10000;
			particle.position.z = -2500 + Math.random() * 3000;
			particle.name = "Rear Particle";

			scene.add(particle);
			this.particles[i] = particle;
		}
	};

	/**
	 * Animates the rear particles.
	 */
	this.rearParticles = function () {
		for (let i = 0; i < this.particles.length; i++) {
			// Move the particle a random amount in z axis towards camera
			this.particles[i].position.z += Math.random() * this.wallE_speed;
			if (this.wallE_mesh != undefined && this.particles[i].position.z > -250) {
				// Move back to random x position when out of view
				var distance;
				if (Math.random() < 0.5) {
					distance = 100 + Math.random() * 125;
				} else {
					distance = -100 - Math.random() * 125;
				}

				// Scale the position to match wallE rotation
				var height_increase = 50;
				this.particles[i].position.x =
					this.wallE_mesh.position.x -
					height_increase * Math.sin(Math.PI - this.wallE_mesh.rotation.z) +
					distance * Math.cos(this.wallE_mesh.rotation.z);
				this.particles[i].position.y =
					this.wallE_mesh.position.y -
					height_increase * Math.cos(Math.PI - this.wallE_mesh.rotation.z) +
					distance * Math.sin(this.wallE_mesh.rotation.z);
				this.particles[i].position.z = this.wallE_mesh.position.z + 350;
			}
		}
	};

	/**
	 * Moves the wallE upwards.
	 */
	this.moveUp = function () {
		if (!this.height_change && this.wallE_mesh.position.y < 950) {
			this.height_change = true;
			this.start_pos_y = this.wallE_mesh.position.y;
			this.target_pos_y = this.wallE_mesh.position.y + this.height_sep;

			this.current_row = 1;

			return true;
		}
		return false;
	};

	/**
	 * Moves the wallE upwards.
	 */
	this.moveTo = function (target_y) {
		if (!this.height_change) {
			this.height_change = true;
			this.start_pos_y = this.wallE_mesh.position.y;
			this.target_pos_y = target_y;

			this.current_row = 0;

			return true;
		}
		return false;
	};

	/**
	 * Moves the wallE down.
	 */
	this.moveDown = function () {
		if (!this.height_change && this.wallE_mesh.position.y > 550) {
			this.height_change = true;
			this.start_pos_y = this.wallE_mesh.position.y;
			this.target_pos_y = this.wallE_mesh.position.y - this.height_sep;

			this.current_row = 0;

			return true;
		}
		return false;
	};

	/**
	 * Moves the wallE right.
	 */
	this.moveRight = function () {
		if (!this.lane_change && this.wallE_center_offset != this.lane_sep) {
			// Normal lane change
			this.lane_change = true;
			this.start_pos_x = this.wallE_center_offset;
			this.target_pos_x = this.start_pos_x + this.lane_sep;

			this.current_col++;

			return true;
		} else if (
			this.lane_change &&
			this.target_pos_x > this.start_pos_x &&
			!this.double &&
			this.target_pos_x != this.lane_sep &&
			this.flip_iters < this.lane_change_iters / 2
		) {
			// Double lane change
			this.target_pos_x += this.lane_sep;
			this.start_pos_x = this.wallE_mesh.position.x;
			this.double = true;
			this.move_iters = 0;

			this.current_col++;
		}
		return false;
	};

	/**
	 * Moves the wallE left.
	 */
	this.moveLeft = function () {
		if (!this.lane_change && this.wallE_center_offset != -this.lane_sep) {
			// Normal lane change
			this.lane_change = true;
			this.start_pos_x = this.wallE_center_offset;
			this.target_pos_x = this.start_pos_x - this.lane_sep;

			this.current_col--;

			return true;
		} else if (
			this.lane_change &&
			this.target_pos_x < this.start_pos_x &&
			!this.double &&
			this.target_pos_x != -this.lane_sep &&
			this.flip_iters < this.lane_change_iters / 2
		) {
			// Double lane change
			this.target_pos_x -= this.lane_sep;
			this.start_pos_x = this.wallE_mesh.position.x;
			this.double = true;
			this.move_iters = 0;

			this.current_col--;
		}

		return false;
	};

	/**
	 * Detects collisions with objects and notifies the game when a
	 * collision has occurred.
	 */
	this.collisionDetection = function (obstacles, scene) {
		// Can't have collision detection if wallE mesh or hitbox doesn't exist
		if (this.wallE_hitbox == undefined || this.wallE_mesh == undefined) {
			return false;
		}

		// Update hitbox to be in same position as wallE
		this.updateHitBox();

		if (obstacles.obstacles) {
			// Ray directions for expanded collision detection
			const directions = [
				new THREE.Vector3(0, 0, 1),  // Forward
				new THREE.Vector3(1, 0, 0),  // Right
				new THREE.Vector3(-1, 0, 0), // Left
				// Add diagonal vectors for better collision detection
				new THREE.Vector3(0.5, 0, 1).normalize(),
				new THREE.Vector3(-0.5, 0, 1).normalize(),
			];

			// Ray length for collision checking
			const rayLength = 350;

			for (let i = 0; i < directions.length; i++) {
				// Create the raycast
				const raycaster = new THREE.Raycaster(
					this.wallE_mesh.position,
					directions[i],
					0,
					rayLength
				);

				// Check for collisions with obstacles
				const collisionResults = raycaster.intersectObjects(obstacles.obstacles);

				if (
					collisionResults.length > 0 &&
					collisionResults[0].distance < rayLength
				) {
					// Special handling for AUTO - make it disintegrate on impact
					if (collisionResults[0].object.name && collisionResults[0].object.name.includes("AUTO") || 
						collisionResults[0].object.name && collisionResults[0].object.name.includes("Auto")) {
						
						// Check if player has godmode (invincibility from plant boot)
						// Only check godmode for AUTO enemies, not other obstacles
						if (typeof godmode !== 'undefined' && godmode === true) {
							// Player has invincibility - create disintegration effect for AUTO
							this.createDisintegrationEffect(collisionResults[0].object, scene);
							
							// Find the parent AUTO object in the obstacles array and hide it
							for (let i = 0; i < obstacles.obstacles.length; i++) {
								if (obstacles.obstacles[i] && 
								   (obstacles.obstacles[i].name === "Auto" || obstacles.obstacles[i].name === "AUTO")) {
									// Check if this is the same AUTO that was hit
									if (obstacles.obstacles[i].position.distanceTo(collisionResults[0].object.position) < 500) {
										obstacles.obstacles[i].visible = false;
										// Also hide all children
										obstacles.obstacles[i].traverse(function(child) {
											child.visible = false;
										});
									}
								}
							}
							// Return false since player has godmode and shouldn't be affected by AUTO
							return false;
						}
						
						// No godmode - create disintegration effect for AUTO
						this.createDisintegrationEffect(collisionResults[0].object, scene);
						
						// Find the parent AUTO object in the obstacles array and hide it
						for (let i = 0; i < obstacles.obstacles.length; i++) {
							if (obstacles.obstacles[i] && 
							   (obstacles.obstacles[i].name === "Auto" || obstacles.obstacles[i].name === "AUTO")) {
								// Check if this is the same AUTO that was hit
								if (obstacles.obstacles[i].position.distanceTo(collisionResults[0].object.position) < 500) {
									obstacles.obstacles[i].visible = false;
									// Also hide all children
									obstacles.obstacles[i].traverse(function(child) {
										child.visible = false;
									});
								}
							}
						}
					}
					
					// If not in comet mode, hide the hit object
					if (
						!(
							(obstacles.getMode() == 2 && obstacles.getModeBegan()) ||
							(!obstacles.getModeBegan() && obstacles.getMode() == 2)
						)
					)
						collisionResults[0].object.visible = false;

					// If game is not over, initialise game ending
					return true;
				}
			}
			
			// Check for collectibles
			if (obstacles.getCollectibles) {
				var collectibleResults = [];
				
				// Increase the number of raycasts for better collision detection
				const rayDirections = [
					new THREE.Vector3(0, 0, 1),    // forward
					new THREE.Vector3(0, 0, -1),   // backward
					new THREE.Vector3(1, 0, 0),    // right
					new THREE.Vector3(-1, 0, 0),   // left
					new THREE.Vector3(0, 1, 0),    // up
					new THREE.Vector3(0, -1, 0),   // down
					new THREE.Vector3(1, 1, 1).normalize(),  // diagonal
					new THREE.Vector3(-1, 1, 1).normalize(), // diagonal
					new THREE.Vector3(1, -1, 1).normalize(), // diagonal
					new THREE.Vector3(-1, -1, 1).normalize(), // diagonal
					new THREE.Vector3(1, 0, 1).normalize(),  // more directions
					new THREE.Vector3(-1, 0, 1).normalize(), // more directions
					new THREE.Vector3(0, 1, 1).normalize(),  // more directions
					new THREE.Vector3(0, -1, 1).normalize(),  // more directions
					// Additional rays for better coverage
					new THREE.Vector3(0.5, 0, 1).normalize(),
					new THREE.Vector3(-0.5, 0, 1).normalize(),
					new THREE.Vector3(0, 0.5, 1).normalize(),
					new THREE.Vector3(0, -0.5, 1).normalize(),
					new THREE.Vector3(0.5, 0.5, 1).normalize(),
					new THREE.Vector3(-0.5, 0.5, 1).normalize(),
					new THREE.Vector3(0.5, -0.5, 1).normalize(),
					new THREE.Vector3(-0.5, -0.5, 1).normalize()
				];
				
				// Use fixed distance raycasts from wallE center for more reliable detection
				const rayLength = 300; // Increased to improve detection
				
				for (let dir of rayDirections) {
					// Create the raycast
					var ray = new THREE.Raycaster(
						this.wallE_mesh.position,
						dir,
						0,
						rayLength
					);

					// See if the ray intersects a collectible
					var results = ray.intersectObjects(obstacles.getCollectibles());
					if (results.length > 0 && results[0].object.visible) {
						collectibleResults.push(results[0]);
					}
				}
				
				// Spherical collision check for better detection
				if (collectibleResults.length === 0) {
					// Get visible collectibles
					const collectibles = obstacles.getCollectibles().filter(c => c.visible);
					
					// Check direct distance between wallE and collectibles
					for (let collectible of collectibles) {
						// Use a larger collision sphere - 400 units radius
						const collisionDistance = 400;
						const distance = this.wallE_mesh.position.distanceTo(collectible.position);
						
						if (distance < collisionDistance) {
							// We have a collision based on proximity
							console.log("Spherical collision with", collectible.name, "at distance", distance);
							collectibleResults.push({object: collectible});
						}
					}
				}
				
				// Process collectibles (get points)
				for (var i = 0; i < collectibleResults.length; i++) {
					var collectible = collectibleResults[i].object;
					if (collectible.visible) {
						collectible.visible = false;
						console.log("Collected item:", collectible.name); // Debug logging
						
						// Map object names to collectible types - simplified to Metal and Plastic only
						if (collectible.name.includes("Metal") || collectible.name.includes("metal")) {
							this.collectedObject = "Metal";
							break; // Only collect one item per collision detection cycle
						} else {
							// All other items mapped to Plastic (including Water bottles)
							this.collectedObject = "Plastic";
							console.log("Item mapped to Plastic category:", collectible.name);
							break; // Only collect one item per collision detection cycle
						}
					}
				}
			}
			
			// Check for powerups (plant boot)
			if (obstacles.getPowerups) {
				var powerupResults = [];
				
				// Use the same expanded ray directions for consistency
				const rayDirections = [
					new THREE.Vector3(0, 0, 1),    // forward
					new THREE.Vector3(0, 0, -1),   // backward
					new THREE.Vector3(1, 0, 0),    // right
					new THREE.Vector3(-1, 0, 0),   // left
					new THREE.Vector3(0, 1, 0),    // up
					new THREE.Vector3(0, -1, 0),   // down
					new THREE.Vector3(1, 1, 1).normalize(),  // diagonal
					new THREE.Vector3(-1, 1, 1).normalize(), // diagonal
					new THREE.Vector3(1, -1, 1).normalize(), // diagonal
					new THREE.Vector3(-1, -1, 1).normalize(), // diagonal
					new THREE.Vector3(1, 0, 1).normalize(),  // more directions
					new THREE.Vector3(-1, 0, 1).normalize(), // more directions
					new THREE.Vector3(0, 1, 1).normalize(),  // more directions
					new THREE.Vector3(0, -1, 1).normalize(),  // more directions
					// Additional rays for better coverage
					new THREE.Vector3(0.5, 0, 1).normalize(),
					new THREE.Vector3(-0.5, 0, 1).normalize(),
					new THREE.Vector3(0, 0.5, 1).normalize(),
					new THREE.Vector3(0, -0.5, 1).normalize(),
					new THREE.Vector3(0.5, 0.5, 1).normalize(),
					new THREE.Vector3(-0.5, 0.5, 1).normalize(),
					new THREE.Vector3(0.5, -0.5, 1).normalize(),
					new THREE.Vector3(-0.5, -0.5, 1).normalize()
				];
				
				// Use fixed distance raycasts from wallE center for more reliable detection
				const rayLength = 300; // Increased to improve detection
				
				for (let dir of rayDirections) {
					// Create the raycast
					var ray = new THREE.Raycaster(
						this.wallE_mesh.position,
						dir,
						0,
						rayLength
					);

					// See if the ray intersects a powerup
					var results = ray.intersectObjects(obstacles.getPowerups());
					if (results.length > 0 && results[0].object.visible) {
						powerupResults.push(results[0]);
					}
				}
				
				// Spherical collision check for better detection
				if (powerupResults.length === 0) {
					// Get visible powerups
					const powerups = obstacles.getPowerups().filter(p => p.visible);
					
					// Check direct distance between wallE and powerups
					for (let powerup of powerups) {
						// Use a larger collision sphere - 400 units radius
						const collisionDistance = 400;
						const distance = this.wallE_mesh.position.distanceTo(powerup.position);
						
						if (distance < collisionDistance) {
							// We have a collision based on proximity
							console.log("Spherical collision with powerup", powerup.name, "at distance", distance);
							powerupResults.push({object: powerup});
						}
					}
				}
				
				// Process powerups
				for (var i = 0; i < powerupResults.length; i++) {
					var powerup = powerupResults[i].object;
					if (powerup.visible) {
						powerup.visible = false;
						console.log("Collected powerup:", powerup.name); // Debug logging
						
						// Map powerup names to consistent types
						if (powerup.name.includes("PlantBoot") || powerup.name.includes("Boot") || 
							powerup.name.includes("Object_2")) {
							this.collectedPowerup = "PlantBoot";
							console.log("Boot powerup detected and mapped correctly");
						}
					}
				}
			}
			
			return false;
		}
	};

	/**
	 * Returns the current wallE position.
	 */
	this.getPosition = function () {
		return [this.current_col, this.current_row];
	};

	/**
	 * Updates the position of the wallE hit box by simply setting
	 * rotation and position to the wallE's position and rotation.
	 */
	this.updateHitBox = function () {
		if (this.wallE_hitbox != undefined && this.wallE_mesh != undefined) {
			// Update position
			this.wallE_hitbox.position.x = this.wallE_mesh.position.x;
			this.wallE_hitbox.position.y = this.wallE_mesh.position.y;
			this.wallE_hitbox.position.z = this.wallE_mesh.position.z;

			// Update rotation
			this.wallE_hitbox.rotation.x = this.wallE_mesh.rotation.x;
			this.wallE_hitbox.rotation.y = this.wallE_mesh.rotation.y;
			this.wallE_hitbox.rotation.z = this.wallE_mesh.rotation.z;
		}
	};

	/**
	 * Get a random number between 0 and 1.
	 * @returns Random float between 0 and 1.
	 */
	this.random = function () {
		const x = Math.sin(this.seed++) * 10000;
		return x - Math.floor(x);
	};

	/**
	 * Gets the name of any object that was just collected.
	 * Returns the name and clears the value.
	 */
	this.getCollectedObject = function() {
		var collected = this.collectedObject;
		this.collectedObject = null;
		return collected;
	};
	
	/**
	 * Gets the name of any powerup that was just collected.
	 * Returns the name and clears the value.
	 */
	this.getCollectedPowerup = function() {
		var powerup = this.collectedPowerup;
		this.collectedPowerup = null;
		return powerup;
	};

	/**
	 * Creates a disintegration effect for the AUTO model
	 * @param {*} autoObject The AUTO object that was hit
	 * @param {*} scene The scene to add particles to
	 */
	this.createDisintegrationEffect = function(autoObject, scene) {
		if (!autoObject || !scene) return;
		
		// Store original properties
		const originalPosition = {
			x: autoObject.position.x,
			y: autoObject.position.y,
			z: autoObject.position.z
		};
		
		// Create particles for disintegration effect
		const particleCount = 50;
		const particles = [];
		const particleDirections = [];
		
		for (let i = 0; i < particleCount; i++) {
			const geometry = new THREE.IcosahedronGeometry(5 + 10 * Math.random(), 1);
			
			// Red color for AUTO particles
			let color = 0xff0000;
			if (Math.random() > 0.7) {
				color = 0xffffff; // Some white particles for contrast
			}
			
			const material = new THREE.MeshBasicMaterial({ color: color });
			particles[i] = new THREE.Mesh(geometry, material);
			
			// Position around AUTO's position
			particles[i].position.x = originalPosition.x + (Math.random() - 0.5) * 100;
			particles[i].position.y = originalPosition.y + (Math.random() - 0.5) * 100;
			particles[i].position.z = originalPosition.z + (Math.random() - 0.5) * 100;
			
			// Add to scene immediately
			scene.add(particles[i]);
			
			// Random direction for particles to fly
			particleDirections[i] = [
				(Math.random() - 0.5) * 15,
				(Math.random() - 0.5) * 15,
				(Math.random() - 0.5) * 15
			];
		}
		
		// Save these for animation
		this.autoDisintegrationParticles = particles;
		this.autoParticleDirections = particleDirections;
		this.autoDisintegrationActive = true;
		this.disintegrationScene = scene;
		
		// Hide the original AUTO object and its parent
		autoObject.visible = false;
		
		// Find and hide the entire AUTO object in the scene
		// This ensures all parts of AUTO are hidden
		scene.traverse(function(object) {
			if (object.name === "Auto" || object.name === "AUTO") {
				object.visible = false;
			}
		});
		
		// Store the hit AUTO object to ensure it stays hidden
		this.hitAutoObject = autoObject;
	};
	
	// Update the afterHitPhysics function to properly handle scene reference
	const originalAfterHitPhysics = this.afterHitPhysics;
	this.afterHitPhysics = function() {
		// Call the original function
		originalAfterHitPhysics.call(this);
		
		// Animate AUTO disintegration particles if active
		if (this.autoDisintegrationActive && this.autoDisintegrationParticles && this.disintegrationScene) {
			let allParticlesDone = true;
			
			for (let i = 0; i < this.autoDisintegrationParticles.length; i++) {
				if (this.autoDisintegrationParticles[i].visible) {
					allParticlesDone = false;
					
					// Move particles based on their direction
					this.autoDisintegrationParticles[i].position.x += this.autoParticleDirections[i][0];
					this.autoDisintegrationParticles[i].position.y += this.autoParticleDirections[i][1];
					this.autoDisintegrationParticles[i].position.z += this.autoParticleDirections[i][2];
					
					// Add gravity effect
					this.autoParticleDirections[i][1] -= 0.2;
					
					// Shrink particles over time
					this.autoDisintegrationParticles[i].scale.x *= 0.95;
					this.autoDisintegrationParticles[i].scale.y *= 0.95;
					this.autoDisintegrationParticles[i].scale.z *= 0.95;
					
					// Rotate particles for effect
					this.autoDisintegrationParticles[i].rotation.x += 0.1;
					this.autoDisintegrationParticles[i].rotation.y += 0.1;
					
					// If particles get too small, remove them
					if (this.autoDisintegrationParticles[i].scale.x < 0.1) {
						this.disintegrationScene.remove(this.autoDisintegrationParticles[i]);
						this.autoDisintegrationParticles[i].visible = false;
					}
				}
			}
			
			// If all particles are done, clean up
			if (allParticlesDone) {
				this.autoDisintegrationActive = false;
				this.autoDisintegrationParticles = null;
				this.autoParticleDirections = null;
			}
		}
	};

	/**
	 * Resets all effects and particles.
	 * Add this to the reset function.
	 */
	this.resetEffects = function(scene) {
		// Clean up AUTO disintegration particles
		if (this.autoDisintegrationParticles) {
			for (let i = 0; i < this.autoDisintegrationParticles.length; i++) {
				if (this.autoDisintegrationParticles[i] && scene) {
					scene.remove(this.autoDisintegrationParticles[i]);
				}
			}
			this.autoDisintegrationParticles = null;
			this.autoParticleDirections = null;
			this.autoDisintegrationActive = false;
		}
		
		// Clear the hitAUTO object reference
		this.hitAutoObject = null;
	};

	/**
	 * This initialises the collision hitbox mesh.
	 */
	this.initialiseHitBox = function(scene){
		// Create bigger hitbox for better collision detection
		var cubeGeometry = new THREE.BoxGeometry(550, 450, 850);
		var wireMaterial = new THREE.MeshBasicMaterial({
			color : 0xff0000,
			wireframe: true, 
			transparent: true,
			opacity: 0.0,
		});
		
		this.wallE_hitbox = new THREE.Mesh(cubeGeometry, wireMaterial);
		this.wallE_hitbox.position.x = 0;
		this.wallE_hitbox.position.y = 450;
		this.wallE_hitbox.position.z = -2500;
		this.wallE_hitbox.visible = false; // Keep invisible for game aesthetics
		this.wallE_hitbox.name = "wallE Hitbox";
		
		scene.add(this.wallE_hitbox);
	};
}
