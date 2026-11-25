// WOK HEI — Stir-Fry Rush: every tunable number and recipe in one place.
// Dishes are Indonesian stir-fry originals with made-up stall names; no real
// restaurant, brand or commercial game is named anywhere in this game.

// Logical playfield. The canvas scales to the window; the game always lays
// its kitchen out on this grid.
export const VIEW = { w: 1280, h: 800 };
export const SHIFT_SECONDS = 180;

export const PLAYER = { radius: 26, speed: 265, carryMax: 3 };

// Ingredients. choppable ones must visit the board before the wok.
export const INGREDIENTS = {
  rice:    { name: 'Nasi',      color: '#f5efe0', choppable: false, key: '1' },
  noodle:  { name: 'Mie',       color: '#f2c14e', choppable: false, key: '2' },
  chicken: { name: 'Ayam',      color: '#e8907c', choppable: true,  key: '3' },
  veg:     { name: 'Sayur',     color: '#7fb069', choppable: true,  key: '4' },
  egg:     { name: 'Telur',     color: '#f6d860', choppable: false, key: '5' },
  sauce:   { name: 'Saus',      color: '#c0392b', choppable: false, key: '6' },
};

// A dish is done when the wok holds exactly its set (order free, wok last).
// needsChop lists the ingredients that must be chopped before they go in.
export const DISHES = {
  nasgor: {
    name: 'Nasi Goreng Api',
    needs: ['rice', 'egg', 'chicken', 'sauce'],
    needsChop: ['chicken'],
    price: 100,
  },
  miegor: {
    name: 'Mie Goreng Wok',
    needs: ['noodle', 'veg', 'egg', 'sauce'],
    needsChop: ['veg'],
    price: 100,
  },
  capcay: {
    name: 'Cap Cay Kilat',
    needs: ['veg', 'chicken', 'sauce'],
    needsChop: ['veg', 'chicken'],
    price: 90,
  },
  geprek: {
    name: 'Ayam Geprek Hei',
    needs: ['chicken', 'sauce', 'rice'],
    needsChop: ['chicken'],
    price: 90,
  },
};

// The order board unlocks harder dishes as the shift goes on.
export const MENU_SCHEDULE = [
  { at: 0, dishes: ['nasgor', 'miegor'] },
  { at: 60, dishes: ['nasgor', 'miegor', 'capcay'] },
  { at: 120, dishes: ['nasgor', 'miegor', 'capcay', 'geprek'] },
];

export const ORDER = {
  spawnEveryStart: 13,
  spawnEveryEnd: 8,
  maxActive: 4,
  timeStart: 48,
  timeEnd: 36,
  tipMax: 50,
};

export const COOK = {
  chopSeconds: 1.4,
  wokSeconds: 3.2,
  burnAfterSeconds: 5,
  serveWindowSeconds: 6,
};

// Kitchen furniture. x/y are the centre, r the interaction radius.
// Stations dispense one ingredient per touch; the board, wok, plate and
// window are the work spots the cook carries things between.
export const STATIONS = [
  { id: 'rice',    kind: 'station', gives: 'rice',    x: 92,  y: 240, label: 'NASI' },
  { id: 'noodle',  kind: 'station', gives: 'noodle',  x: 92,  y: 360, label: 'MIE' },
  { id: 'chicken', kind: 'station', gives: 'chicken', x: 92,  y: 480, label: 'AYAM' },
  { id: 'veg',     kind: 'station', gives: 'veg',     x: 92,  y: 600, label: 'SAYUR' },
  { id: 'egg',     kind: 'station', gives: 'egg',     x: 260, y: 700, label: 'TELUR' },
  { id: 'sauce',   kind: 'station', gives: 'sauce',   x: 430, y: 700, label: 'SAUS' },
  { id: 'board',   kind: 'board',   x: 330, y: 300, label: 'PAPAN POTONG' },
  { id: 'wok',     kind: 'wok',     x: 640, y: 430, label: 'WOK' },
  { id: 'plate',   kind: 'plate',   x: 950, y: 300, label: 'PIRING' },
  { id: 'window',  kind: 'window',  x: 1120, y: 430, label: 'SAJI' },
];

// Warm hawker-stall palette; every drawing in render.js uses these.
export const COLORS = {
  floorA: '#e8c99a',
  floorB: '#dfc08a',
  wall: '#8a5a33',
  counter: '#a06a3b',
  counterTop: '#c98d54',
  board: '#e9dcc3',
  wok: '#3a3a3f',
  wokHot: '#e25822',
  plate: '#f7f3e8',
  pass: '#f2e3c6',
  ink: '#2b1d12',
  cream: '#fff6e0',
  red: '#c0392b',
  green: '#5b8c4a',
  gold: '#f2c14e',
  ticket: '#fff8e7',
};

// Tiny deterministic RNG so ?shot= states render the same every time.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function fmtClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
