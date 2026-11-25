// WOK HEI — boot and the game loop. The canvas is letterboxed onto a
// 1280x800 logical field; ?shot=<name>&seed=<n> freezes one exact frame for
// the screenshots instead of playing.
import { VIEW } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { applyShot } from './shots.js';
import { draw } from './render.js';
import { createWorld, startShift, tryInteract, update } from './world.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const ctx = canvas.getContext('2d');
const audio = createAudio();
const input = createInput(canvas);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;
const state = createWorld(seed);

function say(text) {
  if (statusEl) statusEl.textContent = text;
}

function fit() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = window.innerWidth;
  const ch = window.innerHeight;
  canvas.width = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  const scale = Math.min(canvas.width / VIEW.w, canvas.height / VIEW.h);
  const ox = (canvas.width - VIEW.w * scale) / 2;
  const oy = (canvas.height - VIEW.h * scale) / 2;
  ctx.setTransform(scale, 0, 0, scale, ox, oy);
}

window.addEventListener('resize', fit);
fit();

if (shot) {
  // Screenshot mode: one frozen, deterministic frame.
  applyShot(state, shot, seed);
  fit();
  ctx.fillStyle = '#1a120b';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  draw(ctx, state, 0);
  say(`WOK HEI screenshot: ${shot}`);
} else {
  say('WOK HEI Stir-Fry Rush. Tekan Enter atau klik untuk mulai.');
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (input.takeMute()) {
      const muted = audio.toggleMute();
      say(muted ? 'Suara mati.' : 'Suara hidup.');
    }
    if (state.mode === 'title') {
      if (input.takeStart() || input.clickTarget) {
        input.clearClickTarget();
        audio.unlock();
        startShift(state);
        say('Shift dimulai! Ambil bahan, potong, tumis, sajikan.');
      }
    } else if (state.mode === 'playing') {
      if (input.takeInteract()) tryInteract(state, audio);
      update(state, input, audio, dt);
    } else if (state.mode === 'over') {
      if (input.takeRestart()) {
        audio.unlock();
        startShift(state);
        say('Shift baru dimulai!');
      }
    }
    fit();
    ctx.fillStyle = '#1a120b';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    draw(ctx, state, now / 1000);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
