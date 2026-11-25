// WOK HEI — the kitchen's state and rules. No drawing here: render.js reads
// this state and draws it, main.js steps it. Every number comes from config.
import {
  COOK,
  DISHES,
  INGREDIENTS,
  MENU_SCHEDULE,
  ORDER,
  PLAYER,
  SHIFT_SECONDS,
  STATIONS,
  clamp,
  mulberry32,
} from './config.js';

export function stationRect(st) {
  const size = {
    station: { w: 96, h: 96 },
    board: { w: 150, h: 90 },
    wok: { w: 170, h: 170 },
    plate: { w: 150, h: 90 },
    window: { w: 110, h: 170 },
  }[st.kind];
  return { x: st.x - size.w / 2, y: st.y - size.h / 2, w: size.w, h: size.h };
}

export function menuFor(elapsed) {
  let dishes = MENU_SCHEDULE[0].dishes;
  for (const step of MENU_SCHEDULE) {
    if (elapsed >= step.at) dishes = step.dishes;
  }
  return dishes;
}

// The wok's contents match a dish when they hold exactly its set.
export function dishFromItems(items) {
  const ids = items.map((i) => i.id).sort().join(',');
  for (const [id, dish] of Object.entries(DISHES)) {
    if ([...dish.needs].sort().join(',') === ids) return id;
  }
  return null;
}

export function createWorld(seed) {
  return {
    seed,
    rng: mulberry32(seed),
    mode: 'title',
    elapsed: 0,
    shiftLeft: SHIFT_SECONDS,
    score: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    mistakes: 0,
    player: { x: 640, y: 620, carry: [], chop: null },
    wok: { items: [], state: 'empty', t: 0, dishId: null },
    plate: { dish: null },
    orders: [],
    spawnT: 6,
    nextOrderId: 1,
    msg: '',
    msgT: 0,
    over: null,
  };
}

export function startShift(state) {
  const fresh = createWorld(state.seed);
  Object.assign(state, fresh, { mode: 'playing' });
  spawnOrder(state);
  state.spawnT = ORDER.spawnEveryStart;
}

function spawnOrder(state) {
  const menu = menuFor(state.elapsed);
  const dishId = menu[Math.floor(state.rng() * menu.length)];
  const frac = clamp(state.elapsed / SHIFT_SECONDS, 0, 1);
  const max = ORDER.timeStart + (ORDER.timeEnd - ORDER.timeStart) * frac;
  state.orders.push({ id: state.nextOrderId++, dishId, t: max, max });
}

function say(state, text) {
  state.msg = text;
  state.msgT = 2.6;
}

export function nearestStation(state) {
  let best = null;
  let bestD = 115;
  for (const st of STATIONS) {
    const d = Math.hypot(state.player.x - st.x, state.player.y - st.y);
    if (d < bestD) {
      bestD = d;
      best = st;
    }
  }
  return best;
}

function resolveCollision(state) {
  const p = state.player;
  const r = PLAYER.radius;
  for (const st of STATIONS) {
    const rc = stationRect(st);
    const cx = clamp(p.x, rc.x, rc.x + rc.w);
    const cy = clamp(p.y, rc.y, rc.y + rc.h);
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d = Math.hypot(dx, dy);
    if (d < r && d > 0.001) {
      p.x = cx + (dx / d) * r;
      p.y = cy + (dy / d) * r;
    } else if (d <= 0.001) {
      p.y = rc.y - r;
    }
  }
  p.x = clamp(p.x, 70, 1210);
  p.y = clamp(p.y, 135, 765);
}

export function tryInteract(state, audio) {
  const st = nearestStation(state);
  if (!st) return false;
  const p = state.player;

  if (st.kind === 'station') {
    if (p.carry.length >= PLAYER.carryMax) {
      say(state, 'Tangan penuh! Sajikan atau masak dulu.');
      audio.error();
      return false;
    }
    p.carry.push({ id: st.gives, chopped: false });
    audio.pickup();
    return true;
  }

  if (st.kind === 'board') {
    if (p.chop) return false;
    const target = p.carry.find((c) => INGREDIENTS[c.id].choppable && !c.chopped);
    if (!target) {
      say(state, 'Nggak ada yang bisa dipotong.');
      audio.error();
      return false;
    }
    p.chop = { id: target.id, t: 0 };
    audio.chop();
    return true;
  }

  if (st.kind === 'wok') {
    if (state.wok.state === 'burnt') {
      state.wok = { items: [], state: 'empty', t: 0, dishId: null };
      say(state, 'Wok gosong dibuang.');
      audio.error();
      return true;
    }
    if (state.wok.state === 'done') {
      say(state, 'Angkat dulu ke piring!');
      audio.error();
      return false;
    }
    if (p.carry.length === 0) {
      say(state, 'Bawa bahan ke wok dulu.');
      audio.error();
      return false;
    }
    const item = p.carry[0];
    if (INGREDIENTS[item.id].choppable && !item.chopped) {
      say(state, 'Potong dulu di papan potong!');
      audio.error();
      return false;
    }
    p.carry.shift();
    state.wok.items.push(item);
    audio.wokIn();
    if (state.wok.items.length >= 2 && state.wok.state === 'empty') {
      state.wok.state = 'cooking';
      state.wok.t = 0;
    }
    return true;
  }

  if (st.kind === 'plate') {
    if (state.plate.dish) {
      say(state, 'Piring sudah ada hidangan.');
      return false;
    }
    if (state.wok.state !== 'done') {
      say(state, 'Wok belum siap diangkat.');
      audio.error();
      return false;
    }
    const dishId = state.wok.dishId;
    state.plate.dish = {
      dishId,
      name: dishId ? DISHES[dishId].name : 'Campuran Wok',
      items: state.wok.items,
    };
    state.wok = { items: [], state: 'empty', t: 0, dishId: null };
    audio.pickup();
    return true;
  }

  if (st.kind === 'window') {
    if (!state.plate.dish) {
      say(state, 'Nggak ada hidangan di piring.');
      audio.error();
      return false;
    }
    const dish = state.plate.dish;
    const order = state.orders.find((o) => o.dishId === dish.dishId);
    state.plate.dish = null;
    if (!order) {
      state.combo = 0;
      state.mistakes += 1;
      say(state, 'Tidak ada yang pesan ini. Hidangan dibuang.');
      audio.error();
      return true;
    }
    const price = dish.dishId ? DISHES[dish.dishId].price : 20;
    const tip = Math.round(ORDER.tipMax * (order.t / order.max));
    const bonus = state.combo * 10;
    const total = price + tip + bonus;
    state.score += total;
    state.served += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.orders = state.orders.filter((o) => o.id !== order.id);
    say(state, `Tersaji! +${total} (${price} + tip ${tip}${bonus ? ` + kombo ${bonus}` : ''})`);
    audio.serve();
    return true;
  }
  return false;
}

