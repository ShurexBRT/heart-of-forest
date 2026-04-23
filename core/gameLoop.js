export function startGameLoop({ update, render, input }) {
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.033, Math.max(0, (now - last) / 1000));
    last = now;

    update(dt);
    render();
    input.endFrame();

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
