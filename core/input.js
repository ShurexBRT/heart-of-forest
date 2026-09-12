import { normalize } from "./math.js";

const GAMEPAD_DEADZONE = 0.2;
const AIM_STICK_RADIUS = 180;

const GAMEPAD_BUTTON_BINDINGS = {
  0: ["Space"],
  1: ["Escape"],
  2: ["Digit1"],
  3: ["KeyR"],
  4: ["KeyQ"],
  5: ["KeyE"],
  8: ["Tab"],
  9: ["Escape"],
  12: ["ArrowUp"],
  13: ["ArrowDown"],
  14: ["ArrowLeft"],
  15: ["ArrowRight"],
};

export function applyGamepadDeadzone(value, deadzone = GAMEPAD_DEADZONE) {
  const magnitude = Math.abs(Number(value) || 0);
  if (magnitude <= deadzone) return 0;
  const scaled = (magnitude - deadzone) / (1 - deadzone);
  return Math.sign(value) * Math.min(1, scaled);
}

export function getGamepadMovementFromAxes(axes = []) {
  return normalize(
    applyGamepadDeadzone(axes[0] || 0),
    applyGamepadDeadzone(axes[1] || 0)
  );
}

function getGamepadAimFromAxes(axes = []) {
  return normalize(
    applyGamepadDeadzone(axes[2] || 0),
    applyGamepadDeadzone(axes[3] || 0)
  );
}

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    codes: new Set(),
    keyPressed: new Set(),
    codePressed: new Set(),
    activeDevice: "keyboard",
    mouse: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      leftDown: false,
      rightDown: false,
      leftPressed: false,
      rightPressed: false,
    },
    gamepad: {
      connected: false,
      id: "",
      index: -1,
      movement: { x: 0, y: 0 },
      aim: { x: 0, y: 0 },
      buttonsDown: new Set(),
    },
    endFrame() {
      this.keyPressed.clear();
      this.codePressed.clear();
      this.mouse.leftPressed = false;
      this.mouse.rightPressed = false;
      pollGamepad(this, canvas);
    },
  };

  function markKeyboardActive() {
    input.activeDevice = "keyboard";
  }

  function updateMousePosition(event) {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = event.clientX - rect.left;
    input.mouse.y = event.clientY - rect.top;
    markKeyboardActive();
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
    markKeyboardActive();
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
    input.gamepad.buttonsDown.clear();
  });

  pollGamepad(input, canvas);
  return input;
}

function pollGamepad(input, canvas) {
  const pads = typeof navigator !== "undefined" && navigator.getGamepads
    ? Array.from(navigator.getGamepads()).filter(Boolean)
    : [];
  const pad = pads.find((candidate) => candidate.connected) || null;

  if (!pad) {
    input.gamepad.connected = false;
    input.gamepad.id = "";
    input.gamepad.index = -1;
    input.gamepad.movement = { x: 0, y: 0 };
    input.gamepad.aim = { x: 0, y: 0 };
    input.gamepad.buttonsDown.clear();
    return;
  }

  input.gamepad.connected = true;
  input.gamepad.id = pad.id || "Gamepad";
  input.gamepad.index = pad.index;
  input.gamepad.movement = getGamepadMovementFromAxes(pad.axes);
  input.gamepad.aim = getGamepadAimFromAxes(pad.axes);

  const nextButtonsDown = new Set();
  let gamepadWasUsed =
    Math.abs(input.gamepad.movement.x) > 0.01 ||
    Math.abs(input.gamepad.movement.y) > 0.01 ||
    Math.abs(input.gamepad.aim.x) > 0.01 ||
    Math.abs(input.gamepad.aim.y) > 0.01;

  pad.buttons.forEach((button, index) => {
    const down = Boolean(button?.pressed || button?.value > 0.55);
    if (!down) return;

    nextButtonsDown.add(index);
    gamepadWasUsed = true;
    const firstFrameDown = !input.gamepad.buttonsDown.has(index);

    if (index === 7) {
      input.mouse.leftDown = true;
      if (firstFrameDown) input.mouse.leftPressed = true;
      return;
    }

    if (index === 6) {
      input.mouse.rightDown = true;
      if (firstFrameDown) input.mouse.rightPressed = true;
      return;
    }

    const mappedCodes = GAMEPAD_BUTTON_BINDINGS[index] || [];
    for (const code of mappedCodes) {
      input.codes.add(code);
      if (firstFrameDown) input.codePressed.add(code);
    }
  });

  if (!nextButtonsDown.has(7) && input.activeDevice === "gamepad") {
    input.mouse.leftDown = false;
  }
  if (!nextButtonsDown.has(6) && input.activeDevice === "gamepad") {
    input.mouse.rightDown = false;
  }

  input.gamepad.buttonsDown = nextButtonsDown;

  if (gamepadWasUsed) {
    input.activeDevice = "gamepad";
  }

  if (input.activeDevice === "gamepad" && (input.gamepad.aim.x || input.gamepad.aim.y)) {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = rect.width / 2 + input.gamepad.aim.x * AIM_STICK_RADIUS;
    input.mouse.y = rect.height / 2 + input.gamepad.aim.y * AIM_STICK_RADIUS;
  }
}

export function wasPressed(input, key, code) {
  return input.keyPressed.has(key) || (code ? input.codePressed.has(code) : false);
}

export function getMovementVector(input) {
  const keyboardX =
    (input.codes.has("KeyD") || input.keys.has("d") ? 1 : 0) -
    (input.codes.has("KeyA") || input.keys.has("a") ? 1 : 0);
  const keyboardY =
    (input.codes.has("KeyS") || input.keys.has("s") ? 1 : 0) -
    (input.codes.has("KeyW") || input.keys.has("w") ? 1 : 0);

  if (keyboardX !== 0 || keyboardY !== 0) {
    return normalize(keyboardX, keyboardY);
  }

  return input.gamepad?.movement || { x: 0, y: 0 };
}
