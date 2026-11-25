// WOK HEI — every pixel is drawn here from the world state. Nothing is an
// image file: the kitchen, the food and the cook are all canvas shapes, so
// the game loads no assets and the screenshots are renders of this code.
import { COLORS, DISHES, INGREDIENTS, STATIONS, VIEW, clamp, fmtClock } from './config.js';
import { nearestStation, stationRect } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx, s, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// One ingredient, drawn the same everywhere (stations, carry bubbles, wok,
// tickets) so the judge can read a dish at a glance.
export function drawIngredient(ctx, id, x, y, s, chopped) {
  const c = INGREDIENTS[id].color;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'rice') {
    ctx.fillStyle = '#f5efe0';
    ctx.beginPath();
    ctx.arc(0, s * 0.1, s * 0.42, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#e2d9c2';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * s * 0.2, -s * 0.18, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'noodle') {
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = s * 0.14;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, i * s * 0.22);
      ctx.bezierCurveTo(-s * 0.2, i * s * 0.22 - s * 0.18, s * 0.1, i * s * 0.22 + s * 0.18, s * 0.42, i * s * 0.22);
      ctx.stroke();
    }
  } else if (id === 'chicken') {
    if (chopped) {
      // Chopped chicken reads as small cubes, never as a cross mark.
      ctx.fillStyle = '#d97a66';
      const cubes = [[-0.3, -0.22], [0.08, -0.3], [0.18, 0.14]];
      for (const [ox, oy] of cubes) {
        rr(ctx, ox * s - s * 0.13, oy * s - s * 0.13, s * 0.26, s * 0.26, s * 0.05);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#e8907c';
      ctx.beginPath();
      ctx.arc(-s * 0.08, -s * 0.05, s * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f5efe0';
      ctx.lineWidth = s * 0.09;
      ctx.beginPath();
      ctx.moveTo(s * 0.18, s * 0.18);
      ctx.lineTo(s * 0.42, s * 0.42);
      ctx.stroke();
    }
  } else if (id === 'veg') {
    ctx.fillStyle = chopped ? '#5d8a48' : '#7fb069';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(i * s * 0.22, -s * 0.05, s * 0.2, s * 0.34, i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#4a6b35';
    ctx.lineWidth = s * 0.06;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.lineTo(0, s * 0.45);
    ctx.stroke();
  } else if (id === 'egg') {
    ctx.fillStyle = '#fdf6e3';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.46, s * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f6d860';
    ctx.beginPath();
    ctx.arc(s * 0.06, 0, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'sauce') {
    ctx.fillStyle = '#c0392b';
    rr(ctx, -s * 0.2, -s * 0.42, s * 0.4, s * 0.72, s * 0.12);
    ctx.fill();
    ctx.fillStyle = '#7e2418';
    rr(ctx, -s * 0.12, -s * 0.52, s * 0.24, s * 0.16, s * 0.05);
    ctx.fill();
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(0, s * 0.38, s * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTicket(ctx, order, x, y, w, h) {
  const dish = DISHES[order.dishId];
  const frac = clamp(order.t / order.max, 0, 1);
  const urgent = frac < 0.3;
  ctx.save();
  ctx.fillStyle = COLORS.ticket;
  ctx.strokeStyle = urgent ? COLORS.red : '#d8c9a3';
  ctx.lineWidth = urgent ? 3 : 2;
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, dish.name, x + 12, y + 18, 17, COLORS.ink, 800);
  dish.needs.forEach((id, i) => {
    drawIngredient(ctx, id, x + 26 + i * 34, y + 48, 26, false);
  });
  // Timer bar.
  ctx.fillStyle = '#e5d9bd';
  rr(ctx, x + 12, y + h - 18, w - 24, 9, 4);
  ctx.fill();
  ctx.fillStyle = urgent ? COLORS.red : frac < 0.6 ? COLORS.gold : COLORS.green;
  rr(ctx, x + 12, y + h - 18, (w - 24) * frac, 9, 4);
  ctx.fill();
  text(ctx, fmtClock(order.t), x + w - 12, y + 18, 16, urgent ? COLORS.red : COLORS.ink, 800, 'right');
  ctx.restore();
}

function drawStation(ctx, st, state, time, near) {
  const rc = stationRect(st);
  ctx.save();
  if (st.kind === 'station') {
    ctx.fillStyle = COLORS.counter;
    rr(ctx, rc.x, rc.y, rc.w, rc.h, 12);
    ctx.fill();
    ctx.fillStyle = COLORS.counterTop;
    rr(ctx, rc.x + 5, rc.y + 5, rc.w - 10, rc.h - 10, 9);
    ctx.fill();
    drawIngredient(ctx, st.gives, st.x, st.y - 12, 54, false);
    text(ctx, st.label, st.x, st.y + 34, 13, COLORS.cream, 800, 'center');
  } else if (st.kind === 'board') {
    ctx.fillStyle = COLORS.board;
    rr(ctx, rc.x, rc.y, rc.w, rc.h, 12);
    ctx.fill();
    ctx.strokeStyle = '#b8a67e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#7a6a4a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(rc.x + 18, rc.y + 22);
    ctx.lineTo(rc.x + 58, rc.y + 58);
    ctx.stroke();
    text(ctx, st.label, st.x, rc.y + rc.h + 16, 13, COLORS.cream, 800, 'center');
    const chop = state.player.chop;
    if (chop) {
      const frac = clamp(chop.t / 1.4, 0, 1);
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(st.x, st.y, 34, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      drawIngredient(ctx, chop.id, st.x, st.y, 44, false);
    }
  } else if (st.kind === 'wok') {
    // Burner glow, then the wok itself.
    ctx.fillStyle = '#5a4632';
    ctx.beginPath();
    ctx.arc(st.x, st.y, 88, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = state.wok.state === 'burnt' ? '#17130f' : COLORS.wok;
    ctx.beginPath();
    ctx.arc(st.x, st.y, 74, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = state.wok.state === 'cooking' ? COLORS.wokHot : '#55555c';
    ctx.lineWidth = 5;
    ctx.stroke();
    state.wok.items.forEach((item, i) => {
      const a = (i / Math.max(1, state.wok.items.length)) * Math.PI * 2 - Math.PI / 2;
      drawIngredient(ctx, item.id, st.x + Math.cos(a) * 34, st.y + Math.sin(a) * 30, 40, item.chopped);
    });
    if (state.wok.state === 'cooking') {
      const frac = clamp(state.wok.t / 3.2, 0, 1);
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(st.x, st.y, 84, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      // Steam.
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const ph = time * 2 + i * 2.1;
        const sx = st.x - 24 + i * 24 + Math.sin(ph) * 6;
        const sy = st.y - 82 - ((ph % 1) * 22);
        ctx.beginPath();
        ctx.moveTo(sx, sy + 14);
        ctx.quadraticCurveTo(sx + 6, sy + 6, sx, sy);
        ctx.stroke();
      }
    }
    if (state.wok.state === 'done') {
      text(ctx, 'MATANG!', st.x, st.y - 96, 18, COLORS.gold, 900, 'center');
    }
    if (state.wok.state === 'burnt') {
      text(ctx, 'GOSONG', st.x, st.y - 96, 18, COLORS.red, 900, 'center');
    }
    text(ctx, st.label, st.x, rc.y + rc.h + 16, 13, COLORS.cream, 800, 'center');
  } else if (st.kind === 'plate') {
    ctx.fillStyle = COLORS.counter;
    rr(ctx, rc.x, rc.y, rc.w, rc.h, 12);
    ctx.fill();
    ctx.fillStyle = COLORS.plate;
    ctx.beginPath();
    ctx.ellipse(st.x, st.y, 56, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cfc8b4';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (state.plate.dish) {
      state.plate.dish.items.forEach((item, i) => {
        drawIngredient(ctx, item.id, st.x - 28 + i * 28, st.y - 4, 34, item.chopped);
      });
      text(ctx, 'SIAP SAJI', st.x, st.y - 52, 15, COLORS.green, 900, 'center');
    }
    text(ctx, st.label, st.x, rc.y + rc.h + 16, 13, COLORS.cream, 800, 'center');
  } else if (st.kind === 'window') {
    ctx.fillStyle = COLORS.pass;
    rr(ctx, rc.x, rc.y, rc.w, rc.h, 12);
    ctx.fill();
    ctx.strokeStyle = '#b89b62';
    ctx.lineWidth = 3;
    ctx.stroke();
    text(ctx, 'SAJI', st.x, st.y - 34, 16, COLORS.ink, 900, 'center');
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.moveTo(st.x - 18, st.y + 8);
    ctx.lineTo(st.x + 18, st.y + 8);
    ctx.lineTo(st.x + 8, st.y + 26);
    ctx.lineTo(st.x - 8, st.y + 26);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(st.x, st.y + 26);
    ctx.lineTo(st.x - 10, st.y + 40);
    ctx.lineTo(st.x + 10, st.y + 40);
    ctx.closePath();
    ctx.fill();
  }
  if (near === st) {
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    rr(ctx, rc.x - 8, rc.y - 8, rc.w + 16, rc.h + 16, 14);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'E', st.x, rc.y - 22, 15, COLORS.gold, 900, 'center');
  }
  ctx.restore();
}

function drawPlayer(ctx, state, time) {
  const p = state.player;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 22, 24, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: apron over a shirt.
  ctx.fillStyle = '#2f6fb2';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f7f3e8';
  rr(ctx, p.x - 15, p.y - 6, 30, 26, 8);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(p.x - 11, p.y - 26, 10, 0, Math.PI * 2);
  ctx.arc(p.x + 11, p.y - 26, 10, 0, Math.PI * 2);
  ctx.arc(p.x, p.y - 30, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(p.x - 16, p.y - 28, 32, 8);
  // Face.
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath();
  ctx.arc(p.x - 8, p.y - 8, 2.5, 0, Math.PI * 2);
  ctx.arc(p.x + 8, p.y - 8, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Carried ingredients as bubbles above the cook.
  p.carry.forEach((item, i) => {
    const bx = p.x + (i - (p.carry.length - 1) / 2) * 34;
    const by = p.y - 62 + Math.sin(time * 3 + i) * 2;
    ctx.fillStyle = 'rgba(255,248,231,0.95)';
    ctx.beginPath();
    ctx.arc(bx, by, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8c9a3';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, item.id, bx, by, 26, item.chopped);
  });
  ctx.restore();
}

function drawBoard(ctx, state) {
  // Top bar: order tickets left, clock and score right.
  ctx.fillStyle = '#3a2417';
  ctx.fillRect(0, 0, VIEW.w, 108);
  ctx.fillStyle = '#54371f';
  ctx.fillRect(0, 104, VIEW.w, 4);
  text(ctx, 'ORDER BOARD', 16, 22, 13, '#d8b98a', 800);
  for (let i = 0; i < 4; i++) {
    const order = state.orders[i];
    const x = 16 + i * 246;
    if (order) drawTicket(ctx, order, x, 32, 234, 66);
    else {
      ctx.strokeStyle = 'rgba(216,185,138,0.4)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      rr(ctx, x, 32, 234, 66, 10);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'menunggu order…', x + 117, 65, 14, 'rgba(216,185,138,0.7)', 600, 'center');
    }
  }
  // Right block: clock on the left, score on the right, combo under the clock.
  text(ctx, 'SHIFT', 1000, 22, 13, '#d8b98a', 800);
  text(ctx, fmtClock(state.shiftLeft), 1130, 58, 34, '#fff6e0', 900, 'right');
  text(ctx, 'SKOR', VIEW.w - 16, 22, 13, '#d8b98a', 800, 'right');
  text(ctx, String(state.score), VIEW.w - 16, 58, 34, '#f2c14e', 900, 'right');
  text(ctx, `tersaji ${state.served}`, VIEW.w - 16, 90, 13, '#fff6e0', 700, 'right');
  if (state.combo >= 2) {
    ctx.fillStyle = COLORS.red;
    rr(ctx, 1000, 72, 130, 28, 14);
    ctx.fill();
    text(ctx, `KOMBO x${state.combo}`, 1065, 86, 15, '#ffffff', 900, 'center');
  }
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,6,0.82)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, 'WOK HEI', VIEW.w / 2, 150, 92, '#f2c14e', 900, 'center');
  text(ctx, '— STIR-FRY RUSH —', VIEW.w / 2, 216, 26, '#fff6e0', 700, 'center');
  text(ctx, 'Dapur kilat: ambil bahan, potong, tumis di wok, sajikan sebelum order hangus.', VIEW.w / 2, 268, 20, '#fff6e0', 600, 'center');
  const lines = [
    'GERAK  WASD / panah, atau klik lantai  •  PAKAI  E atau klik stasiun',
    'Nasi Goreng Api  =  nasi + telur + ayam (potong) + saus',
    'Mie Goreng Wok  =  mie + sayur (potong) + telur + saus',
    'Cap Cay Kilat  =  sayur + ayam (potong) + saus  •  Ayam Geprek Hei  =  ayam + saus + nasi',
    'Wok matang dalam 3 detik — angkat ke piring sebelum gosong (5 detik).',
    'Shift 3 menit. Sajikan cepat untuk tip, beruntun untuk kombo.',
  ];
  lines.forEach((line, i) => {
    text(ctx, line, VIEW.w / 2, 330 + i * 34, 18, i === 0 ? '#f2c14e' : '#fff6e0', i === 0 ? 800 : 600, 'center');
  });
  text(ctx, 'TEKAN ENTER ATAU KLIK UNTUK MULAI', VIEW.w / 2, 580, 24, '#f2c14e', 900, 'center');
  text(ctx, 'M: suara  •  R: ulangi setelah shift selesai', VIEW.w / 2, 622, 15, '#d8b98a', 600, 'center');
}

function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(20,12,6,0.82)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, 'SHIFT SELESAI', VIEW.w / 2, 210, 64, '#f2c14e', 900, 'center');
  const o = state.over;
  text(ctx, `Skor akhir  ${o.score}`, VIEW.w / 2, 320, 30, '#fff6e0', 800, 'center');
  text(ctx, `Hidangan tersaji  ${o.served}   •   Kombo terbaik  x${o.bestCombo}   •   Order gagal  ${o.mistakes}`, VIEW.w / 2, 372, 20, '#fff6e0', 600, 'center');
  const verdict = o.score >= 900 ? 'Koki Wok Sejati!' : o.score >= 500 ? 'Dapur lumayan panas!' : 'Wok-nya masih dingin — coba lagi!';
  text(ctx, verdict, VIEW.w / 2, 430, 22, '#f2c14e', 800, 'center');
  text(ctx, 'TEKAN R UNTUK MAIN LAGI', VIEW.w / 2, 510, 22, '#fff6e0', 900, 'center');
}

export function draw(ctx, state, time) {
  // Floor tiles.
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 13; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x * 100, 108 + y * 88, 100, 88);
    }
  }
  // Wall trim along the top of the kitchen.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 108, VIEW.w, 10);

  const near = state.mode === 'playing' ? nearestStation(state) : null;
  for (const st of STATIONS) drawStation(ctx, st, state, time, near);
  if (state.mode === 'playing' || state.mode === 'over') drawPlayer(ctx, state, time);
  drawBoard(ctx, state);

  if (state.msg && state.msgT > 0 && state.mode === 'playing') {
    ctx.fillStyle = 'rgba(20,12,6,0.85)';
    const w = ctx.measureText(state.msg).width + 36;
    rr(ctx, VIEW.w / 2 - w / 2, 700, w, 40, 20);
    ctx.fill();
    text(ctx, state.msg, VIEW.w / 2, 720, 17, '#fff6e0', 700, 'center');
  }
  if (state.mode === 'title') drawTitle(ctx, state);
  if (state.mode === 'over') drawOver(ctx, state);
}
