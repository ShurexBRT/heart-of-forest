export class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.hp = type === "basic" ? 40 : 80;
    this.speed = type === "basic" ? 1 : 2;
    this.radius = 12;
  }

  update(state) {
    const player = state.player;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 300) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  takeDamage(dmg) {
    this.hp -= dmg;
  }

  knockback(dx, dy) {
    const dist = Math.hypot(dx, dy);
    this.x += (dx / dist) * 20;
    this.y += (dy / dist) * 20;
  }

  draw(ctx) {
    ctx.fillStyle = this.type === "basic" ? "#8b0000" : "#ff4500";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
