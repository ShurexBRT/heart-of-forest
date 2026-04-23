import { input } from "../core/input.js";

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.velX = 0;
    this.velY = 0;
    this.speed = 0.4;
    this.friction = 0.85;
    this.hp = 100;
    this.radius = 15;
  }

  update(state) {
    let ax = 0;
    let ay = 0;

    if (input.keys["w"]) ay -= 1;
    if (input.keys["s"]) ay += 1;
    if (input.keys["a"]) ax -= 1;
    if (input.keys["d"]) ax += 1;

    this.velX += ax * this.speed;
    this.velY += ay * this.speed;

    this.velX *= this.friction;
    this.velY *= this.friction;

    this.x += this.velX;
    this.y += this.velY;

    if (input.mouse.left) {
      state.enemies.forEach(e => {
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 50) {
          e.takeDamage(10);
          e.knockback(dx, dy);
        }
      });
    }
  }

  draw(ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
