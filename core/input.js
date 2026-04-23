import { normalize } from "./math.js";

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    codes: new Set(),
    keyPressed: new Set(),
    codePressed: new Set(),
    mouse: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      leftDown: false,
      rightDown: false,
      leftPressed: false,
      rightPressed: false,
    },
    endFrame() {
      this.keyPressed.clear();
      this.codePressed.clear();
      this.mouse.leftPressed = false;
      this.mouse.rightPressed = false;
    },
  };

  function updateMousePosition(event) {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = event.clientX - rect.left;
    input.mouse.y = event.clientY - rect.top;
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (event.code === "Space" || event.code === "Digit1") {
      event.preventDefault();
    }

    if (!event.repeat) {
      input.keyPressed.add(key);
      input.codePressed.add(event.code);
    }

    input.keys.add(key);
    input.codes.add(event.code);
  });

  window.addEventListener("keyup", (event) => {
    input.keys.delete(event.key.toLowerCase());
    input.codes.delete(event.code);
  });

  canvas.addEventListener("mousemove", updateMousePosition);

  canvas.addEventListener("mousedown", (event) => {
    updateMousePosition(event);

    if (event.button === 0) {
      input.mouse.leftDown = true;
      input.mouse.leftPressed = true;
    }

    if (event.button === 2) {
      input.mouse.rightDown = true;
      input.mouse.rightPressed = true;
    }
  });

  canvas.addEventListener("mouseup", (event) => {
    updateMousePosition(event);

    if (event.button === 0) input.mouse.leftDown = false;
    if (event.button === 2) input.mouse.rightDown = false;
  });

  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  window.addEventListener("blur", () => {
    input.keys.clear();
    input.codes.clear();
    input.mouse.leftDown = false;
    input.mouse.rightDown = false;
  });

  return input;
}

export function wasPressed(input, key, code) {
  return input.keyPressed.has(key) || (code ? input.codePressed.has(code) : false);
}

export function getMovementVector(input) {
  const x =
    (input.codes.has("KeyD") || input.keys.has("d") ? 1 : 0) -
    (input.codes.has("KeyA") || input.keys.has("a") ? 1 : 0);
  const y =
    (input.codes.has("KeyS") || input.keys.has("s") ? 1 : 0) -
    (input.codes.has("KeyW") || input.keys.has("w") ? 1 : 0);

  return normalize(x, y);
}
