import * as THREE from "../three.js-dev/build/three.module.js";
import { ShaderPass } from "../three.js-dev/examples/jsm/postprocessing/ShaderPass.js";

export default function Menu() {
	this.buttons = [];
	this.active = true;

	this.paused = false;
	this.pausePass;
	this.pausedTime;

	this.lastTimeWhenPaused;

	/**
	 * Toggles the pause menu.
	 */
	this.togglePauseMenu = function (composer, time, inHyper, wallE_x) {
		var time_difference = 0;

		if (this.paused) {
			this.paused = !this.paused;

			this.buttons[this.buttons.length-1].position.z -= 500;
			this.buttons[this.buttons.length-1].position.y -= 400;
			this.buttons[this.buttons.length-1].position.x = 0;
			
			composer.removePass(this.pausePass);

			this.hideGuide();

			time_difference =
				Math.round(new Date().getTime() / 1000) - this.pausedTime;

			return time + time_difference;
		} else if (!this.active) {
			this.paused = !this.paused;

			this.buttons[this.buttons.length-1].position.z += 500;
			this.buttons[this.buttons.length-1].position.y += 400;
			this.buttons[this.buttons.length-1].position.x = wallE_x;

			composer.addPass(this.pausePass);

			this.pausedTime = Math.round(new Date().getTime() / 1000);
			this.lastTimeWhenPaused = time;

			if (!inHyper) this.showGuide();
		}

		return time;
	};

	/**
	 * Return flag indicating if game is paused.
	 */
	this.isPaused = function () {
		return this.paused;
	};

	/**
	 * Initialises the textures and raycaster/mouse used by the menu.
	 */
	this.initialise = function (scene) {
		// Initialise start button texture
		// Add a timestamp to force the browser to load the updated image
		const timestamp = new Date().getTime();

		// Initialize menu buttons - create at least the required 4 buttons
		// The game expects buttons at indices 0-3 for setButtonsX
		// Start button (index 0)
		this.addButton(scene, "../Assets/Images/start.png", 0, 0, 0, 200, 100, "Start");
		
		// Placeholder buttons for indices 1, 2, 3
		// These are required because setButtonsX tries to access buttons 0-3
		for (let i = 1; i <= 3; i++) {
			this.addButton(scene, "../Assets/Images/display_instructions.png", 0, 0, 0, 10, 10, "Placeholder" + i);
			this.buttons[i].visible = false; // Hide them since they're just placeholders
		}
		
		// Guide button (last button - index 4)
		this.addButton(scene, "../Assets/Images/display_instructions.png", 0, 0, 0, 200, 100, "Guide");
		
		// Initialise the raycaster for the menu
		this.mouse = new THREE.Vector2();
		this.raycaster = new THREE.Raycaster();

		// Initialise the grayscale shader/pass 
		// https://en.wikipedia.org/wiki/Grayscale
		const pauseShader = {
			uniforms: {
				tDiffuse: { value: null },
			},
			vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
            }
            `,
			fragmentShader: `
            uniform sampler2D tDiffuse;
            varying vec2 vUv;

            void main() {
                vec4 color = texture2D(tDiffuse, vUv);
                float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                gl_FragColor = vec4(vec3(gray), 1.0);
            }
            `,
		};

		this.pausePass = new ShaderPass(pauseShader);
		this.pausePass.renderToScreen = true;
		
		console.log("Menu initialized with " + this.buttons.length + " buttons");
	};

	/**
	 * Adds a button to the menu.
	 */
	this.addButton = function(scene, path, x, y, z, width, height, name){
		// Initialise start button texture
		var texture = new THREE.TextureLoader().load(
			path
		);
		var material = new THREE.MeshBasicMaterial({ map: texture });
		material.transparent = true;
		material.opacity = 0.85;

		var index = this.buttons.length;

		this.buttons[index] = new THREE.Mesh(
			new THREE.PlaneGeometry(width, height, 10),
			material
		);

		this.buttons[index].overdraw = true;
		this.buttons[index].position.x = x;
		this.buttons[index].position.y = y;
		this.buttons[index].position.z = z;
		this.buttons[index].name = name;

		scene.add(this.buttons[index]);
	}

	/**
	 * Indicates if the menu is currently active.
	 */
	this.isActive = function () {
		return this.active;
	};

	/**
	 * Sets active status of menu.
	 */
	this.setActive = function (active) {
		this.active = active;
	};

	/**
	 * Animates the buttons by moving them into view.
	 */
	this.moveIn = function () {
		for (let i = 0; i < this.buttons.length - 1; i++) {
			if (this.buttons[i].position.z > -2500) this.buttons[i].position.z -= 50;
		}
	};

	/**
	 * Animates the buttons by moving them out of view.
	 */
	this.moveOut = function () {
		// Make sure buttons array has elements before trying to iterate
		if (!this.buttons || this.buttons.length === 0) {
			return; // Exit if buttons array is empty or undefined
		}

		for (let i = 0; i < this.buttons.length - 1; i++) {
			if (this.buttons[i]) {
				if (this.buttons[i].position.z < 1000) this.buttons[i].position.z += 50;
			}
		}

		// Add a safety check before setting visibility on the last button
		if (this.buttons.length > 0 && this.buttons[this.buttons.length-1]) {
			this.buttons[this.buttons.length-1].visible = false;
		}
	};

	/**
	 * Checks for a button press using the passed camera and raycaster, return 
	 * pressed button if pressed, and false otherwise.
	 */
	this.checkForPress = function (overhead_camera) {
		// Set the raycaster for button press detection
		this.raycaster.setFromCamera(this.mouse, overhead_camera);

		/* Check if the start button was pressed by finding intersections
        with the raycast and checking the mesh name. */
		var intersects = this.raycaster.intersectObjects(this.buttons);
		if (intersects.length > 0) {
			for (let i = 0; i < intersects.length; i++) {
				if (intersects[i].object.name == "Start"){
					this.buttons[this.buttons.length-1].visible = false;
					return "Start";
				}

				if (intersects[i].object.name == "Guide")
					this.buttons[this.buttons.length-1].visible = !this.buttons[this.buttons.length-1].visible;
			}
		}
		return false;
	};

	/**
	 * Updates the mouse position based on the passed event.
	 */
	this.updateMouse = function (event) {
		this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	};

	/**
	 * Sets the position of the buttons.
	 */
	this.setButtonsX = function (x) {
		// Add safety checks for each button
		if (this.buttons.length > 0 && this.buttons[0]) {
			this.buttons[0].position.x = x;
		}
		if (this.buttons.length > 1 && this.buttons[1]) {
			this.buttons[1].position.x = x;
		}
		if (this.buttons.length > 2 && this.buttons[2]) {
			this.buttons[2].position.x = x;
		}
		if (this.buttons.length > 3 && this.buttons[3]) {
			this.buttons[3].position.x = x;
		}
	};

	/**
	 * Hides the instructions from view.
	 */
	this.hideGuide = function () {
		this.buttons[this.buttons.length-1].visible = false;
	}

	/**
	 * Shows the instructions.
	 */
	this.showGuide = function(){
		this.buttons[this.buttons.length-1].visible = true;
	}
}
