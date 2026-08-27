// Test harness: boots index.html's inline script inside a Node vm sandbox.
//
// The app is deliberately one file of globals with no build step (see CLAUDE.md), so
// rather than restructure it for testability we give it a fake browser and a fake Tone.js
// and reach into its scope through an epilogue appended at load time. index.html itself is
// never modified — the tests read the shipping file, so they can't drift from it.
//
// Everything the app touches is stubbed deterministically:
//   * performance.now() reads a clock the test advances by hand
//   * setInterval / requestAnimationFrame record their callbacks instead of running
//   * Tone voices record every note they are asked to play
//   * Tone.Draw.schedule queues visual work until the test flushes it
//   * localStorage is a plain Map
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url));
export const INDEX_HTML = join(HERE, '..', 'index.html');

/** Pull the inline (non-src) <script> body out of index.html. */
export function appSource(html = readFileSync(INDEX_HTML, 'utf8')) {
  const m = html.match(/<script>\s*\n([\s\S]*?)\n<\/script>/);
  if (!m) throw new Error('could not find the inline <script> block in index.html');
  return m[1];
}

// Names bound with const/let at the top of the script live in the script's lexical scope,
// not on the global object, so we hand them out through getters that stay live.
const EPILOGUE = `
;globalThis.__app = {
  N, LAYERS, layers, mkLayer, SCALES, MODES, ATTRACT_PATTERNS,
  setScale, setCell, paintCell, mirrorTargets, clearGrid, spawnRipple, poke, spring, btnScale,
  pushDown, pushMove, pushUp, releaseAllHeld, playSolo, tendGarden, save,
  layout, applyNight, checkNight, makeSprites, draw,
  btnR, clearButton, transportButton, gearButton, modeButtons, layerButtons,
  startAttract, stopAttract,
  ripples, pointers, voices, padVoice, canvas, ctx,
  DRAW_LOOPS, RIPPLE_MAX, RIPPLE_MS, ANIM_MS, CLEAR_HOLD_MS, IDLE_MS, ATTRACT_TICK_MS, ATTRACT_HOLD_MS,
  SAVE_KEY, DAY_CANDY, DAY_BG, NIGHT_BG,
  get SCALE() { return SCALE; },
  get scaleName() { return scaleName; },
  get li() { return li; }, set li(v) { li = v; },
  get mirror() { return mirror; }, set mirror(v) { mirror = v; },
  get garden() { return garden; }, set garden(v) { garden = v; },
  get attractOn() { return attractOn; }, set attractOn(v) { attractOn = v; },
  get attract() { return attract; },
  get playing() { return playing; }, set playing(v) { playing = v; },
  get started() { return started; }, set started(v) { started = v; },
  get lastTouch() { return lastTouch; }, set lastTouch(v) { lastTouch = v; },
  get clearHoldStart() { return clearHoldStart; }, set clearHoldStart(v) { clearHoldStart = v; },
  get btnPop() { return btnPop; }, set btnPop(v) { btnPop = v; },
  get STEP_MS() { return STEP_MS; }, set STEP_MS(v) { STEP_MS = v; },
  get drawStep() { return drawStep; }, set drawStep(v) { drawStep = v; },
  get audioStep() { return audioStep; },
  get night() { return night; },
  get CANDY() { return CANDY; },
  get BG() { return BG; },
  get cell() { return cell; }, get gap() { return gap; },
  get ox() { return ox; }, get oy() { return oy; },
  get bar() { return bar; }, get twoRow() { return twoRow; },
};
`;

function makeGradient() {
  return { addColorStop() {} };
}

/** A canvas 2D context that swallows every drawing call but records that it happened. */
function makeCtx(record) {
  const state = {};
  return new Proxy(state, {
    get(target, prop) {
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return (...args) => { record.push([prop, args.length]); return makeGradient(); };
      }
      if (prop in target) return target[prop];
      return (...args) => { record.push([String(prop), args.length]); };
    },
    set(target, prop, value) { target[prop] = value; return true; },
  });
}

