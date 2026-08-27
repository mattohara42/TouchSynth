// Seam 2: the audio engine owns timing and never depends on the render loop.
// Each mode is a "what fires when" strategy — these tests pin the strategy for each one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './harness.js';

const notesOf = (h) => h.notes().map((n) => n.note);

test('Score fires the active cells of the column under the playhead', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.setCell(L, 0, 15, true); // column 0, bottom row  -> C3
  app.setCell(L, 0, 0, true);  // column 0, top row     -> C6
  app.setCell(L, 1, 15, true); // column 1              -> next step
  h.clearLog();

  app.MODES.score(L, 0, 0);
  assert.deepEqual(notesOf(h).sort(), ['C3', 'C6']);

  h.clearLog();
  app.MODES.score(L, 1, 0);
  assert.deepEqual(notesOf(h), ['C3']);
});

test('Score plays nothing for a column with no active cells', () => {
  const h = boot();
  const { app } = h;
  app.setCell(app.layers[0], 5, 5, true);
  h.clearLog();
  app.MODES.score(app.layers[0], 0, 0);
  assert.deepEqual(h.notes(), []);
});

test('Score pitch is row-mapped: higher on the grid is higher in pitch', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  for (let row = 0; row < app.N; row++) {
    app.setCell(L, 0, row, true);
    h.clearLog();
    app.MODES.score(L, 0, 0);
    assert.equal(h.notes()[0].note, app.SCALE[app.N - 1 - row], `row ${row}`);
    app.setCell(L, 0, row, false);
  }
});

test('Score wraps at the layer loop length, not at 16', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  L.len = 4;
  app.setCell(L, 0, 15, true);
  h.clearLog();
  app.MODES.score(L, 4, 0); // step 4 wraps back to column 0
  assert.deepEqual(notesOf(h), ['C3']);

  h.clearLog();
  app.MODES.score(L, 5, 0); // column 1 — empty
  assert.deepEqual(h.notes(), []);
});

test('unequal loop lengths let layers phase against each other (Reich)', () => {
  const h = boot();
  const { app } = h;
  const [a, b] = app.layers;
  a.len = 16; b.len = 15;
  app.setCell(a, 0, 15, true);
  app.setCell(b, 0, 15, true);

  const together = [];
  for (let step = 0; step < 32; step++) {
    h.clearLog();
    app.MODES.score(a, step, 0);
    const aFired = h.notes().length > 0;
    h.clearLog();
    app.MODES.score(b, step, 0);
    const bFired = h.notes().length > 0;
    if (aFired && bFired) together.push(step);
  }
  assert.deepEqual(together, [0], 'the two layers only line up on the first pass');
});

test('Score uses the voice belonging to its own layer', () => {
  const h = boot();
  const { app } = h;
  app.layers.forEach((L) => app.setCell(L, 0, 15, true));
  h.clearLog();
  for (const L of app.layers) app.MODES.score(L, 0, 0);
  const used = h.notes().map((n) => n.voice);
  assert.equal(new Set(used).size, 3, 'three layers, three distinct voices');
});

test('Score passes the transport time straight through to the voice', () => {
  const h = boot();
  const { app } = h;
  app.setCell(app.layers[0], 0, 15, true);
  h.clearLog();
  app.MODES.score(app.layers[0], 0, 12.5);
  assert.equal(h.notes()[0].time, 12.5, 'scheduling is sample-accurate, not rAF-timed');
  assert.equal(h.notes()[0].dur, '16n');
});

test('Bounce pitch is column-mapped: left low, right high', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.setCell(L, 0, 15, true);  // period (16-15) = 1
  app.setCell(L, 7, 15, true);
  h.clearLog();
  app.MODES.bounce(L, 0, 0);
  assert.deepEqual(notesOf(h).sort(), [app.SCALE[0], app.SCALE[7]].sort());
});

test('Bounce period is 16 - row, so higher placement pulses slower', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.setCell(L, 0, 12, true); // period 4
  const hits = [];
  for (let step = 0; step < 16; step++) {
    h.clearLog();
    app.MODES.bounce(L, step, 0);
    if (h.notes().length) hits.push(step);
  }
  assert.deepEqual(hits, [0, 4, 8, 12]);
});

test('Bounce interlocks different periods into a polyrhythm', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.setCell(L, 2, 13, true); // period 3
  app.setCell(L, 5, 12, true); // period 4
  const counts = [];
  for (let step = 0; step < 12; step++) {
    h.clearLog();
    app.MODES.bounce(L, step, 0);
    counts.push(h.notes().length);
  }
  // period 3 hits on 0,3,6,9; period 4 on 0,4,8 — they only coincide at 0
  assert.deepEqual(counts, [2, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0]);
});

test('Bounce ripples from the floor, coloured by column', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.setCell(L, 3, 15, true);
  app.ripples.length = 0;
  app.MODES.bounce(L, 0, 0);
  h.flushDraw();
  const r = app.ripples.at(-1);
  assert.equal(r.row, app.N - 1, 'the ball strikes the floor');
  assert.equal(r.ci, 3 % 5, 'colour follows the column, because pitch does');
});

