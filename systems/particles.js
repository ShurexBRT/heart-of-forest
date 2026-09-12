import { randomRange, TAU } from "../core/math.js";

const MAX_PARTICLES = 240;
const REDUCED_MOTION_MAX_PARTICLES = 96;
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

  const reducedMotion = Boolean(state.settings?.reducedMotion);
  const particleCap = reducedMotion ? REDUCED_MOTION_MAX_PARTICLES : MAX_PARTICLES;
  const requestedCount = reducedMotion ? Math.max(1, Math.ceil(count * 0.34)) : count;
  const available = Math.max(0, particleCap - state.particles.length);
  const spawnCount = Math.min(requestedCount, available);
  const speedScale = reducedMotion ? 0.32 : 1;
  const lifeScale = reducedMotion ? 0.62 : 1;

  for (let i = 0; i < spawnCount; i += 1) {
    const particleAngle = angle + randomRange(-spread / 2, spread / 2);
    const particleSpeed = randomRange(speed * 0.25, speed) * speedScale;
    const particleLife = randomRange(life[0], life[1]) * lifeScale;

    state.particles.push({
      x,
      y,
      vx: Math.cos(particleAngle) * particleSpeed,
      vy: Math.sin(particleAngle) * particleSpeed,
      size: randomRange(size[0], size[1]),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: particleLife,
      maxLife: particleLife,
      drag: reducedMotion ? Math.max(8, drag) : drag,
      gravity: reducedMotion ? gravity * 0.25 : gravity,
      ambient: false,
    });
  }
}

export function spawnAmbientMote(state, x, y, options = {}) {
  if (state.settings?.reducedMotion) return false;

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
  const reducedMotion = Boolean(state.settings?.reducedMotion);

  for (const particle of state.particles) {
    const motionDt = reducedMotion ? dt * 0.42 : dt;
    particle.x += particle.vx * motionDt;
    particle.y += particle.vy * motionDt;
    particle.vy += (particle.gravity || 0) * motionDt;
    const drag = Math.max(0, particle.drag ?? 5);
    const damping = Math.max(0, 1 - drag * dt);
    particle.vx *= damping;
    particle.vy *= damping;
    particle.life -= dt;
  }

  state.particles = state.particles.filter((particle) => particle.life > 0);
}
