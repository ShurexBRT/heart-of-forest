import { randomRange, TAU } from "../core/math.js";

const MAX_PARTICLES = 240;
const MAX_AMBIENT_PARTICLES = 42;

export function spawnBurst(state, x, y, options = {}) {
  const {
    count = 8,
    colors = ["#ffffff"],
    speed = 150,
    size = [2, 4],
    life = [0.22, 0.5],
    spread = TAU,
    angle = 0,
    drag = 5,
    gravity = 0,
  } = options;

  const available = Math.max(0, MAX_PARTICLES - state.particles.length);
  const spawnCount = Math.min(count, available);

  for (let i = 0; i < spawnCount; i += 1) {
    const particleAngle = angle + randomRange(-spread / 2, spread / 2);
    const particleSpeed = randomRange(speed * 0.25, speed);
    const particleLife = randomRange(life[0], life[1]);

    state.particles.push({
      x,
      y,
      vx: Math.cos(particleAngle) * particleSpeed,
      vy: Math.sin(particleAngle) * particleSpeed,
      size: randomRange(size[0], size[1]),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: particleLife,
      maxLife: particleLife,
      drag,
      gravity,
      ambient: false,
    });
  }
}

export function spawnAmbientMote(state, x, y, options = {}) {
  const ambientCount = state.particles.reduce(
    (count, particle) => count + (particle.ambient ? 1 : 0),
    0
  );
  if (state.particles.length >= MAX_PARTICLES || ambientCount >= MAX_AMBIENT_PARTICLES) {
    return false;
  }

  const {
    colors = ["#dff2bd"],
    driftX = [-8, 8],
    driftY = [-18, -5],
    size = [1.25, 2.5],
    life = [1.8, 3.6],
  } = options;
  const particleLife = randomRange(life[0], life[1]);

  state.particles.push({
    x,
    y,
    vx: randomRange(driftX[0], driftX[1]),
    vy: randomRange(driftY[0], driftY[1]),
    size: randomRange(size[0], size[1]),
    color: colors[Math.floor(Math.random() * colors.length)],
    life: particleLife,
    maxLife: particleLife,
    drag: 0.45,
    gravity: 0,
    ambient: true,
  });
  return true;
}

export function updateParticles(state, dt) {
  for (const particle of state.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += (particle.gravity || 0) * dt;
    const drag = Math.max(0, particle.drag ?? 5);
    const damping = Math.max(0, 1 - drag * dt);
    particle.vx *= damping;
    particle.vy *= damping;
    particle.life -= dt;
  }

  state.particles = state.particles.filter((particle) => particle.life > 0);
}
