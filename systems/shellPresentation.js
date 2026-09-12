import { GAME_MODES } from "../core/gameMode.js";

const WORLD_MILESTONES = [
  {
    flag: "heartwood_restored",
    title: "Heartwood Breathes Again",
    body: "The first roads soften. Return home and the village will remember what changed.",
  },
  {
    flag: "stillwater_restored",
    title: "Stillwater Runs Clear",
    body: "The mire loosens its grip and the old water routes begin to answer again.",
  },
  {
    flag: "ember_restored",
    title: "Emberpine Rekindled",
    body: "Fire becomes warmth instead of hunger. The pass belongs to living hands again.",
  },
  {
    flag: "frost_restored",
    title: "Frostveil Thaws",
    body: "The white silence breaks. Waystones and lost paths stir beneath the snow.",
  },
  {
    flag: "scarroot_restored",
    title: "Scarroot Released",
    body: "The oldest wound opens its hand. A deeper keeper rite now waits at home.",
  },
  {
    flag: "rootlight_restored",
    title: "Rootlight Remembers",
    body: "The ancient network holds every restored root without forcing them into one voice.",
  },
  {
    flag: "second_spring_started",
    title: "The Second Spring Begins",
    body: "No throne rises from the Heartseed. A new tree begins small enough to need everyone.",
    kicker: "A New Season",
  },
];

const CONTROLLER_ABILITY_BINDINGS = [
  ["staff", "RT", "Staff"],
  ["bolt", "LT", "Bolt"],
  ["dash", "A", "Dash"],
  ["root", "X", "Root"],
  ["pulse", "Y", "Pulse"],
];

export function getControllerAbilityHudEntries(state) {
  const player = state?.player;
  if (!player) return [];

  return CONTROLLER_ABILITY_BINDINGS.map(([id, binding, fallbackLabel]) => {
    const info = player.abilityInfo?.[id] || {};
    const cooldown = Math.max(0, Number(player.cooldowns?.[id] || 0));
    const cost = Math.max(0, Number(info.cost || 0));
    const spirit = Math.max(0, Number(player.spirit || 0));
    const heartCharge = Math.max(0, Math.min(100, Number(player.heartCharge || 0)));
    const signature = id === "pulse" && Boolean(info.signatureAbility);
    const locked = id === "pulse" && info.unlocked === false;

    let status = "Ready";
    let readiness = "ready";

    if (locked) {
      status = "Locked";
      readiness = "locked";
    } else if (cooldown > 0.05) {
      status = `${cooldown.toFixed(1)}s`;
      readiness = "cooldown";
    } else if (signature && heartCharge < 100) {
      status = `${Math.round(heartCharge)}%`;
      readiness = "charging";
    } else if (cost > spirit) {
      status = "Need SP";
      readiness = "spirit";
    } else if (signature) {
      status = "ULT";
      readiness = "ready";
    }

    return {
      id,
      binding,
      label: info.shortLabel || fallbackLabel,
      status,
      readiness,
    };
  });
}

