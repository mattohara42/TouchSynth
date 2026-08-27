// Seam 1: state is dumb data. setCell is the single place that owns toggle bookkeeping —
// grid, tap order, and the rubber-anim timestamps must never drift apart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, countOn, plain } from './harness.js';

test('a fresh layer set is empty, on Score, full loop length', () => {
  const { app } = boot();
  assert.equal(app.layers.length, app.LAYERS);
  for (const L of app.layers) {
    assert.equal(countOn(L), 0);
    assert.equal(L.placed.length, 0);
    assert.equal(L.mode, 'score');
    assert.equal(L.len, app.N);
    assert.equal(L.held.size, 0);
  }
});

test('layers do not share grid rows with each other', () => {
  const { app } = boot();
  app.setCell(app.layers[0], 3, 4, true);
  assert.equal(app.layers[0].grid[3][4], true);
  assert.equal(app.layers[1].grid[3][4], false);
  assert.equal(app.layers[2].grid[3][4], false);
});

test('setCell toggles the grid and keeps tap order in placed', () => {
  const { app } = boot();
  const L = app.layers[0];
  assert.equal(app.setCell(L, 2, 3, true), true);
  assert.equal(app.setCell(L, 5, 1, true), true);
  assert.equal(L.grid[2][3], true);
  assert.deepEqual(plain(L.placed.map((p) => [p.col, p.row])), [[2, 3], [5, 1]]);
});

test('setCell is a no-op when the cell already holds that value', () => {
  const { app } = boot();
  const L = app.layers[0];
  app.setCell(L, 2, 3, true);
  assert.equal(app.setCell(L, 2, 3, true), false, 'turning an ON cell on again changes nothing');
  assert.equal(L.placed.length, 1, 'and must not double-enter it in tap order');
  assert.equal(app.setCell(L, 9, 9, false), false, 'turning an OFF cell off again changes nothing');
});

test('turning a cell off removes exactly that entry from tap order', () => {
  const { app } = boot();
  const L = app.layers[0];
  app.setCell(L, 0, 0, true);
  app.setCell(L, 1, 1, true);
  app.setCell(L, 2, 2, true);
  app.setCell(L, 1, 1, false);
  assert.deepEqual(plain(L.placed.map((p) => [p.col, p.row])), [[0, 0], [2, 2]]);
  assert.equal(L.grid[1][1], false);
});

test('setCell stamps born on the way in and died on the way out', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  const t0 = h.now();
  app.setCell(L, 4, 4, true);
  assert.equal(L.born[4][4], t0);

  const t1 = h.advance(120);
  app.setCell(L, 4, 4, false);
  assert.equal(L.died[4][4], t1);
  assert.equal(L.born[4][4], t0, 'born is not disturbed by the removal');
});

test('placing a cell spawns its ripple immediately', () => {
  const { app } = boot();
  const before = app.ripples.length;
  app.setCell(app.layers[0], 6, 2, true);
  assert.equal(app.ripples.length, before + 1);
  const r = app.ripples.at(-1);
  assert.equal(r.col, 6);
  assert.equal(r.row, 2);
});

test('ripples default to the pitch-class colour of their row', () => {
  const { app } = boot();
  app.ripples.length = 0;
  app.spawnRipple(0, 15); // bottom row = scale degree 0
  assert.equal(app.ripples[0].ci, 0);
  app.spawnRipple(0, 14);
  assert.equal(app.ripples[1].ci, 1);
  app.spawnRipple(0, 10, 3); // explicit colour wins (Bounce passes column)
  assert.equal(app.ripples[2].ci, 3);
});

test('the ripple pool is capped — an all-day session cannot grow it without bound', () => {
  const { app } = boot();
  for (let i = 0; i < app.RIPPLE_MAX * 4; i++) app.spawnRipple(i % app.N, i % app.N);
  assert.equal(app.ripples.length, app.RIPPLE_MAX);
});

