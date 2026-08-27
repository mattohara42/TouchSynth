// The two features that run with nobody in the room: the idle ghost and the Eno garden.
// Both must be reversible the instant a kid touches the panel, and neither may leak state.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, countOn } from './harness.js';

/** Run the attract ghost's interval callback n times. */
const tickGhost = (h, n = 1) => {
  const timer = h.intervals.find((i) => i.ms === h.app.ATTRACT_TICK_MS && !i.cleared);
  assert.ok(timer, 'the ghost has a live timer');
  for (let i = 0; i < n; i++) timer.fn();
};

test('attract is off until someone asks for it — a silent panel is the default', () => {
  const { app } = boot();
  assert.equal(app.attractOn, false);
  assert.equal(app.attract, null);
});

test('the idle watcher runs once a second and waits two minutes', () => {
  const h = boot();
  assert.ok(h.intervalWithPeriod(1000), 'the idle poll is registered');
  assert.equal(h.app.IDLE_MS, 2 * 60 * 1000);
});

const idlePoll = (h) => h.intervalWithPeriod(1000).fn();

test('the ghost stays away while attract is off, however long the panel sits', () => {
  const h = boot();
  h.app.started = true;
  h.advance(h.app.IDLE_MS * 10);
  idlePoll(h);
  assert.equal(h.app.attract, null);
});

test('the ghost stays away before the first tap unlocks audio', () => {
  const h = boot();
  h.app.attractOn = true;
  h.app.started = false;
  h.advance(h.app.IDLE_MS + 1);
  idlePoll(h);
  assert.equal(h.app.attract, null, 'a ghost with no audio would just be a light show');
});

test('the ghost stays away while a pattern is on the grid', () => {
  const h = boot();
  h.app.attractOn = true;
  h.app.started = true;
  h.app.setCell(h.app.layers[1], 4, 4, true);
  h.advance(h.app.IDLE_MS + 1);
  idlePoll(h);
  assert.equal(h.app.attract, null, "a kid's pattern is never painted over");
});

test('the ghost stays away until the panel has really been left alone', () => {
  const h = boot();
  h.app.attractOn = true;
  h.app.started = true;
  h.advance(h.app.IDLE_MS - 1000);
  idlePoll(h);
  assert.equal(h.app.attract, null);

  h.advance(1001);
  idlePoll(h);
  assert.ok(h.app.attract, 'and arrives once the idle window passes');
});

const idleGhost = () => {
  const h = boot();
  h.app.attractOn = true;
  h.app.started = true;
  h.advance(h.app.IDLE_MS + 1);
  idlePoll(h);
  return h;
};

test('the ghost places its pattern one dot at a time', () => {
  const h = idleGhost();
  const L = h.app.layers[h.app.li];
  assert.equal(countOn(L), 0, 'nothing placed until the first tick');
  tickGhost(h);
  assert.equal(countOn(L), 1);
  tickGhost(h);
  assert.equal(countOn(L), 2);
  assert.equal(L.placed.length, 2, 'and keeps tap order in step with the grid');
});

test('the ghost holds the finished pattern, then takes it away again', () => {
  const h = idleGhost();
  const L = h.app.layers[h.app.li];
  const dots = h.app.attract.dots.length;

  tickGhost(h, dots);
  assert.equal(h.app.attract.phase, 'holding');
  assert.equal(countOn(L), dots);

  h.advance(h.app.ATTRACT_HOLD_MS + 1);
  tickGhost(h);
  assert.equal(h.app.attract.phase, 'removing');

  tickGhost(h, dots);
  assert.equal(h.app.attract, null, 'the ghost lets go once the last dot is gone');
  assert.equal(countOn(L), 0);
  assert.equal(L.placed.length, 0);
});

test('a whole ghost cycle leaves the grid exactly as it found it', () => {
  const h = idleGhost();
  const L = h.app.layers[h.app.li];
  const dots = h.app.attract.dots.length;
  tickGhost(h, dots);
  h.advance(h.app.ATTRACT_HOLD_MS + 1);
  tickGhost(h, dots + 1);
  for (const layer of h.app.layers) {
    assert.equal(countOn(layer), 0);
    assert.equal(layer.placed.length, 0);
  }
});

test('a touch hands the grid straight back, mid-pattern', () => {
  const h = idleGhost();
  tickGhost(h, 3);
  assert.ok(countOn(h.app.layers[h.app.li]) > 0);

  h.app.stopAttract();
  assert.equal(h.app.attract, null);
  assert.equal(countOn(h.app.layers[h.app.li]), 0, 'whatever the ghost left dissolves');
});

test('stopping the ghost clears its timer, so it cannot keep painting', () => {
  const h = idleGhost();
  const timer = h.intervals.find((i) => i.ms === h.app.ATTRACT_TICK_MS && !i.cleared);
  h.app.stopAttract();
  assert.equal(timer.cleared, true);
});