export function update(state, input, audio, dt) {
  if (state.mode !== 'playing') return;
  dt = Math.min(dt, 0.05);
  state.elapsed += dt;
  state.shiftLeft = SHIFT_SECONDS - state.elapsed;
  if (state.msgT > 0) state.msgT -= dt;
  if (state.shiftLeft <= 0) {
    state.shiftLeft = 0;
    state.mode = 'over';
    state.over = {
      served: state.served,
      score: state.score,
      bestCombo: state.bestCombo,
      mistakes: state.mistakes,
    };
    audio.sizzleStop();
    audio.over();
    return;
  }

  // Movement: keys win over a click target.
  const p = state.player;
  const ax = input.axis();
  if (ax.x !== 0 || ax.y !== 0) {
    input.clearClickTarget();
    p.x += ax.x * PLAYER.speed * dt;
    p.y += ax.y * PLAYER.speed * dt;
  } else if (input.clickTarget) {
    const dx = input.clickTarget.x - p.x;
    const dy = input.clickTarget.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 12) {
      p.x += (dx / d) * PLAYER.speed * dt;
      p.y += (dy / d) * PLAYER.speed * dt;
    } else {
      const target = input.clickTarget;
      input.clearClickTarget();
      let st = null;
      let bestD = 115;
      for (const s of STATIONS) {
        const dd = Math.hypot(target.x - s.x, target.y - s.y);
        if (dd < bestD) {
          bestD = dd;
          st = s;
        }
      }
      if (st) tryInteract(state, audio);
    }
  }
  resolveCollision(state);

  // Chopping needs the cook to stand at the board.
  if (p.chop) {
    const board = STATIONS.find((s) => s.id === 'board');
    const d = Math.hypot(p.x - board.x, p.y - board.y);
    if (d > 130) {
      p.chop = null;
      say(state, 'Potongan batal.');
    } else {
      p.chop.t += dt;
      if (p.chop.t >= COOK.chopSeconds) {
        const item = p.carry.find((c) => c.id === p.chop.id && !c.chopped);
        if (item) item.chopped = true;
        p.chop = null;
        audio.chopDone();
      }
    }
  }

  // Wok: cooking, done, then burnt if left too long.
  const wok = state.wok;
  if (wok.state === 'cooking') {
    wok.t += dt;
    audio.sizzleStart();
    if (wok.t >= COOK.wokSeconds) {
      wok.state = 'done';
      wok.t = 0;
      wok.dishId = dishFromItems(wok.items);
      audio.sizzleStop();
      audio.ding();
      say(state, wok.dishId ? `${DISHES[wok.dishId].name} matang! Angkat ke piring.` : 'Campuran matang! Angkat ke piring.');
    }
  } else {
    audio.sizzleStop();
    if (wok.state === 'done') {
      wok.t += dt;
      if (wok.t >= COOK.burnAfterSeconds) {
        wok.state = 'burnt';
        say(state, 'Gosong! Buang isi wok.');
        audio.error();
      }
    }
  }

  // Orders tick down; an expired ticket breaks the combo.
  for (const order of [...state.orders]) {
    order.t -= dt;
    if (order.t <= 0) {
      state.orders = state.orders.filter((o) => o.id !== order.id);
      state.combo = 0;
      state.mistakes += 1;
      say(state, `Order ${DISHES[order.dishId].name} hangus!`);
      audio.error();
    }
  }

  // New tickets arrive faster as the shift goes on.
  state.spawnT -= dt;
  if (state.spawnT <= 0) {
    if (state.orders.length < ORDER.maxActive) {
      spawnOrder(state);
      audio.order();
    }
    const frac = clamp(state.elapsed / SHIFT_SECONDS, 0, 1);
    state.spawnT = ORDER.spawnEveryStart + (ORDER.spawnEveryEnd - ORDER.spawnEveryStart) * frac;
  }
}
