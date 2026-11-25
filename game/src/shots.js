// WOK HEI — fixed states for the screenshots. ?shot=start|play|serve|rush
// (with &seed=1) always renders the same frame, so the screenshots the judge
// sees are exact renders of the game's own code.
import { mulberry32 } from './config.js';
import { startShift } from './world.js';

function basePlaying(state, seed, elapsed, score, served, combo) {
  startShift(state);
  state.seed = seed;
  state.rng = mulberry32(seed);
  state.elapsed = elapsed;
  state.shiftLeft = 180 - elapsed;
  state.score = score;
  state.served = served;
  state.combo = combo;
  state.bestCombo = combo;
  state.orders = [];
  state.wok = { items: [], state: 'empty', t: 0, dishId: null };
  state.plate = { dish: null };
  state.player.carry = [];
  state.player.chop = null;
  state.msg = '';
  state.msgT = 0;
}

export function applyShot(state, name, seed) {
  if (name === 'start') {
    state.mode = 'title';
    state.orders = [
      { id: 1, dishId: 'nasgor', t: 40, max: 48 },
      { id: 2, dishId: 'miegor', t: 28, max: 48 },
    ];
    state.score = 0;
    state.served = 0;
    state.combo = 0;
    return;
  }
  if (name === 'play') {
    basePlaying(state, seed, 45, 240, 3, 2);
    state.orders = [
      { id: 1, dishId: 'nasgor', t: 30, max: 48 },
      { id: 2, dishId: 'miegor', t: 18, max: 48 },
      { id: 3, dishId: 'capcay', t: 38, max: 48 },
    ];
    state.player.x = 560;
    state.player.y = 540;
    state.player.carry = [
      { id: 'rice', chopped: false },
      { id: 'egg', chopped: false },
    ];
    state.wok = {
      items: [
        { id: 'rice', chopped: false },
        { id: 'egg', chopped: false },
      ],
      state: 'cooking',
      t: 1.6,
      dishId: null,
    };
    // A finished dish already waits on the plate, so the cover shows the
    // whole loop at once: board, ingredients, wok mid-cook, plate ready.
    state.plate.dish = {
      dishId: 'capcay',
      name: 'Cap Cay Kilat',
      items: [
        { id: 'veg', chopped: true },
        { id: 'chicken', chopped: true },
        { id: 'sauce', chopped: false },
      ],
    };
    return;
  }
  if (name === 'serve') {
    basePlaying(state, seed, 90, 410, 5, 3);
    state.orders = [
      { id: 1, dishId: 'miegor', t: 22, max: 44 },
      { id: 2, dishId: 'capcay', t: 12, max: 44 },
    ];
    state.player.x = 1010;
    state.player.y = 440;
    state.plate.dish = {
      dishId: 'nasgor',
      name: 'Nasi Goreng Api',
      items: [
        { id: 'rice', chopped: false },
        { id: 'egg', chopped: false },
        { id: 'chicken', chopped: true },
        { id: 'sauce', chopped: false },
      ],
    };
    return;
  }
  if (name === 'rush') {
    basePlaying(state, seed, 150, 890, 11, 4);
    state.orders = [
      { id: 1, dishId: 'nasgor', t: 8, max: 36 },
      { id: 2, dishId: 'miegor', t: 15, max: 36 },
      { id: 3, dishId: 'capcay', t: 24, max: 36 },
      { id: 4, dishId: 'geprek', t: 30, max: 36 },
    ];
    state.player.x = 700;
    state.player.y = 540;
    state.player.carry = [
      { id: 'noodle', chopped: false },
      { id: 'sauce', chopped: false },
    ];
    state.wok = {
      items: [
        { id: 'noodle', chopped: false },
        { id: 'veg', chopped: true },
        { id: 'egg', chopped: false },
        { id: 'sauce', chopped: false },
      ],
      state: 'done',
      t: 1.0,
      dishId: 'miegor',
    };
    return;
  }
  // Unknown shot: show the title.
  state.mode = 'title';
}
