// WOK HEI — keyboard and mouse, translated into game intent. The canvas is
// letterboxed to a 1280x800 logical field, so mouse positions are mapped
// back into that field before the world ever sees them.
import { VIEW } from './config.js';

export function createInput(canvas) {
  const keys = new Set();
  const mouse = { x: VIEW.w / 2, y: VIEW.h / 2, down: false };
  let clickTarget = null;
  let interactQueued = false;
  let startQueued = false;
  let restartQueued = false;
  let muteQueued = false;

  function toLogical(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const scale = Math.min(r.width / VIEW.w, r.height / VIEW.h);
    const ox = (r.width - VIEW.w * scale) / 2;
    const oy = (r.height - VIEW.h * scale) / 2;
    return {
      x: (clientX - r.left - ox) / scale,
      y: (clientY - r.top - oy) / scale,
    };
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'KeyE' || e.code === 'Space') interactQueued = true;
    if (e.code === 'Enter') startQueued = true;
    if (e.code === 'KeyR') restartQueued = true;
    if (e.code === 'KeyM') muteQueued = true;
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (e) => {
    const p = toLogical(e.clientX, e.clientY);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.down = true;
    clickTarget = { x: p.x, y: p.y };
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = toLogical(e.clientX, e.clientY);
    mouse.x = p.x;
    mouse.y = p.y;
  });
  window.addEventListener('pointerup', () => {
    mouse.down = false;
  });

  function axis() {
    let x = 0;
    let y = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  return {
    keys,
    mouse,
    axis,
    get clickTarget() {
      return clickTarget;
    },
    clearClickTarget() {
      clickTarget = null;
    },
    takeInteract() {
      const v = interactQueued;
      interactQueued = false;
      return v;
    },
    takeStart() {
      const v = startQueued;
      startQueued = false;
      return v;
    },
    takeRestart() {
      const v = restartQueued;
      restartQueued = false;
      return v;
    },
    takeMute() {
      const v = muteQueued;
      muteQueued = false;
      return v;
    },
  };
}
