
(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const keys = {};
  const mouse = { x: 0, y: 0, left: false, right: false };

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (["1", " "].includes(k)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  canvas.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0) mouse.left = true;
    if (e.button === 2) mouse.right = true;
  });

  canvas.addEventListener("mouseup", (e) => {
    if (e.button === 0) mouse.left = false;
    if (e.button === 2) mouse.right = false;
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function dist(ax, ay, bx, by) {
    return Math.hypot(bx - ax, by - ay);
  }

  function normalize(x, y) {
    const d = Math.hypot(x, y) || 1;
    return { x: x / d, y: y / d };
  }

  function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const nearestX = clamp(cx, rx, rx + rw);
    const nearestY = clamp(cy, ry, ry + rh);
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < cr * cr;
  }

  const state = {
    time: 0,
    gameOver: false,
    areaCleared: false,
    shake: 0,
    particles: [],
    projectiles: [],
    roots: [],
    obstacles: [],
    enemies: [],
  };

  function makeMap() {
    const w = canvas.width;
    const h = canvas.height;
    state.obstacles = [
      { x: 140, y: 120, w: 90, h: 90, type: "tree" },
      { x: 280, y: 420, w: 80, h: 80, type: "tree" },
      { x: 520, y: 180, w: 100, h: 100, type: "tree" },
      { x: 760, y: 380, w: 85, h: 85, type: "tree" },
      { x: w - 220, y: 150, w: 90, h: 90, type: "tree" },
      { x: w - 320, y: h - 220, w: 75, h: 75, type: "tree" },
      { x: 400, y: 320, w: 58, h: 42, type: "rock" },
      { x: 680, y: 520, w: 64, h: 44, type: "rock" },
      { x: w - 470, y: 300, w: 52, h: 36, type: "rock" },
    ];
  }

  const player = {
    x: 200,
    y: 200,
    r: 16,
    vx: 0,
    vy: 0,
    hp: 100,
    maxHp: 100,
    spirit: 100,
    maxSpirit: 100,
    accel: 0.75,
    friction: 0.82,
    maxSpeed: 4.8,
    invuln: 0,
    hitFlash: 0,
    facing: 0,
    meleeCooldown: 0,
    boltCooldown: 0,
    dashCooldown: 0,
    rootCooldown: 0,
    dashTimer: 0,
    spiritRegen: 10,
  };

  function spawnEnemies() {
    state.enemies = [
      makeEnemy(760, 160, "basic"),
      makeEnemy(900, 260, "basic"),
      makeEnemy(860, 540, "basic"),
      makeEnemy(620, 520, "brute"),
      makeEnemy(1050, 400, "brute"),
    ];
  }

  function makeEnemy(x, y, type) {
    const isBrute = type === "brute";
    return {
      x, y, type,
      r: isBrute ? 18 : 14,
      hp: isBrute ? 70 : 36,
      maxHp: isBrute ? 70 : 36,
      speed: isBrute ? 1.1 : 1.8,
      damage: isBrute ? 18 : 10,
      state: "idle",
      attackCd: 0,
      hitFlash: 0,
      snared: 0,
      vx: 0,
      vy: 0,
      wanderTimer: Math.random() * 2,
      dead: false,
    };
  }

  function resetGame() {
    state.time = 0;
    state.gameOver = false;
    state.areaCleared = false;
    state.shake = 0;
    state.particles = [];
    state.projectiles = [];
    state.roots = [];
    makeMap();
    player.x = 200;
    player.y = 200;
    player.vx = 0;
    player.vy = 0;
    player.hp = player.maxHp;
    player.spirit = player.maxSpirit;
    player.invuln = 0;
    player.hitFlash = 0;
    player.meleeCooldown = 0;
    player.boltCooldown = 0;
    player.dashCooldown = 0;
    player.rootCooldown = 0;
    player.dashTimer = 0;
    spawnEnemies();
  }

  function addParticles(x, y, color, count, speed = 2.4) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * speed;
      state.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  function moveCircleWithCollisions(entity, dx, dy) {
    entity.x += dx;
    for (const o of state.obstacles) {
      if (circleRectCollision(entity.x, entity.y, entity.r, o.x, o.y, o.w, o.h)) {
        if (dx > 0) entity.x = o.x - entity.r;
        else if (dx < 0) entity.x = o.x + o.w + entity.r;
      }
    }

    entity.y += dy;
    for (const o of state.obstacles) {
      if (circleRectCollision(entity.x, entity.y, entity.r, o.x, o.y, o.w, o.h)) {
        if (dy > 0) entity.y = o.y - entity.r;
        else if (dy < 0) entity.y = o.y + o.h + entity.r;
      }
    }

    entity.x = clamp(entity.x, entity.r + 20, canvas.width - entity.r - 20);
    entity.y = clamp(entity.y, entity.r + 20, canvas.height - entity.r - 20);
  }

  function castMelee() {
    if (player.meleeCooldown > 0 || state.gameOver || state.areaCleared) return;
    player.meleeCooldown = 0.28;
    const reach = 62;
    let hitSomething = false;

    for (const e of state.enemies) {
      if (e.dead) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const d = Math.hypot(dx, dy);
      if (d <= reach + e.r) {
        const dir = normalize(dx, dy);
        e.hp -= 16;
        e.hitFlash = 0.12;
        e.vx += dir.x * 6;
        e.vy += dir.y * 6;
        e.state = "chase";
        addParticles(e.x, e.y, "#ffe8a3", 10);
        state.shake = Math.max(state.shake, 4);
        hitSomething = true;
        if (e.hp <= 0) {
          e.dead = true;
          addParticles(e.x, e.y, "#c04b2f", 18, 3.5);
        }
      }
    }

    addParticles(
      player.x + Math.cos(player.facing) * 26,
      player.y + Math.sin(player.facing) * 26,
      hitSomething ? "#fff1ad" : "#c6d7b9",
      hitSomething ? 8 : 4,
      2.2
    );
  }

  function castBolt() {
    if (player.boltCooldown > 0 || player.spirit < 14 || state.gameOver || state.areaCleared) return;
    player.boltCooldown = 0.38;
    player.spirit -= 14;
    const dir = normalize(mouse.x - player.x, mouse.y - player.y);
    state.projectiles.push({
      x: player.x + dir.x * 22,
      y: player.y + dir.y * 22,
      vx: dir.x * 8.5,
      vy: dir.y * 8.5,
      r: 6,
      life: 1.2,
      damage: 20,
    });
    addParticles(player.x, player.y, "#7be0ff", 8, 1.8);
  }

  function castDash() {
    if (player.dashCooldown > 0 || state.gameOver || state.areaCleared) return;
    player.dashCooldown = 1.2;
    player.dashTimer = 0.18;
    player.invuln = 0.20;
    const moveX = (keys["d"] ? 1 : 0) - (keys["a"] ? 1 : 0);
    const moveY = (keys["s"] ? 1 : 0) - (keys["w"] ? 1 : 0);
    let dir;
    if (moveX !== 0 || moveY !== 0) dir = normalize(moveX, moveY);
    else dir = normalize(mouse.x - player.x, mouse.y - player.y);
    player.vx = dir.x * 12;
    player.vy = dir.y * 12;
    addParticles(player.x, player.y, "#d8fff2", 12, 3.2);
  }

  function castRoot() {
    if (player.rootCooldown > 0 || player.spirit < 22 || state.gameOver || state.areaCleared) return;
    player.rootCooldown = 2.5;
    player.spirit -= 22;
    const dir = normalize(mouse.x - player.x, mouse.y - player.y);
    const rx = player.x + dir.x * 90;
    const ry = player.y + dir.y * 90;
    state.roots.push({ x: rx, y: ry, r: 46, life: 1.2 });
    addParticles(rx, ry, "#72d16b", 16, 2.1);

    for (const e of state.enemies) {
      if (e.dead) continue;
      if (dist(rx, ry, e.x, e.y) <= 46 + e.r) {
        e.snared = 1.6;
        e.hitFlash = 0.08;
      }
    }
  }

  let prevLeft = false;
  let prevRight = false;
  let prevSpace = false;
  let prevOne = false;

  function update(dt) {
    state.time += dt;
    if (state.shake > 0) state.shake *= 0.84;
    if (player.hitFlash > 0) player.hitFlash -= dt;
    if (player.invuln > 0) player.invuln -= dt;
    if (player.meleeCooldown > 0) player.meleeCooldown -= dt;
    if (player.boltCooldown > 0) player.boltCooldown -= dt;
    if (player.dashCooldown > 0) player.dashCooldown -= dt;
    if (player.rootCooldown > 0) player.rootCooldown -= dt;
    if (player.dashTimer > 0) player.dashTimer -= dt;

    player.spirit = Math.min(player.maxSpirit, player.spirit + player.spiritRegen * dt);

    const mx = mouse.x - player.x;
    const my = mouse.y - player.y;
    player.facing = Math.atan2(my, mx);

    const moveX = (keys["d"] ? 1 : 0) - (keys["a"] ? 1 : 0);
    const moveY = (keys["s"] ? 1 : 0) - (keys["w"] ? 1 : 0);
    const moveDir = (moveX !== 0 || moveY !== 0) ? normalize(moveX, moveY) : { x: 0, y: 0 };

    if (player.dashTimer <= 0) {
      player.vx += moveDir.x * player.accel;
      player.vy += moveDir.y * player.accel;
      player.vx *= player.friction;
      player.vy *= player.friction;

      const speed = Math.hypot(player.vx, player.vy);
      if (speed > player.maxSpeed) {
        const n = normalize(player.vx, player.vy);
        player.vx = n.x * player.maxSpeed;
        player.vy = n.y * player.maxSpeed;
      }
    } else {
      player.vx *= 0.95;
      player.vy *= 0.95;
      addParticles(player.x, player.y, "#d8fff2", 2, 0.6);
    }

    moveCircleWithCollisions(player, player.vx, player.vy);

    if (mouse.left && !prevLeft) castMelee();
    if (mouse.right && !prevRight) castBolt();
    if (keys[" "] && !prevSpace) castDash();
    if (keys["1"] && !prevOne) castRoot();

    prevLeft = mouse.left;
    prevRight = mouse.right;
    prevSpace = !!keys[" "];
    prevOne = !!keys["1"];

    for (const p of state.projectiles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;

      for (const o of state.obstacles) {
        if (circleRectCollision(p.x, p.y, p.r, o.x, o.y, o.w, o.h)) {
          p.life = 0;
          addParticles(p.x, p.y, "#7be0ff", 8);
        }
      }

      for (const e of state.enemies) {
        if (e.dead) continue;
        if (dist(p.x, p.y, e.x, e.y) <= p.r + e.r) {
          e.hp -= p.damage;
          e.hitFlash = 0.12;
          const n = normalize(e.x - p.x, e.y - p.y);
          e.vx += n.x * 4;
          e.vy += n.y * 4;
          p.life = 0;
          addParticles(p.x, p.y, "#9fe8ff", 10);
          if (e.hp <= 0) {
            e.dead = true;
            addParticles(e.x, e.y, "#c04b2f", 20, 3.5);
          }
        }
      }
    }
    state.projectiles = state.projectiles.filter(p => p.life > 0);

    for (const r of state.roots) {
      r.life -= dt;
      for (const e of state.enemies) {
        if (e.dead) continue;
        if (dist(r.x, r.y, e.x, e.y) <= r.r + e.r) e.snared = Math.max(e.snared, 0.06);
      }
    }
    state.roots = state.roots.filter(r => r.life > 0);

    for (const e of state.enemies) {
      if (e.dead) continue;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.attackCd > 0) e.attackCd -= dt;
      if (e.snared > 0) e.snared -= dt;

      const d = dist(e.x, e.y, player.x, player.y);
      if (d < 260) e.state = "chase";
      else e.state = "idle";

      if (e.state === "idle") {
        e.wanderTimer -= dt;
        if (e.wanderTimer <= 0) {
          e.wanderTimer = 1 + Math.random() * 1.5;
          const a = Math.random() * Math.PI * 2;
          e.vx += Math.cos(a) * 1.4;
          e.vy += Math.sin(a) * 1.4;
        }
      } else if (e.state === "chase") {
        const n = normalize(player.x - e.x, player.y - e.y);
        const mul = e.snared > 0 ? 0.35 : 1;
        e.vx += n.x * e.speed * 0.25 * mul;
        e.vy += n.y * e.speed * 0.25 * mul;

        const maxEnemySpeed = (e.type === "brute" ? 2.0 : 2.8) * mul;
        const sp = Math.hypot(e.vx, e.vy);
        if (sp > maxEnemySpeed) {
          const nn = normalize(e.vx, e.vy);
          e.vx = nn.x * maxEnemySpeed;
          e.vy = nn.y * maxEnemySpeed;
        }

        if (d < e.r + player.r + 8 && e.attackCd <= 0) {
          e.attackCd = e.type === "brute" ? 1.0 : 0.8;
          if (player.invuln <= 0) {
            player.hp -= e.damage;
            player.hitFlash = 0.16;
            player.invuln = 0.45;
            const knock = normalize(player.x - e.x, player.y - e.y);
            player.vx += knock.x * 5;
            player.vy += knock.y * 5;
            addParticles(player.x, player.y, "#ff9b7d", 12, 2.5);
            state.shake = Math.max(state.shake, 6);
            if (player.hp <= 0) {
              player.hp = 0;
              state.gameOver = true;
            }
          }
        }
      }

      e.vx *= 0.90;
      e.vy *= 0.90;
      moveCircleWithCollisions(e, e.vx, e.vy);
    }

    state.enemies = state.enemies.filter(e => !e.dead || e.hp > 0);
    if (!state.gameOver && state.enemies.length === 0) {
      state.areaCleared = true;
    }

    for (const p of state.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
    }
    state.particles = state.particles.filter(p => p.life > 0);

    if ((state.gameOver || state.areaCleared) && keys["r"]) {
      resetGame();
    }
  }

  function drawBackground() {
    ctx.fillStyle = "#17351f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y += 24) {
      for (let x = 0; x < canvas.width; x += 24) {
        const v = ((x * 13 + y * 7) % 29);
        ctx.fillStyle = v < 10 ? "#1b4024" : v < 20 ? "#204a29" : "#234f2d";
        ctx.fillRect(x, y, 24, 24);
      }
    }

    for (const o of state.obstacles) {
      if (o.type === "tree") {
        ctx.fillStyle = "#4a2f1f";
        ctx.fillRect(o.x + o.w * 0.38, o.y + o.h * 0.56, o.w * 0.24, o.h * 0.36);
        ctx.fillStyle = "#2f6a35";
        ctx.beginPath();
        ctx.arc(o.x + o.w/2, o.y + o.h*0.38, o.w*0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3e8b45";
        ctx.beginPath();
        ctx.arc(o.x + o.w*0.42, o.y + o.h*0.33, o.w*0.22, 0, Math.PI * 2);
        ctx.arc(o.x + o.w*0.60, o.y + o.h*0.30, o.w*0.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#5b655f";
        ctx.beginPath();
        ctx.ellipse(o.x + o.w/2, o.y + o.h/2, o.w/2, o.h/2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#7a857d";
        ctx.beginPath();
        ctx.ellipse(o.x + o.w*0.4, o.y + o.h*0.38, o.w*0.18, o.h*0.14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawRoots() {
    for (const r of state.roots) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.life / 1.2) * 0.75;
      ctx.strokeStyle = "#67d05f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < 10; i++) {
        const a = (Math.PI * 2 / 10) * i + state.time * 2;
        const x2 = r.x + Math.cos(a) * (r.r - 4);
        const y2 = r.y + Math.sin(a) * (r.r - 4);
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawProjectiles() {
    for (const p of state.projectiles) {
      ctx.fillStyle = "#82e9ff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#d9fbff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawPlayer() {
    ctx.save();
    if (player.invuln > 0 && Math.floor(state.time * 20) % 2 === 0) ctx.globalAlpha = 0.7;

    ctx.translate(player.x, player.y);
    ctx.rotate(player.facing);

    ctx.fillStyle = player.hitFlash > 0 ? "#ffbcaa" : "#f2f3ef";
    ctx.beginPath();
    ctx.arc(0, 0, player.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#d7ddd5";
    ctx.beginPath();
    ctx.arc(0, -4, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#7f5d36";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(4, 2);
    ctx.lineTo(24, 0);
    ctx.stroke();

    ctx.fillStyle = "#7ecf74";
    ctx.beginPath();
    ctx.arc(26, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawEnemies() {
    for (const e of state.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);

      if (e.type === "brute") {
        ctx.fillStyle = e.hitFlash > 0 ? "#ffccae" : "#8a3d2e";
        ctx.beginPath();
        ctx.arc(0, 0, e.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d38f59";
        ctx.fillRect(-8, -4, 16, 8);
      } else {
        ctx.fillStyle = e.hitFlash > 0 ? "#ffd5c5" : "#7a1f27";
        ctx.beginPath();
        ctx.arc(0, 0, e.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c95757";
        ctx.beginPath();
        ctx.arc(0, 0, e.r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      if (e.snared > 0) {
        ctx.strokeStyle = "#73d65d";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.r + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      const bw = 34;
      const bh = 5;
      const ratio = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(e.x - bw/2, e.y - e.r - 14, bw, bh);
      ctx.fillStyle = "#d74d4d";
      ctx.fillRect(e.x - bw/2, e.y - e.r - 14, bw * ratio, bh);
    }
  }

  function drawParticles() {
    for (const p of state.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    }
  }

  function drawUI() {
    const x = 20;
    const y = 20;
    const w = 220;
    const h = 16;

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = "#682a2a";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#d75a5a";
    ctx.fillRect(x, y, w * (player.hp / player.maxHp), h);

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.fillText("HP", x + 6, y + 12);

    const sy = y + 28;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x - 2, sy - 2, w + 4, h + 4);
    ctx.fillStyle = "#223b49";
    ctx.fillRect(x, sy, w, h);
    ctx.fillStyle = "#59bde7";
    ctx.fillRect(x, sy, w * (player.spirit / player.maxSpirit), h);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("SPIRIT", x + 6, sy + 12);

    const abilities = [
      ["LMB Strike", player.meleeCooldown, 0.28],
      ["RMB Bolt", player.boltCooldown, 0.38],
      ["Space Dash", player.dashCooldown, 1.2],
      ["1 Root", player.rootCooldown, 2.5],
    ];

    let ay = 68;
    for (const [label, cd, maxCd] of abilities) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(x, ay, 150, 14);
      ctx.fillStyle = cd > 0 ? "#9b8846" : "#4c9b63";
      ctx.fillRect(x, ay, 150 * (1 - Math.min(1, cd / maxCd)), 14);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, x + 6, ay + 11);
      ay += 20;
    }

    ctx.fillStyle = "#e5f1de";
    ctx.font = "14px Arial";
    ctx.fillText("WASD move  •  Mouse aim  •  LMB strike  •  RMB bolt  •  Space dash  •  1 root  •  R restart", 20, canvas.height - 20);

    if (state.areaCleared) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(canvas.width/2 - 170, canvas.height/2 - 50, 340, 100);
      ctx.fillStyle = "#dfffd2";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Area Cleansed", canvas.width/2, canvas.height/2 - 6);
      ctx.font = "16px Arial";
      ctx.fillText("Press R to play again", canvas.width/2, canvas.height/2 + 26);
      ctx.textAlign = "left";
    }

    if (state.gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(canvas.width/2 - 170, canvas.height/2 - 50, 340, 100);
      ctx.fillStyle = "#ffd1d1";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Ayla Has Fallen", canvas.width/2, canvas.height/2 - 6);
      ctx.font = "16px Arial";
      ctx.fillText("Press R to restart", canvas.width/2, canvas.height/2 + 26);
      ctx.textAlign = "left";
    }
  }

  function render() {
    const shakeX = (Math.random() - 0.5) * state.shake;
    const shakeY = (Math.random() - 0.5) * state.shake;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    drawBackground();
    drawRoots();
    drawProjectiles();
    drawEnemies();
    drawPlayer();
    drawParticles();

    ctx.restore();
    drawUI();
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  resetGame();
  requestAnimationFrame(loop);
})();
