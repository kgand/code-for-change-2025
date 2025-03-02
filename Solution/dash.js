import * as THREE from "../three.js-dev/build/three.module.js";

export default function Dash() {
  this.charge_height = 5;
  this.charge_x = 450;
  
  this.last_hyper = 0;

  /**
   * Resets the position of the HTML text on screen so that is matches
   * with its position on the dashboard texture.
   */
  this.initialise = function (scene) {
    // Initialise speed text - moved more to the left
    this.speed_text = document.createElement("div");
    this.speed_text.style.position = "absolute";
    this.speed_text.style.fontSize =
      Math.min(
        (48 / 937) * window.innerHeight,
        (48 / 1365) * window.innerWidth
      ) + "px";
    this.speed_text.style.top = 0.877 * window.innerHeight + "px";
    this.speed_text.style.left =
      window.innerWidth / 5 - 2.2 * window.innerHeight + "px"; // Moved even further to the left
    this.speed_text.style.color = "gray";

    // Initialise score text
    this.score_text = document.createElement("div");
    this.score_text.style.position = "absolute";
    this.score_text.style.fontSize =
      Math.min(
        (56 / 937) * window.innerHeight,
        (56 / 1365) * window.innerWidth
      ) + "px";
    this.score_text.style.top = 0.877 * window.innerHeight + "px";
    this.score_text.style.right =
      window.innerWidth / 2 - 0.175 * window.innerHeight + "px";
    this.score_text.style.color = "gray";

    // Initialise status text
    this.status_text = document.createElement("div");
    this.status_text.style.position = "absolute";
    this.status_text.style.fontSize =
      Math.min(
        (32 / 937) * window.innerHeight,
        (32 / 1365) * window.innerWidth
      ) + "px";
    this.status_text.style.top = 0.943 * window.innerHeight + "px";
    this.status_text.style.left =
      window.innerWidth / 2 - 0.08 * window.innerHeight + "px";
    this.status_text.style.color = "gray";

    // Add to page
    document.body.appendChild(this.score_text);
    document.body.appendChild(this.speed_text);
    document.body.appendChild(this.status_text);

    // Initialise the dash texture
    var texture = new THREE.TextureLoader().load(
      "../Assets/Images/dash.png"
    );
    var material = new THREE.MeshBasicMaterial({ map: texture });
    material.transparent = true;
    material.opacity = 0.85;

    this.dash = new THREE.Mesh(new THREE.PlaneGeometry(1269, 325), material);
    this.dash.overdraw = true;
    this.dash.position.x = 0;
    this.dash.position.y = 230;
    this.dash.position.z = -1600;
    this.dash.name = "Dash";

    // Add all to the scene
    scene.add(this.dash);
  };

  /**
   * Updates the components of the dash.
   */
  this.update = function (
    carSpeed,
    score,
    xPosition
  ) {
    this.dash.position.x = xPosition;

    // Set speed and score text
    this.speed_text.innerHTML = Math.round(carSpeed);
    this.score_text.innerHTML = Math.round(score);
  };

  /**
   * Shows the dashboard when called.
   */
  this.show = function () {
    this.dash.visible = true;
    // Removed speed_dial visibility setting
    // this.hyper_charge.visible = true;

    this.speed_text.style.opacity = 1.0;
    this.status_text.style.opacity = 1.0;
    this.score_text.style.opacity = 1.0;
  };

  /**
   * Hides the dashboard when called.
   */
  this.hide = function () {
    this.dash.visible = false;
    // Removed speed_dial visibility setting
    this.hyper_charge.visible = false;

    this.speed_text.style.opacity = 0.0;
    this.status_text.style.opacity = 0.0;
    this.score_text.style.opacity = 0.0;
  };

  /**
   * Resets the position of the HTML text on screen so that is matches
   * with its position on the dashboard texture.
   */
  this.resetText = function () {
    // Initialise speed text - positioned further to the left
    this.speed_text.style.fontSize =
      Math.min(
        (48 / 937) * window.innerHeight,
        (48 / 1365) * window.innerWidth
      ) + "px";
    this.speed_text.style.top = 0.877 * window.innerHeight + "px";
    this.speed_text.style.left =
      window.innerWidth / 2 - 2.2 * window.innerHeight + "px"; // Moved even further to the left

    // Initialise score text
    this.score_text.style.fontSize =
      Math.min(
        (56 / 937) * window.innerHeight,
        (56 / 1365) * window.innerWidth
      ) + "px";
    this.score_text.style.top = 0.877 * window.innerHeight + "px";
    this.score_text.style.right =
      window.innerWidth / 2 - 0.175 * window.innerHeight + "px";

    // Initialise status text
    this.status_text.style.fontSize =
      Math.min(
        (32 / 937) * window.innerHeight,
        (32 / 1365) * window.innerWidth
      ) + "px";
    this.status_text.style.top = 0.943 * window.innerHeight + "px";
    this.status_text.style.left =
      window.innerWidth / 2 - 0.08 * window.innerHeight + "px";
  };

  /**
   * Updates the status text.
   */
  this.updateStatus = function (status) {
    this.status_text.innerHTML = status;
  };
}
