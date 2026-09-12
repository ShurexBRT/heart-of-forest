import { normalize } from "./math.js";

const GAMEPAD_DEADZONE = 0.2;
const AIM_STICK_RADIUS = 180;
const SETTINGS_KEY = "heart-of-forest-settings";

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
  const preferences = readInputPreferences();
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
      physicalLeftDown: false,
      physicalRightDown: false,
    },
    gamepad: {
      connected: false,
      id: "",
      index: -1,
      movement: { x: 0, y: 0 },
      aim: { x: 0, y: 0 },
      buttonsDown: new Set(),
      aimSensitivity: preferences.aimSensitivity,
      vibrationEnabled: preferences.controllerVibration,
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
      input.mouse.physicalLeftDown = true;
      input.mouse.leftDown = true;
      input.mouse.leftPressed = true;
    }

    if (event.button === 2) {
      input.mouse.physicalRightDown = true;
      input.mouse.rightDown = true;
      input.mouse.rightPressed = true;
    }
  });

  canvas.addEventListener("mouseup", (event) => {
    updateMousePosition(event);

    if (event.button === 0) {
      input.mouse.physicalLeftDown = false;
      input.mouse.leftDown = false;
    }
    if (event.button === 2) {
      input.mouse.physicalRightDown = false;
      input.mouse.rightDown = false;
    }
  });

  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  window.addEventListener("blur", () => {
    input.keys.clear();
    input.codes.clear();
    input.mouse.leftDown = false;
    input.mouse.rightDown = false;
    input.mouse.physicalLeftDown = false;
    input.mouse.physicalRightDown = false;
    input.gamepad.buttonsDown.clear();
  });

  pollGamepad(input, canvas);
  return input;
}

export function refreshInputPreferences(input) {
  if (!input?.gamepad) return;
  const preferences = readInputPreferences();
  input.gamepad.aimSensitivity = preferences.aimSensitivity;
  input.gamepad.vibrationEnabled = preferences.controllerVibration;
}

export function pulseGamepad(input, { duration = 60, weak = 0.35, strong = 0.6 } = {}) {
  if (!input?.gamepad?.connected || !input.gamepad.vibrationEnabled) return false;
  const pads = typeof navigator !== "undefined" && navigator.getGamepads
    ? navigator.getGamepads()
    : [];
  const pad = pads?.[input.gamepad.index];
  const actuator = pad?.vibrationActuator || pad?.hapticActuators?.[0];
  if (!actuator) return false;

  if (typeof actuator.playEffect === "function") {
    actuator
      .playEffect("dual-rumble", {
        duration,
        weakMagnitude: Math.max(0, Math.min(1, weak)),
        strongMagnitude: Math.max(0, Math.min(1, strong)),
      })
      .catch?.(() => {});
    return true;
  }

  if (typeof actuator.pulse === "function") {
    actuator.pulse(Math.max(0, Math.min(1, strong)), duration).catch?.(() => {});
    return true;
  }

  return false;
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
    input.mouse.leftDown = input.mouse.physicalLeftDown;
    input.mouse.rightDown = input.mouse.physicalRightDown;
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

    if (!firstFrameDown) return;
    const mappedCodes = GAMEPAD_BUTTON_BINDINGS[index] || [];
    for (const code of mappedCodes) {
      input.codePressed.add(code);
    }
  });

  if (!nextButtonsDown.has(7)) {
    input.mouse.leftDown = input.mouse.physicalLeftDown;
  }
  if (!nextButtonsDown.has(6)) {
    input.mouse.rightDown = input.mouse.physicalRightDown;
  }

  input.gamepad.buttonsDown = nextButtonsDown;

  if (gamepadWasUsed) {
    input.activeDevice = "gamepad";
  }

  if (input.activeDevice === "gamepad" && (input.gamepad.aim.x || input.gamepad.aim.y)) {
    const rect = canvas.getBoundingClientRect();
    const sensitivity = Math.max(0.5, Math.min(1.75, input.gamepad.aimSensitivity || 1));
    input.mouse.x = rect.width / 2 + input.gamepad.aim.x * AIM_STICK_RADIUS * sensitivity;
    input.mouse.y = rect.height / 2 + input.gamepad.aim.y * AIM_STICK_RADIUS * sensitivity;
  }
}

function readInputPreferences() {
  const defaults = { aimSensitivity: 1, controllerVibration: true };
  if (typeof localStorage === "undefined") return defaults;

  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    const aim = Number(raw?.aimSensitivity);
    return {
      aimSensitivity: Number.isFinite(aim) ? Math.max(0.5, Math.min(1.75, aim)) : 1,
      controllerVibration: raw?.controllerVibration !== false,
    };
  } catch {
    return defaults;
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