test('the ripple pool drops the oldest first', () => {
  const h = boot();
  const { app } = h;
  app.ripples.length = 0;
  for (let i = 0; i < app.RIPPLE_MAX; i++) { h.advance(1); app.spawnRipple(0, 0); }
  const oldest = app.ripples[0].born;
  h.advance(1);
  app.spawnRipple(1, 1);
  assert.equal(app.ripples.length, app.RIPPLE_MAX);
  assert.ok(app.ripples[0].born > oldest, 'the oldest ripple was evicted');
  assert.equal(app.ripples.at(-1).col, 1);
});

test('mirror off paints only the touched cell', () => {
  const { app } = boot();
  app.mirror = 'off';
  assert.deepEqual(plain(app.mirrorTargets(3, 4)), [[3, 4]]);
});

test('mirror lr adds the left-right partner', () => {
  const { app } = boot();
  app.mirror = 'lr';
  assert.deepEqual(plain(app.mirrorTargets(3, 4)), [[3, 4], [12, 4]]);
});

test('mirror kaleido adds all four quadrants', () => {
  const { app } = boot();
  app.mirror = 'kaleido';
  assert.deepEqual(plain(app.mirrorTargets(3, 4)), [[3, 4], [12, 4], [3, 11], [12, 11]]);
});

test('no cell is ever its own mirror, so a tap never cancels itself out', () => {
  const { app } = boot();
  app.mirror = 'kaleido';
  for (let col = 0; col < app.N; col++) {
    for (let row = 0; row < app.N; row++) {
      const t = app.mirrorTargets(col, row);
      const uniq = new Set(t.map(([c, r]) => `${c},${r}`));
      assert.equal(uniq.size, t.length, `mirror targets of ${col},${row} collided`);
    }
  }
});

test('paintCell gives a Draw-mode dot an expiry a few loops out', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  L.len = 8;
  app.paintCell(L, 1, 1);
  const p = L.placed.at(-1);
  assert.equal(p.exp, h.now() + app.DRAW_LOOPS * L.len * app.STEP_MS);
});

test('a shorter loop expires Draw dots sooner', () => {
  const h = boot();
  const { app } = h;
  const short = app.layers[0], long = app.layers[1];
  short.len = 4; long.len = 16;
  app.paintCell(short, 0, 0);
  app.paintCell(long, 0, 0);
  assert.ok(short.placed[0].exp < long.placed[0].exp);
});

test('clearGrid empties one layer and leaves the others alone', () => {
  const { app } = boot();
  const [a, b] = app.layers;
  app.setCell(a, 1, 1, true);
  app.setCell(a, 2, 2, true);
  app.setCell(b, 3, 3, true);

  app.clearGrid(a);
  assert.equal(countOn(a), 0);
  assert.equal(a.placed.length, 0);
  assert.equal(countOn(b), 1, 'the other layer keeps its pattern');
});

test('clearGrid resets the Random-mode light so it does not hop from a dead cell', () => {
  const { app } = boot();
  const L = app.layers[0];
  L.randFrom = { col: 1, row: 1 };
  L.randTo = { col: 2, row: 2 };
  app.clearGrid(L);
  assert.equal(L.randFrom, null);
  assert.equal(L.randTo, null);
});

test('clearGrid ripples every cell it wipes and persists the result', () => {
  const { app } = boot();
  const L = app.layers[0];
  app.setCell(L, 1, 1, true);
  app.setCell(L, 2, 2, true);
  app.ripples.length = 0;
  app.clearGrid(L);
  assert.equal(app.ripples.length, 2);
});

test('clearGrid defaults to the layer currently being edited', () => {
  const { app } = boot();
  app.li = 2;
  app.setCell(app.layers[2], 5, 5, true);
  app.setCell(app.layers[0], 5, 5, true);
  app.clearGrid();
  assert.equal(countOn(app.layers[2]), 0);
  assert.equal(countOn(app.layers[0]), 1);
});