test('the ghost cycles through its presets rather than repeating one', () => {
  const h = boot();
  h.app.attractOn = true;
  h.app.started = true;
  const seen = [];
  for (let i = 0; i < h.app.ATTRACT_PATTERNS.length + 1; i++) {
    h.advance(h.app.IDLE_MS + 1);
    idlePoll(h);
    seen.push(JSON.stringify(h.app.attract.dots));
    h.app.stopAttract();
  }
  assert.equal(new Set(seen.slice(0, -1)).size, h.app.ATTRACT_PATTERNS.length, 'every preset is distinct');
  assert.equal(seen.at(-1), seen[0], 'and then it wraps round');
});

test('every attract preset is a legal pattern in a real mode', () => {
  const { app } = boot();
  for (const make of app.ATTRACT_PATTERNS) {
    const pat = make();
    assert.equal(typeof app.MODES[pat.mode], 'function', `unknown mode ${pat.mode}`);
    assert.ok(pat.dots.length > 0);
    for (const [c, r] of pat.dots) {
      assert.ok(Number.isInteger(c) && c >= 0 && c < app.N, `column ${c} off the grid`);
      assert.ok(Number.isInteger(r) && r >= 0 && r < app.N, `row ${r} off the grid`);
    }
  }
});

test('the ghost actually makes sound once its dots are down', () => {
  const h = idleGhost();
  tickGhost(h, h.app.attract.dots.length);
  h.clearLog();
  for (let step = 0; step < 32; step++) h.tick(0);
  assert.ok(h.notes().length > 0, 'the preset plays');
});

// ---------- The garden ----------

test('the garden is off by default', () => {
  assert.equal(boot().app.garden, false);
});

test('the garden leaves an empty grid empty — attract owns that case', () => {
  const h = boot();
  h.app.garden = true;
  h.app.tendGarden();
  assert.equal(countOn(h.app.layers[0]), 0);
});

test('a sparse pattern grows', () => {
  const h = boot({ random: () => 0.99 }); // would prune if it were allowed to choose
  const { app } = h;
  app.setCell(app.layers[0], 0, 0, true);
  app.tendGarden();
  assert.equal(countOn(app.layers[0]), 2, 'three dots or fewer always grow');
});

test('a crowded pattern prunes instead of growing without bound', () => {
  const h = boot({ random: () => 0 });
  const { app } = h;
  const L = app.layers[0];
  for (let i = 0; i < 24; i++) app.setCell(L, i % app.N, Math.floor(i / app.N), true);
  assert.equal(countOn(L), 24);
  app.tendGarden();
  assert.equal(countOn(L), 23, 'at the cap it can only prune');
});

test('the garden never grows past its cap over a long afternoon', () => {
  let seed = 1;
  const h = boot({ random: () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648 });
  const { app } = h;
  app.setCell(app.layers[0], 3, 3, true);
  for (let i = 0; i < 2000; i++) app.tendGarden();
  assert.ok(countOn(app.layers[0]) <= 24, 'the grid never fills up');
  assert.ok(countOn(app.layers[0]) > 0, 'and never dies out entirely');
});

test('the garden only ever plants inside the layer own loop', () => {
  let seed = 7;
  const h = boot({ random: () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648 });
  const { app } = h;
  const L = app.layers[0];
  L.len = 5;
  app.setCell(L, 0, 0, true);
  for (let i = 0; i < 500; i++) app.tendGarden();
  for (const p of L.placed) assert.ok(p.col < L.len, `grew a dot at column ${p.col}, outside a ${L.len}-step loop`);
});

test('the evolved pattern is persisted, so it survives a reboot', () => {
  const h = boot({ random: () => 0.1 });
  h.app.setCell(h.app.layers[0], 2, 2, true);
  h.storage.clear();
  h.app.tendGarden();
  assert.ok(h.saved(), 'tending the garden saves');
});

test('the garden tends the grid every 8 bars, and only when switched on', () => {
  const h = boot({ random: () => 0.1 });
  const { app } = h;
  app.setCell(app.layers[0], 2, 2, true);

  app.garden = false;
  for (let i = 0; i < 128; i++) h.tick(0); // audioStep 0..127, crossing the 128-step mark at 0
  assert.equal(countOn(app.layers[0]), 1, 'switched off, nothing evolves');

  app.garden = true;
  const before = countOn(app.layers[0]);
  for (let i = 0; i < 128; i++) h.tick(0);
  assert.notEqual(countOn(app.layers[0]), before, 'switched on, the pattern moved');
});

test('the garden holds off while the ghost owns the grid', () => {
  const h = idleGhost();
  h.app.garden = true;
  tickGhost(h, 2);
  const before = countOn(h.app.layers[h.app.li]);
  for (let i = 0; i < 256; i++) h.tick(0);
  assert.equal(countOn(h.app.layers[h.app.li]), before, 'the two never fight over the same grid');
});
