import { initInput } from "./core/input.js";
import { startGameLoop } from "./core/gameLoop.js";
import { Player } from "./entities/player.js";
import { Enemy } from "./entities/enemy.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

initInput(canvas);

const player = new Player(400, 300);

const enemies = [
  new Enemy(600, 300, "basic"),
  new Enemy(700, 400, "fast")
];

const gameState = {
  player,
  enemies,
  projectiles: []
};

startGameLoop(ctx, gameState);
