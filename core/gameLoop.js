export function startGameLoop(ctx, gameState) {
  function loop() {
    update(gameState);
    render(ctx, gameState);
    requestAnimationFrame(loop);
  }
  loop();
}

function update(state) {
  state.player.update(state);
  state.enemies.forEach(e => e.update(state));
}

function render(ctx, state) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = "#1f3a2d";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  state.player.draw(ctx);
  state.enemies.forEach(e => e.draw(ctx));
}
