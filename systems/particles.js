import { randomRange, TAU } from "../core/math.js";

const MAX_PARTICLES = 220;

export function spawnBurst(state, x, y, options = {}) {
  const {
    count = 8,
    colors = ["#ffffff"],
    speed = 150,
    size = [2, 4],
    life = [0.22, 0.5],
    spread = TAU,
    angle = 0,
  } = options;

  const available = Math.max(0, MAX_PARTICLES - state.particles.length);
  const spawnCount = Math.min(count, available);

  for (let i = 0; i < spawnCount; i += 1) {
    const particleAngle = angle + randomRange(-spread / 2, spread / 2);
    const particleSpeed = randomRange(speed * 0.25, speed);

    state.particles.push({
      x,
      y,
      vx: Math.cos(particleAngle) * particleSpeed,
      vy: Math.sin(particleAngle) * particleSpeed,
      size: randomRange(size[0], size[1]),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: randomRange(life[0], life[1]),
      maxLife: life[1],
    });
  }
}

export function updateParticles(state, dt) {
  for (const particle of state.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.max(0, 1 - 5 * dt);
    particle.vy *= Math.max(0, 1 - 5 * dt);
    particle.life -= dt;
  }

  state.particles = state.particles.filter((particle) => particle.life > 0);
}