test('Random hops dot to dot in placement order, one hop per 8th', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.setCell(L, 4, 15, true); // placed first  -> C3
  app.setCell(L, 9, 14, true); // placed second -> D3
  h.clearLog();

  app.MODES.random(L, 0, 0);
  assert.deepEqual(notesOf(h), ['C3']);
  h.clearLog();
  app.MODES.random(L, 2, 0);
  assert.deepEqual(notesOf(h), ['D3']);
  h.clearLog();
  app.MODES.random(L, 4, 0); // wraps back to the first dot
  assert.deepEqual(notesOf(h), ['C3']);
});

test('Random stays silent on odd steps and on an empty grid', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.setCell(L, 0, 15, true);
  h.clearLog();
  app.MODES.random(L, 1, 0);
  assert.deepEqual(h.notes(), [], 'odd steps are between hops');

  app.clearGrid(L);
  h.clearLog();
  app.MODES.random(L, 0, 0);
  assert.deepEqual(h.notes(), [], 'nothing placed, nothing to hop to');
});

test('Random tracks the hop so the renderer can draw the light travelling', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.setCell(L, 4, 10, true);
  app.setCell(L, 9, 2, true);

  app.MODES.random(L, 0, 0);
  h.flushDraw();
  assert.equal(L.randFrom, null, 'no previous dot on the first hop');
  assert.deepEqual({ col: L.randTo.col, row: L.randTo.row }, { col: 4, row: 10 });

  h.advance(50);
  app.MODES.random(L, 2, 0);
  h.flushDraw();
  assert.deepEqual({ col: L.randFrom.col, row: L.randFrom.row }, { col: 4, row: 10 });
  assert.deepEqual({ col: L.randTo.col, row: L.randTo.row }, { col: 9, row: 2 });
  assert.equal(L.randAt, h.now());
});

test('Draw plays exactly like Score while its dots are alive', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  L.mode = 'draw';
  app.paintCell(L, 0, 15);
  h.clearLog();
  app.MODES.draw(L, 0, 0);
  assert.deepEqual(notesOf(h), ['C3']);
});

test('Draw dots evaporate once their expiry passes', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  L.len = 16;
  app.paintCell(L, 0, 15);
  const life = app.DRAW_LOOPS * L.len * app.STEP_MS;

  h.advance(life - 1);
  app.MODES.draw(L, 0, 0);
  assert.equal(L.grid[0][15], true, 'still alive just before expiry');

  h.advance(2);
  h.clearLog();
  app.MODES.draw(L, 0, 0);
  assert.equal(L.grid[0][15], false, 'gone once expiry passes');
  assert.equal(L.placed.length, 0);
  assert.deepEqual(h.notes(), [], 'and it does not sound on the step that removes it');
});

test('Draw leaves cells that carry no expiry alone', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.setCell(L, 0, 15, true); // placed by a normal tap, no exp
  h.advance(10_000_000);
  app.MODES.draw(L, 0, 0);
  assert.equal(L.grid[0][15], true, 'only painted dots evaporate');
});

test('Draw expiry does not wait on the render loop', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.paintCell(L, 0, 15);
  h.advance(app.DRAW_LOOPS * L.len * app.STEP_MS + 1);
  app.MODES.draw(L, 0, 0);
  // no flushDraw() — a stalled rAF must not strand dots on the grid
  assert.equal(L.grid[0][15], false);
});

test('Push and Solo make no sound on the transport clock — the finger is the sequencer', () => {
  const h = boot();
  const { app } = h;
  for (const mode of ['push', 'solo']) {
    const L = app.layers[0];
    L.mode = mode;
    app.setCell(L, 0, 15, true);
    h.clearLog();
    app.MODES[mode](L, 0, 0);
    assert.deepEqual(h.notes(), [], `${mode} is a no-op on the clock`);
    app.clearGrid(L);
  }
});

test('every mode name in the switcher has an engine strategy', () => {
  const { app } = boot();
  for (const b of app.modeButtons()) {
    assert.equal(typeof app.MODES[b.m], 'function', `mode ${b.m} has no strategy`);
  }
});

test('the transport tick advances the step and drives every layer', () => {
  const h = boot();
  const { app } = h;
  app.layers.forEach((L) => app.setCell(L, 0, 15, true));
  h.clearLog();

  h.tick(0);
  assert.equal(app.audioStep, 0);
  assert.equal(h.notes().length, 3, 'you edit one layer, all of them sound');

  h.tick(0.5);
  assert.equal(app.audioStep, 1);
});

test('the renderer step is updated through Tone.Draw, not by the audio thread', () => {
  const h = boot();
  const { app } = h;
  app.drawStep = -1;
  h.tick(0);
  assert.equal(app.drawStep, -1, 'nothing visual happens until the draw queue is flushed');
  h.advance(25);
  h.flushDraw();
  assert.equal(app.drawStep, 0);
  assert.equal(h.now(), 1025);
});

test('layers with different modes run side by side on one clock', () => {
  const h = boot();
  const { app } = h;
  const [a, b] = app.layers;
  a.mode = 'score'; b.mode = 'bounce';
  app.setCell(a, 0, 15, true); // Score: column 0, row 15 -> C3
  app.setCell(b, 4, 15, true); // Bounce: column 4, period 1 -> SCALE[4]
  h.clearLog();
  h.tick(0);
  assert.deepEqual(notesOf(h).sort(), ['C3', app.SCALE[4]].sort());
});
