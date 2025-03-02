import * as THREE from "../three.js-dev/build/three.module.js";
import { ImprovedNoise } from "../three.js-dev/examples/jsm/math/ImprovedNoise.js";

export default function Scenery() {
  this.buildings = [];
  this.building_tops = [];

  this.seed = Math.PI / 4;

  this.iters = 0;
  this.reset_second_floor_flag = true;
  this.plane_x = 15000;
  this.plane_y = 75000;
  this.init_offset = 5000;

  this.worldWidth = 256;
  this.worldDepth = 256;

  this.topHeight = 100;

  /**
   * Sets up the game environment including floors, buildings, lighting and skybox
   * @param {THREE.Scene} scene - The scene to add environment elements to
   * @param {THREE.Camera} camera - The camera for attaching lights
   */
  this.initialise = function (scene, camera) {
    // Set up perlin noise for procedural terrain generation
    this.z = this.random() * 100;

    this.perlin = new ImprovedNoise();

    this.initialiseFloors(scene, this.init_offset);

    this.initialiseBuildings(scene, 0);

    this.initialiseLighting(scene, camera);

    this.initialiseMoon(scene);
  };

  /**
   * Creates waste pile buildings that line the sides of the roadway
   * Uses procedural generation for variety in building shapes and sizes
   * @param {THREE.Scene} scene - The scene to add buildings to
   * @param {number} y_pos - The base Y position for buildings
   */
  this.initialiseBuildings = function (scene, y_pos) {
    var positions = [11000, -11000];
    
    // Load waste texture once for performance optimization
    const textureLoader = new THREE.TextureLoader();
    const wasteTexture = textureLoader.load('../Assets/Images/waste.jpg');
    // Configure texture for tiling and better visual appearance
    wasteTexture.wrapS = THREE.RepeatWrapping;
    wasteTexture.wrapT = THREE.RepeatWrapping;
    wasteTexture.repeat.set(1, 1);

    for (let j = 0; j < positions.length; j++) {
      var buildingsWidth = 0;

      // Generate buildings to fill player's view distance
      while (buildingsWidth < 50000) {
        const boxDepth = 5000 + Math.random(2500),
          boxHeight = 6000 + 5000 * Math.random(),
          boxWidth = 5000;

        buildingsWidth += boxDepth;

        // Use textured material for waste piles instead of solid color
        const material = new THREE.MeshStandardMaterial({
          map: wasteTexture,
          metalness: 0.3,
          roughness: 0.7,
        });

        // Earthy, rusty colors for building tops to represent oxidized/aged waste
        var topColors = [
          0x5d432c, // dark brown
          0x654321, // brown
          0x704214, // rust brown
          0x8B4513, // saddle brown
          0xA0522D  // sienna
        ];
        
        var col = topColors[Math.floor(Math.random() * topColors.length)];

        // Subtle emissive effect for visual interest in dark environment
        const top_material = new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.2, // Low intensity for subtle glow
          metalness: 0.4,
          roughness: 0.8
        });

        // Randomly alternate between cylindrical and box-shaped waste piles
        var geometry;
        var top_geometry;
        if (Math.random() < 0.5) {
          geometry = new THREE.CylinderGeometry(
            boxDepth / 2,
            boxDepth / 2,
            boxHeight,
            32
          );

          top_geometry = new THREE.CylinderGeometry(
            boxDepth / 2,
            boxDepth / 2,
            this.topHeight,
            32
          );
        } else {
          geometry = new THREE.BoxGeometry(
            boxWidth,
            boxHeight,
            boxDepth,
            1,
            1,
            1
          );

          top_geometry = new THREE.BoxGeometry(
            boxWidth,
            this.topHeight,
            boxDepth,
            1,
            1,
            1
          );
        }

        // Create the building mesh
        var building = new THREE.Mesh(geometry, material);
        building.position.x = positions[j];
        building.position.y = y_pos + boxHeight / 2 - 1000;
        building.position.z = -buildingsWidth - boxDepth;
        building.name = "Building Mesh";

        // Create the building top
        var top = new THREE.Mesh(top_geometry, top_material);
        top.position.x = positions[j];
        top.position.y = y_pos + boxHeight - 1000 + this.topHeight / 2;
        top.position.z = -buildingsWidth - boxDepth;
        top.name = "Building Top Mesh";

        scene.add(top);
        scene.add(building);

        this.building_tops[this.building_tops.length] = top;
        this.buildings[this.buildings.length] = building;
      }
    }
  };

  /**
   * Initialise the moon.
   */
  this.initialiseMoon = function (scene) {
    const moon_shape = new THREE.Shape();

    moon_shape.absarc(0, 0, 12000);

    const segments = 100;
    const geometry = new THREE.ShapeGeometry(moon_shape, segments / 2);

    // Generate the shader material used for the moon's gradient
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
        }
        `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float time;

        void main() {
          // Normalize coordinates to center the moon
          vec2 uv = vUv * 2.0 - 1.0;
          
          // Calculate distance from center
          float dist = length(uv);
          
          // Basic moon shape (circle)
          float moon = smoothstep(1.0, 0.95, dist);
          
          // Create crescent effect by subtracting a shifted circle
          float crescent = smoothstep(0.8, 0.75, length(uv - vec2(0.2, 0.0)));
          
          // Make crescent effect less pronounced
          float shape = moon - crescent * 0.6;
          
          // Add some noise/texture to the moon surface
          float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
          
          // Create crater effect
          float crater = smoothstep(0.05, 0.0, abs(noise - 0.5) - 0.25) * 0.1;
          
          // Moon colors - brighter white/blue
          vec3 moonColor = vec3(1.0, 1.0, 1.0);
          vec3 craterColor = vec3(0.9, 0.95, 1.0);
          
          // Mix colors based on crater effect
          vec3 finalColor = mix(moonColor, craterColor, crater);
          
          // Apply shape mask with higher intensity overall
          finalColor *= shape;
          
          // Boost brightness to make the moon more visible
          finalColor = finalColor * 1.5;
          
          gl_FragColor = vec4(finalColor, shape);
        }
        `,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Set moon position - move it to be more visible in the scene
    mesh.position.y = 7000;
    mesh.position.x = 10000;
    mesh.position.z = -40000;

    scene.add(mesh);
    
    // Store the mesh and material for animation
    this.moon_mesh = mesh;
    this.moon_material = material;
  };

  /**
   * Moves the buildings along at the same speed as the terrain,
   * resetting if they are no longer in view.
   */
  this.move = function (scene, speed) {
    for (let i = 0; i < this.buildings.length; i++) {
      if (this.buildings[i] != undefined) {
        this.buildings[i].position.z += speed;
        this.building_tops[i].position.z += speed;

        if (this.buildings[i].position.z > -250) {
          this.buildings[i].position.z -= 50000;
          this.building_tops[i].position.z -= 50000;
        }
      }
    }

    this.moveFloors(scene, speed);
    
    // Update moon animation
    this.moveMoon();
  };

  /**
   * Utility function that converts RGB values to hex.
   */
  this.rgbToHex = function (r, g, b) {
    return "0x" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  /**
   * Initialises the floor terrain panels.
   */
  this.initialiseFloors = function (scene, z_offset) {
    // Load the grass texture first - similar to how waste.jpg is handled
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load('../Assets/Textures/grass.jpg');
    
    // Configure texture immediately
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(10, 50); // More visible repeat pattern
    grassTexture.anisotropy = 4;
    grassTexture.colorSpace = THREE.SRGBColorSpace;
    
    console.log("Loading grass texture from: ../Assets/Textures/grass.jpg");
    
    // For floor mesh 1
    var data = this.generateHeight(this.worldWidth, this.worldDepth);
    var geometry = new THREE.PlaneGeometry(
      this.plane_x,
      this.plane_y,
      this.worldWidth - 1,
      this.worldDepth - 1
    );
    geometry.rotateX(-Math.PI / 2);

    // Amplify the generated height y values, and move down by z offset
    var vertices = geometry.attributes.position.array;
    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
      vertices[j + 1] = data[i] * 10;
      vertices[j + 2] -= z_offset;
    }

    // Create material with the texture that's already loaded
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: grassTexture,
      color: 0xffffff, // White color to show texture accurately
      roughness: 0.9,
      metalness: 0.1
    });

    // Create floor mesh 1
    this.floor_mesh_1 = new THREE.Mesh(geometry, floorMaterial);
    this.floor_mesh_1.name = "Floor Mesh 1";
    this.floor_mesh_1.receiveShadow = true;
    scene.add(this.floor_mesh_1);

    // For floor mesh 2
    data = this.generateHeight(this.worldWidth, this.worldDepth);
    geometry = new THREE.PlaneGeometry(
      this.plane_x,
      this.plane_y,
      this.worldWidth - 1,
      this.worldDepth - 1
    );
    geometry.rotateX(-Math.PI / 2);

    vertices = geometry.attributes.position.array;
    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
      vertices[j + 1] = data[i] * 10;
      vertices[j + 2] -= this.plane_y + z_offset;
    }

    // Create floor mesh 2 with the same material (sharing the texture)
    this.floor_mesh_2 = new THREE.Mesh(geometry, floorMaterial.clone());
    this.floor_mesh_2.name = "Floor Mesh 2";
    this.floor_mesh_2.receiveShadow = true;
    scene.add(this.floor_mesh_2);
  };

  /**
   * Moves the floor terrain panels backwards when behind camera.
   */
  this.updateFloor = function (scene, floor, z_offset) {
    const data = this.generateHeight(this.worldWidth, this.worldDepth);
    const geometry = new THREE.PlaneGeometry(
      this.plane_x,
      this.plane_y,
      this.worldWidth - 1,
      this.worldDepth - 1
    );
    geometry.rotateX(-Math.PI / 2);

    const vertices = geometry.attributes.position.array;

    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
      vertices[j + 1] = data[i] * 10;
      vertices[j + 2] -= this.plane_y + z_offset;
    }

    // Clone the material to preserve the texture
    const materialToUse = (floor == 1) ? 
      this.floor_mesh_2.material.clone() : 
      this.floor_mesh_1.material.clone();

    if (floor == 1) {
      scene.remove(this.floor_mesh_1);
      this.floor_mesh_1 = new THREE.Mesh(geometry, materialToUse);
      this.floor_mesh_1.position.z = this.floor_mesh_2.position.z - 75000;
      this.floor_mesh_1.receiveShadow = true;
      scene.add(this.floor_mesh_1);
    } else if (floor == 2) {
      scene.remove(this.floor_mesh_2);
      this.floor_mesh_2 = new THREE.Mesh(geometry, materialToUse);
      this.floor_mesh_2.position.z = this.floor_mesh_1.position.z - 75000;
      this.floor_mesh_2.receiveShadow = true;
      scene.add(this.floor_mesh_2);
    }
  };

  /**
   * Generates the heights used by the floor panels.
   */
  this.generateHeight = function (width, height) {
    const size = width * height,
      data = new Uint8Array(size);
    let quality = 50;

    for (let i = 0; i < size; i++) {
      const x = i % width,
        y = width - ~~(i / width);

      // Used to create flat area in middle and flat edges
      var influence =
        Math.abs(width / 4 - Math.abs(Math.abs(x - width / 2) - width / 4)) /
        100;
      var close_to_centre = (Math.abs(x - width / 2) - 25) / 4;

      // Used perlin noise to get value if not in the flat area
      if (Math.abs(x - width / 2) > 25) {
        data[i] +=
          influence *
          close_to_centre *
          Math.abs(
            this.perlin.noise(
              x / quality,
              ((width - 1) * this.iters + y) / quality,
              this.z
            ) * quality
          );
      }
    }

    this.iters++;
    return data;
  };

  /**
   * Generates the textures used by the floor panels.
   */
  this.generateTexture = function (data, width, height, reverse) {
    let context, image, imageData;

    const vector3 = new THREE.Vector3(0, 0, 0);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    context = canvas.getContext("2d");
    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);

    image = context.getImageData(0, 0, canvas.width, canvas.height);
    imageData = image.data;

    for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
      vector3.x = data[j - 2] - data[j + 2];
      vector3.y = 2;
      vector3.z = data[j - width * 2] - data[j + width * 2];
      vector3.normalize();

      const x = (i / 4) % width,
        y = ~~(i / 4 / width);

      // Replace neon grid colors with earthy, dirt-like colors
      var col1 = [61, 43, 31]; // Dark brown
      var col2 = [46, 30, 17]; // Darker brown

      // Add the lines to the texture
      if (x % 8 == 0 || y % 4 == 0) {
        // Set rgb values of lines with scale function
        if (!reverse) {
          imageData[i] = this.scale(y, 0, width, col1[0], col2[0]);
          imageData[i + 1] = this.scale(y, 0, width, col1[1], col2[1]);
          imageData[i + 2] = this.scale(y, 0, width, col1[2], col2[2]);
          imageData[i + 3] = 45;
        } else {
          imageData[i] = this.scale(y, 0, width, col2[0], col1[0]);
          imageData[i + 1] = this.scale(y, 0, width, col2[1], col1[1]);
          imageData[i + 2] = this.scale(y, 0, width, col2[2], col1[2]);
          imageData[i + 3] = 45;
        }
      } else if (Math.abs(x - width / 2) > 23) {
        // Set rgb values of area with scale function - change to earth tones instead of purple
        imageData[i] = this.scale(
          Math.abs(x - width / 2),
          0,
          width / 2,
          20,
          70
        ); // Red component
        imageData[i + 1] = this.scale(
          Math.abs(x - width / 2),
          0,
          width / 2,
          15,
          50
        ); // Green component
        imageData[i + 2] = this.scale(
          Math.abs(x - width / 2),
          0,
          width / 2,
          10,
          30
        ); // Blue component
      }
    }

    context.putImageData(image, 0, 0);

    // Scaled 4x
    const canvasScaled = document.createElement("canvas");
    canvasScaled.width = width * 4;
    canvasScaled.height = height * 4;

    context = canvasScaled.getContext("2d");
    context.scale(4, 4);
    context.drawImage(canvas, 0, 0);

    image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
    imageData = image.data;

    for (let i = 0, l = imageData.length; i < l; i += 4) {
      const v = ~~(Math.random() * 5);

      imageData[i] += v;
      imageData[i + 1] += v;
      imageData[i + 2] += v;
    }

    context.putImageData(image, 0, 0);

    return canvasScaled;
  };

  /**
   * Function that cycles the floor panels for smooth terrain generation.
   */
  this.moveFloors = function (scene, speed) {
    // Increment floor positions
    this.floor_mesh_1.position.z += speed;
    this.floor_mesh_2.position.z += speed;

    // Reset the floors if needed
    if (this.floor_mesh_1.position.z > 2 * this.plane_y) {
      this.updateFloor(scene, 1, this.init_offset);
    } else if (
      this.floor_mesh_2.position.z > this.plane_y &&
      this.reset_second_floor_flag
    ) {
      this.updateFloor(scene, 1, this.init_offset);
      this.reset_second_floor_flag = false;
    } else if (this.floor_mesh_2.position.z > 2 * this.plane_y) {
      this.updateFloor(scene, 2, this.init_offset);
    }
  };

  /**
   * Simple scaling function, maps values in a range to values in
   * a different range.
   */
  this.scale = function (number, inMin, inMax, outMin, outMax) {
    return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  };

  /**
   * Initialises the lighting used by the game, 3 sources of light,
   * 2 spotlights (wall-e headlights and moon), and ambient light.
   */
  this.initialiseLighting = function (scene, camera) {
    // Add balanced ambient light - warmer, more earthy tone
    const light = new THREE.AmbientLight(0x5a4b3e, 0.8); // Warmer ambient light
    scene.add(light);

    // Update moonlight with warmer, less blue color
    var moonlight = new THREE.SpotLight(0xeae3d2); // Warmer light color
    moonlight.intensity = 1.2;
    moonlight.distance = 50000; // Long distance but not infinite
    moonlight.angle = Math.PI / 4; // Moderate angle
    moonlight.penumbra = 0.5; // Soft edges
    moonlight.decay = 0.2; // Some decay for realistic falloff
    moonlight.position.set(
      camera.position.x,
      camera.position.y + 2500,
      camera.position.z - 50000
    );
    moonlight.target.position.set(0, camera.position.y, camera.position.z);
    scene.add(moonlight);
    scene.add(moonlight.target);

    // Add headlight spotlight with warmer, dustier color
    var headlights = new THREE.SpotLight(0xfff2db); // Warmer light
    headlights.intensity = 1.8;
    headlights.distance = 10000;
    headlights.angle = Math.PI / 3; // Narrower angle
    headlights.penumbra = 0.3;
    headlights.decay = 0.2; // Some decay for realistic falloff
    headlights.target.position.set(
      camera.position.x,
      camera.position.y + 1000,
      camera.position.z - 5000
    );
    headlights.position.set(0, camera.position.y, camera.position.z - 3100);
    scene.add(headlights);
    scene.add(headlights.target);
    
    // Add subtle global directional light like distant sunlight (dusty and warm)
    var starLight = new THREE.DirectionalLight(0xceb897, 0.6); // Warmer sunlight
    starLight.position.set(10000, 10000, 10000);
    scene.add(starLight);
    
    // Add fill lights with earthier tones
    var fillLight1 = new THREE.DirectionalLight(0xc9a87c, 0.4); // Warm fill
    fillLight1.position.set(-5000, 3000, 0);
    scene.add(fillLight1);
    
    var fillLight2 = new THREE.DirectionalLight(0xc9a87c, 0.4); // Warm fill
    fillLight2.position.set(5000, 3000, 0);
    scene.add(fillLight2);
    
    // Add backlight with dusty amber color
    var backLight = new THREE.DirectionalLight(0xdaa06d, 0.3); // Dusty amber
    backLight.position.set(0, 2000, 5000);
    scene.add(backLight);
  };

  /**
   * Get a random number between 0 and 1.
   * @returns Random float between 0 and 1.
   */
  this.random = function () {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  };

  // Add this to the move function to animate the moon
  this.moveMoon = function() {
    if (this.moon_material && this.moon_mesh) {
      // Update time uniform for potential animation effects
      this.moon_material.uniforms.time.value += 0.01;
      
      // Add a slight floating motion to the moon to make it more noticeable
      this.moon_mesh.position.y += Math.sin(this.moon_material.uniforms.time.value * 0.2) * 0.5;
    }
  };
}
