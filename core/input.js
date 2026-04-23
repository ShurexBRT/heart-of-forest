export const input = {
  keys: {},
  mouse: { x: 0, y: 0, left: false, right: false }
};

export function initInput(canvas) {
  window.addEventListener("keydown", e => input.keys[e.key.toLowerCase()] = true);
  window.addEventListener("keyup", e => input.keys[e.key.toLowerCase()] = false);

  canvas.addEventListener("mousemove", e => {
    input.mouse.x = e.clientX;
    input.mouse.y = e.clientY;
  });

  canvas.addEventListener("mousedown", e => {
    if (e.button === 0) input.mouse.left = true;
    if (e.button === 2) input.mouse.right = true;
  });

  canvas.addEventListener("mouseup", e => {
    if (e.button === 0) input.mouse.left = false;
    if (e.button === 2) input.mouse.right = false;
  });

  canvas.addEventListener("contextmenu", e => e.preventDefault());
}
