import { startGameLoop } from "./core/gameLoop.js";
import { createInput, wasPressed } from "./core/input.js";
import { clamp } from "./core/math.js";
import { Player } from "./entities/player.js";
import { Enemy } from "./entities/enemy.js";
import { createArena } from "./world/arena.js";
import {
  handlePlayerAbilities,
  resolveEnemyCrowding,
  updateCombatEffects,
} from "./systems/combat.js";
import { updateParticles } from "./systems/particles.js";
import { renderGame } from "./rendering/renderer.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
const input = createInput(canvas);
const state = createState();

function createState() {
  const arena = createArena();

  return {
    arena,
    player: new Player(arena.playerSpawn),
    enemies: arena.enemySpawns.map((spawn) => new Enemy(spawn.x, spawn.y, spawn.type)),
    projectiles: [],
    roots: [],
    swings: [],
    particles: [],
    afterImages: [],
    time: 0,
    shake: 0,
    gameOver: false,
    areaCleared: false,
    viewport: { width: window.innerWidth, height: window.innerHeight, dpr: 1 },
    camera: { x: 0, y: 0 },
    mouseWorld: { x: 0, y: 0 },
  };
}

function resetGame() {
  const next = createState();
  state.arena = next.arena;
  state.player = next.player;
  state.enemies = next.enemies;
  state.projectiles = next.projectiles;
  state.roots = next.roots;
  state.swings = next.swings;
  state.particles = next.particles;
  state.afterImages = next.afterImages;
  state.time = 0;
  state.shake = 0;
  state.gameOver = false;
  state.areaCleared = false;
  updateCamera(0);
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.viewport.width = window.innerWidth;
  state.viewport.height = window.innerHeight;
  state.viewport.dpr = dpr;

  canvas.width = Math.floor(state.viewport.width * dpr);
  canvas.height = Math.floor(state.viewport.height * dpr);
  canvas.style.width = `${state.viewport.width}px`;
  canvas.style.height = `${state.viewport.height}px`;
  updateCamera(0);
}

function updateCamera(dt) {
  const { arena, player, viewport, camera } = state;
  const maxX = arena.width - viewport.width;
  const maxY = arena.height - viewport.height;
  const targetX = maxX > 0 ? clamp(player.x - viewport.width / 2, 0, maxX) : maxX / 2;
  const targetY = maxY > 0 ? clamp(player.y - viewport.height / 2, 0, maxY) : maxY / 2;

  if (dt <= 0) {
    camera.x = targetX;
    camera.y = targetY;
    return;
  }

  const follow = Math.min(1, 12 * dt);
  camera.x += (targetX - camera.x) * follow;
  camera.y += (targetY - camera.y) * follow;
}

function updateMouseWorld() {
  state.mouseWorld.x = input.mouse.x + state.camera.x;
  state.mouseWorld.y = input.mouse.y + state.camera.y;
}

function update(dt) {
  state.time += dt;
  state.shake = Math.max(0, state.shake - 30 * dt);

  updateMouseWorld();

  if ((state.gameOver || state.areaCleared) && wasPressed(input, "r", "KeyR")) {
    resetGame();
    input.endFrame();
    return;
  }

  state.player.tick(dt);

  if (!state.gameOver && !state.areaCleared) {
    handlePlayerAbilities(state, input);
    state.player.move(dt, input, state);
    updateCombatEffects(state, dt);

    for (const enemy of state.enemies) {
      enemy.update(dt, state);
    }

    resolveEnemyCrowding(state);

    if (state.enemies.every((enemy) => enemy.dead)) {
      state.areaCleared = true;
      state.shake = Math.max(state.shake, 6);
    }
  } else {
    updateCombatEffects(state, dt);
  }

  updateParticles(state, dt);
  updateCamera(dt);
}

function render() {
  renderGame(ctx, state);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
startGameLoop({ update, render, input });