function makeElement(id, doc) {
  return {
    id,
    value: '',
    textContent: '',
    dataset: {},
    style: {},
    listeners: new Map(),
    addEventListener(type, fn) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(fn);
    },
    /** Fire every handler registered for `type`, in order. */
    emit(type, event = {}) {
      for (const fn of this.listeners.get(type) || []) fn(event);
    },
    getContext: () => doc.__ctx,
  };
}

/**
 * Boot the app in a fresh sandbox.
 * @param {object} [opts]
 * @param {number} [opts.width]  innerWidth (default 1280 — a wide, one-row layout)
 * @param {number} [opts.height] innerHeight
 * @param {number} [opts.now]    starting value of the fake clock
 * @param {object} [opts.storage] seed localStorage with these key/value pairs
 * @param {number} [opts.hours]  hour of day checkNight() should see (default 12 — daytime)
 * @param {() => number} [opts.random] replacement for Math.random
 */
export function boot(opts = {}) {
  const {
    width = 1280, height = 800, now = 1000,
    storage = {}, hours = 12, random,
  } = opts;

  const clock = { t: now };
  const drawCalls = []; // recorded ctx calls
  const drawQueue = []; // Tone.Draw.schedule callbacks awaiting flush
  const intervals = []; // { id, fn, ms, cleared }
  const rafs = [];
  const store = new Map(Object.entries(storage));
  const windowListeners = new Map();

  const elements = new Map();
  const doc = {
    __ctx: null,
    body: { style: {} },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeElement(id, doc));
      return elements.get(id);
    },
    createElement(tag) {
      const el = makeElement(tag, doc);
      el.width = 0; el.height = 0;
      return el;
    },
    querySelector(sel) {
      const m = sel.match(/\.len\[data-l="(\d)"\]/);
      if (m) return doc.getElementById('len-slider-' + m[1]);
      return null;
    },
    querySelectorAll(sel) {
      if (sel === '.len') {
        return [0, 1, 2].map((i) => {
          const el = doc.getElementById('len-slider-' + i);
          el.dataset.l = String(i);
          return el;
        });
      }
      return [];
    },
    addEventListener() {},
  };
  doc.__ctx = makeCtx(drawCalls);

  const voiceLog = [];
  const makeVoice = (name) => ({
    name,
    volume: { value: 0 },
    connect() { return this; },
    toDestination() { return this; },
    triggerAttackRelease(note, dur, time) { voiceLog.push({ voice: name, kind: 'attackRelease', note, dur, time }); },
    triggerAttack(note, time) { voiceLog.push({ voice: name, kind: 'attack', note, time }); },
    triggerRelease(note, time) { voiceLog.push({ voice: name, kind: 'release', note, time }); },
  });

  let voiceCount = 0;
  const transportRepeats = [];
  const transport = {
    bpm: { value: 120 },
    swing: 0,
    swingSubdivision: '',
    started: false,
    paused: false,
    scheduleRepeat(fn, interval) { transportRepeats.push({ fn, interval }); return transportRepeats.length - 1; },
    start() { this.started = true; this.paused = false; },
    pause() { this.paused = true; },
    stop() { this.started = false; },
  };

  const Tone = {
    Synth: function Synth() {},
    FMSynth: function FMSynth() {},
    PolySynth: function PolySynth() { return makeVoice('poly' + voiceCount++); },
    Limiter: function Limiter() { return makeVoice('limiter'); },
    Transport: transport,
    Destination: { volume: { value: 0 } },
    Draw: { schedule(fn, time) { drawQueue.push({ fn, time }); } },
    start: async () => { Tone.__started = true; },
    __started: false,
  };
  // `new Tone.PolySynth(...)` returns our object because the constructors return one explicitly.

  const localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    clear: () => store.clear(),
  };

  class FakeDate extends Date {
    getHours() { return hours; }
  }

  const warnings = [];
  const asserts = [];
  const sandbox = {
    Tone,
    document: doc,
    localStorage,
    innerWidth: width,
    innerHeight: height,
    devicePixelRatio: 1,
    addEventListener(type, fn) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(fn);
    },
    performance: { now: () => clock.t },
    requestAnimationFrame(fn) { rafs.push(fn); return rafs.length; },
    cancelAnimationFrame() {},
    setInterval(fn, ms) { intervals.push({ id: intervals.length + 1, fn, ms, cleared: false }); return intervals.length; },
    clearInterval(id) { const it = intervals[id - 1]; if (it) it.cleared = true; },
    setTimeout(fn) { return 0; },
    clearTimeout() {},
    Date: FakeDate,
    Math: random ? Object.create(Math, { random: { value: random, writable: true } }) : Math,
    console: {
      log: () => {},
      warn: (...a) => warnings.push(a),
      error: (...a) => warnings.push(a),
      assert: (ok, ...rest) => { if (!ok) asserts.push(rest); },
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(appSource() + EPILOGUE, sandbox, { filename: 'index.html:inline' });

  const app = sandbox.__app;

  return {
    app,
    sandbox,
    clock,
    /** Advance the fake clock (ms) and return the new time. */
    advance(ms) { clock.t += ms; return clock.t; },
    now: () => clock.t,
    voiceLog,
    /** Notes recorded since the last clearLog(). */
    notes: () => voiceLog.slice(),
    clearLog() { voiceLog.length = 0; },
    drawQueue,
    /** Run every queued Tone.Draw callback, in schedule order. */
    flushDraw() {
      const q = drawQueue.splice(0, drawQueue.length);
      for (const { fn } of q) fn();
      return q.length;
    },
    /** Drive one transport 16th-note tick (the audio clock). */
    tick(time = 0) {
      for (const { fn } of transportRepeats) fn(time);
    },
    transport,
    transportRepeats,
    intervals,
    /** The live (uncleared) interval registered with this period, if any. */
    intervalWithPeriod(ms) { return intervals.find((i) => i.ms === ms && !i.cleared); },
    rafs,
    drawCalls,
    storage: store,
    /** Parse whatever the app last wrote to localStorage. */
    saved() {
      const raw = store.get(app.SAVE_KEY);
      return raw == null ? null : JSON.parse(raw);
    },
    elements,
    warnings,
    consoleAsserts: asserts,
    /** The <canvas> the app draws on and listens to. */
    canvas: () => doc.getElementById('c'),
    /** Fire a canvas-level pointer event (pointerdown / pointermove). */
    emitCanvas(type, event) {
      doc.getElementById('c').emit(type, { preventDefault() {}, pointerId: 1, ...event });
    },
    /** Fire a window-level event (pointerup / pointercancel / resize). Awaits async handlers. */
    async emitWindow(type, event = {}) {
      const evt = { preventDefault() {}, pointerId: 1, ...event };
      for (const fn of windowListeners.get(type) || []) await fn(evt);
    },
    windowListeners,
    /** A full tap: down then up, at page coordinates (x, y). */
    async tap(x, y, pointerId = 1) {
      this.emitCanvas('pointerdown', { clientX: x, clientY: y, pointerId });
      await this.emitWindow('pointerup', { pointerId });
    },
    /** Press without releasing. */
    press(x, y, pointerId = 1) {
      this.emitCanvas('pointerdown', { clientX: x, clientY: y, pointerId });
    },
    /** Drag an already-pressed finger. */
    move(x, y, pointerId = 1) {
      this.emitCanvas('pointermove', { clientX: x, clientY: y, pointerId });
    },
    /** Release a pressed finger. */
    release(pointerId = 1) {
      return this.emitWindow('pointerup', { pointerId });
    },
  };
}

/** Coordinates of the centre of grid cell (col, row) for the booted layout. */
export function cellCenter(app, col, row) {
  return { x: app.ox + col * app.cell + app.cell / 2, y: app.oy + row * app.cell + app.cell / 2 };
}

/** Count the ON cells in a layer's grid. */
export function countOn(L) {
  let n = 0;
  for (const col of L.grid) for (const v of col) if (v) n++;
  return n;
}

/**
 * Normalise a value that came out of the vm realm.
 * Arrays and objects created inside the sandbox carry that realm's prototypes, which
 * assert.deepEqual (strict) refuses to match against host-realm literals. A JSON
 * round-trip strips the realm without weakening the comparison.
 */
export const plain = (v) => JSON.parse(JSON.stringify(v));