export function createShellPresentation({
  getState,
  getSettings,
  getInputDevice,
  isShellPanelOpen,
  pulseHaptic,
} = {}) {
  const root = document.documentElement;
  const inputDeviceToast = document.getElementById("input-device-toast");
  const inputDeviceLabel = document.getElementById("input-device-label");
  const controllerGuide = document.getElementById("controller-guide");

  let inputDeviceToastTimer = 0;
  let controllerGuideUntil = 0;
  let lastGuideSceneId = null;
  let trackedWorldState = null;
  let seenWorldMilestones = new Set();
  let worldEventBanner = null;
  let worldEventBannerTimer = 0;
  let controllerContextPrompt = null;
  let controllerHudStrip = null;

  function activeInputDevice() {
    return getInputDevice?.() || root.dataset.inputDevice || "keyboard";
  }

  function settingsFor(state) {
    return getSettings?.() || state?.settings || {};
  }

  function hasMajorOverlay(state) {
    return Boolean(
      state?.story?.dialogue ||
        state?.story?.questPanel ||
        state?.ui?.questLogOpen ||
        state?.ui?.menuOpen ||
        state?.ui?.worldMapOpen ||
        isShellPanelOpen?.()
    );
  }

  function showControllerGuide(duration = 7000) {
    controllerGuideUntil = performance.now() + Math.max(0, duration);
    syncControllerGuide(getState?.());
  }

  function showStatusToast(message, { duration = 2200, type = "system" } = {}) {
    if (!inputDeviceToast || !inputDeviceLabel || !message) return;
    window.clearTimeout(inputDeviceToastTimer);
    inputDeviceLabel.textContent = message;
    inputDeviceToast.dataset.device = type;
    inputDeviceToast.hidden = false;
    inputDeviceToast.classList.remove("is-visible");
    requestAnimationFrame(() => inputDeviceToast.classList.add("is-visible"));
    inputDeviceToastTimer = window.setTimeout(() => {
      inputDeviceToast.classList.remove("is-visible");
      window.setTimeout(() => {
        inputDeviceToast.hidden = true;
      }, 180);
    }, Math.max(900, duration));
  }

  function showInputDevice(device) {
    const gamepad = device === "gamepad";
    showStatusToast(gamepad ? "Controller active" : "Keyboard & Mouse active", {
      duration: 1600,
      type: gamepad ? "gamepad" : "keyboard",
    });
    if (gamepad) showControllerGuide(7000);
  }

  function syncControllerGuide(state) {
    if (!controllerGuide) return;
    if (!state) {
      controllerGuide.hidden = true;
      return;
    }

    if (state.currentSceneId && state.currentSceneId !== lastGuideSceneId) {
      if (lastGuideSceneId && activeInputDevice() === "gamepad") {
        controllerGuideUntil = performance.now() + 4200;
      }
      lastGuideSceneId = state.currentSceneId;
    }

    const visible = Boolean(
      state.mode === GAME_MODES.PLAYING &&
        !state.gameOver &&
        activeInputDevice() === "gamepad" &&
        settingsFor(state).showTutorialHints !== false &&
        performance.now() < controllerGuideUntil &&
        !hasMajorOverlay(state)
    );

    controllerGuide.hidden = !visible;
  }

  function ensureControllerHudStrip() {
    if (controllerHudStrip) return controllerHudStrip;
    const strip = document.createElement("div");
    strip.className = "controller-hud-strip";
    strip.hidden = true;
    strip.setAttribute("aria-hidden", "true");

    for (const [id, binding, fallbackLabel] of CONTROLLER_ABILITY_BINDINGS) {
      const item = document.createElement("span");
      item.className = "controller-hud-ability";
      item.dataset.ability = id;
      item.innerHTML = `
        <b class="controller-glyph">${binding}</b>
        <span class="controller-hud-label">${fallbackLabel}</span>
        <small class="controller-hud-status">Ready</small>
      `;
      strip.append(item);
    }

    document.getElementById("game-shell")?.append(strip);
    controllerHudStrip = strip;
    return strip;
  }

  function syncControllerHud(state) {
    const strip = ensureControllerHudStrip();
    const visible = Boolean(
      state &&
        state.mode === GAME_MODES.PLAYING &&
        !state.gameOver &&
        activeInputDevice() === "gamepad" &&
        !hasMajorOverlay(state)
    );

    strip.hidden = !visible;
    if (!visible) return;

    for (const entry of getControllerAbilityHudEntries(state)) {
      const item = strip.querySelector(`[data-ability="${entry.id}"]`);
      if (!item) continue;
      item.dataset.readiness = entry.readiness;
      const label = item.querySelector(".controller-hud-label");
      const status = item.querySelector(".controller-hud-status");
      if (label) label.textContent = entry.label;
      if (status) status.textContent = entry.status;
    }
  }

  function ensureControllerContextPrompt() {
    if (controllerContextPrompt) return controllerContextPrompt;
    const prompt = document.createElement("div");
    prompt.className = "controller-context-prompt";
    prompt.hidden = true;
    prompt.setAttribute("aria-hidden", "true");
    prompt.innerHTML = `
      <b class="controller-glyph">RB</b>
      <span></span>
    `;
    document.getElementById("game-shell")?.append(prompt);
    controllerContextPrompt = prompt;
    return prompt;
  }

  function syncControllerContextPrompt(state) {
    const prompt = ensureControllerContextPrompt();
    if (!state || activeInputDevice() !== "gamepad") {
      prompt.hidden = true;
      return;
    }

    if (
      state.mode !== GAME_MODES.PLAYING ||
      state.gameOver ||
      hasMajorOverlay(state)
    ) {
      prompt.hidden = true;
      return;
    }

    let text = "";
    if (state.story?.focus) {
      text = state.story.prompt || state.story.focus.label || "Interact";
    } else if (state.nearExit) {
      const exit = state.nearExit;
      const unlocked =
        !exit.requiresFlag ||
        Boolean(state.progression?.worldFlags?.[exit.requiresFlag]);
      if (unlocked) {
        text = `Hold to travel · ${exit.label || "Path"}`;
      }
    }

    const label = prompt.querySelector("span");
    if (label) label.textContent = text;
    prompt.hidden = !text;
  }

  function ensureWorldEventBanner() {
    if (worldEventBanner) return worldEventBanner;
    const banner = document.createElement("div");
    banner.className = "world-event-banner";
    banner.hidden = true;
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML = `
      <span class="world-event-kicker">Region Restored</span>
      <strong></strong>
      <p></p>
    `;
    document.getElementById("game-shell")?.append(banner);
    worldEventBanner = banner;
    return banner;
  }

  function showWorldEventBanner(milestone) {
    const banner = ensureWorldEventBanner();
    const kicker = banner.querySelector(".world-event-kicker");
    const title = banner.querySelector("strong");
    const body = banner.querySelector("p");
    if (kicker) kicker.textContent = milestone.kicker || "Region Restored";
    if (title) title.textContent = milestone.title;
    if (body) body.textContent = milestone.body;

    window.clearTimeout(worldEventBannerTimer);
    banner.hidden = false;
    banner.classList.remove("is-visible");
    requestAnimationFrame(() => banner.classList.add("is-visible"));
    pulseHaptic?.("level", { force: true });

    worldEventBannerTimer = window.setTimeout(() => {
      banner.classList.remove("is-visible");
      window.setTimeout(() => {
        banner.hidden = true;
      }, root.dataset.motion === "reduced" ? 0 : 340);
    }, 3300);
  }

  function syncWorldMilestones(state) {
    if (!state?.progression?.worldFlags) return;

    if (state !== trackedWorldState) {
      trackedWorldState = state;
      seenWorldMilestones = new Set(
        WORLD_MILESTONES
          .filter((milestone) => state.progression.worldFlags[milestone.flag])
          .map((milestone) => milestone.flag)
      );
      return;
    }

    for (const milestone of WORLD_MILESTONES) {
      if (
        state.progression.worldFlags[milestone.flag] &&
        !seenWorldMilestones.has(milestone.flag)
      ) {
        seenWorldMilestones.add(milestone.flag);
        showWorldEventBanner(milestone);
        break;
      }
    }
  }

  function sync(state = getState?.()) {
    syncControllerGuide(state);
    syncControllerHud(state);
    syncControllerContextPrompt(state);
    syncWorldMilestones(state);
  }

  return {
    showInputDevice,
    showControllerGuide,
    showSystemNotice(message, options = {}) {
      showStatusToast(message, { ...options, type: options.type || "system" });
    },
    sync,
    stop() {
      window.clearTimeout(inputDeviceToastTimer);
      window.clearTimeout(worldEventBannerTimer);
    },
  };
}
