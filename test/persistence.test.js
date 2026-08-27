// A kiosk gets rebooted; a kid's pattern survives it. The load path treats localStorage as
// a trust boundary, so these tests feed it garbage as well as good data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, countOn, plain } from './harness.js';

const KEY = 'gridSings.v1';
const withSave = (d) => ({ [KEY]: JSON.stringify(d) });

test('save writes the whole grown-up configuration plus every layer', () => {
  const h = boot();
  const { app } = h;
  app.setCell(app.layers[0], 2, 3, true);
  app.layers[1].mode = 'bounce';
  app.layers[1].len = 8;
  app.li = 1;
  app.mirror = 'kaleido';
  app.garden = true;
  app.attractOn = true;
  h.transport.bpm.value = 140;
  h.transport.swing = 0.25;
  app.setScale('minor');
  app.save();

  const d = h.saved();
  assert.equal(d.bpm, 140);
  assert.equal(d.swing, 0.25);
  assert.equal(d.scale, 'minor');
  assert.equal(d.mirror, 'kaleido');
  assert.equal(d.garden, true);
  assert.equal(d.attractOn, true);
  assert.equal(d.li, 1);
  assert.equal(d.layers.length, 3);
  assert.deepEqual(plain(d.layers[0].placed.map((p) => [p.col, p.row])), [[2, 3]]);
  assert.equal(d.layers[1].mode, 'bounce');
  assert.equal(d.layers[1].len, 8);
});

test('save does not persist held notes — a drone must never come back after a reboot', () => {
  const h = boot();
  const { app } = h;
  app.pushDown(1, app.layers[0], 3, 15);
  app.save();
  const d = h.saved();
  assert.equal('held' in d.layers[0], false);
  assert.equal(JSON.stringify(d).includes('held'), false);
});

test('a full pattern survives a reboot', () => {
  const first = boot();
  const { app } = first;
  app.setCell(app.layers[0], 1, 2, true);
  app.setCell(app.layers[0], 5, 9, true);
  app.setCell(app.layers[2], 15, 0, true);
  app.layers[0].mode = 'random';
  app.layers[2].len = 6;
  app.li = 2;
  app.mirror = 'lr';
  app.setScale('hirajoshi');
  first.transport.bpm.value = 96;
  app.save();

  const second = boot({ storage: Object.fromEntries(first.storage) });
  const b = second.app;
  assert.equal(b.layers[0].grid[1][2], true);
  assert.equal(b.layers[0].grid[5][9], true);
  assert.equal(b.layers[2].grid[15][0], true);
  assert.equal(b.layers[0].mode, 'random');
  assert.equal(b.layers[2].len, 6);
  assert.equal(b.li, 2);
  assert.equal(b.mirror, 'lr');
  assert.equal(b.scaleName, 'hirajoshi');
  assert.equal(second.transport.bpm.value, 96);
});

test('tap order survives a reboot, so Random still plays the kid sequence', () => {
  const first = boot();
  first.app.setCell(first.app.layers[0], 9, 9, true);
  first.app.setCell(first.app.layers[0], 1, 1, true);
  first.app.setCell(first.app.layers[0], 5, 5, true);
  first.app.save();

  const second = boot({ storage: Object.fromEntries(first.storage) });
  assert.deepEqual(
    plain(second.app.layers[0].placed.map((p) => [p.col, p.row])),
    [[9, 9], [1, 1], [5, 5]],
  );
});

test('an empty store boots to defaults', () => {
  const h = boot();
  assert.equal(h.app.li, 0);
  assert.equal(h.app.mirror, 'off');
  assert.equal(h.app.garden, false);
  assert.equal(h.app.attractOn, false);
  assert.equal(h.app.scaleName, 'major');
  for (const L of h.app.layers) assert.equal(countOn(L), 0);
});

test('malformed JSON is swallowed and the app still boots', () => {
  const h = boot({ storage: { [KEY]: '{ not json at all' } });
  assert.equal(h.app.layers[0].mode, 'score');
  assert.equal(h.transport.bpm.value, 110);
});

test('a stored null boots to defaults', () => {
  const h = boot({ storage: { [KEY]: 'null' } });
  assert.equal(h.app.layers[0].mode, 'score');
});

test('layers that is not an array is ignored', () => {
  const h = boot({ storage: withSave({ layers: 'nope' }) });
  for (const L of h.app.layers) assert.equal(countOn(L), 0);
});

test('extra layers beyond the three are dropped', () => {
  const h = boot({
    storage: withSave({ layers: [{ mode: 'bounce' }, { mode: 'random' }, { mode: 'draw' }, { mode: 'solo' }] }),
  });
  assert.deepEqual(plain(h.app.layers.map((L) => L.mode)), ['bounce', 'random', 'draw']);
});

test('an unknown mode name falls back to Score', () => {
  const h = boot({ storage: withSave({ layers: [{ mode: 'jazzhands' }] }) });
  assert.equal(h.app.layers[0].mode, 'score');
});

test('loop length is clamped to the slider range and rounded', () => {
  const cases = [[0, 16], [1, 4], [3, 4], [4, 4], [7.6, 8], [16, 16], [99, 16], ['12', 12], [null, 16]];
  for (const [stored, want] of cases) {
    const h = boot({ storage: withSave({ layers: [{ mode: 'score', len: stored }] }) });
    assert.equal(h.app.layers[0].len, want, `len ${JSON.stringify(stored)}`);
  }
});

test('out-of-bounds and non-integer cells are dropped, valid neighbours kept', () => {
  const h = boot({
    storage: withSave({
      layers: [{
        mode: 'score',
        placed: [
          { col: 3, row: 4 },       // good
          { col: -1, row: 0 },      // off the left
          { col: 16, row: 0 },      // off the right
          { col: 0, row: -1 },      // above
          { col: 0, row: 16 },      // below
          { col: 1.5, row: 2 },     // not integers
          { col: '2', row: '2' },   // strings
          { col: NaN, row: 0 },
          { col: 7, row: 8 },       // good
        ],
      }],
    }),
  });
  const L = h.app.layers[0];
  assert.equal(countOn(L), 2);
  assert.equal(L.grid[3][4], true);
  assert.equal(L.grid[7][8], true);
});

test('a duplicated cell is stored once', () => {
  const h = boot({
    storage: withSave({ layers: [{ mode: 'score', placed: [{ col: 1, row: 1 }, { col: 1, row: 1 }] }] }),
  });
  assert.equal(h.app.layers[0].placed.length, 1);
});

test('restored cells inflate in rather than snapping on', () => {
  const h = boot({ now: 5000, storage: withSave({ layers: [{ mode: 'score', placed: [{ col: 2, row: 2 }] }] }) });
  assert.equal(h.app.layers[0].born[2][2], 5000);
});

test('tempo is clamped to the slider range', () => {
  for (const [stored, want] of [[59, 60], [60, 60], [120, 120], [180, 180], [181, 180], [0, 110], ['abc', 110], [-500, 60]]) {
    const h = boot({ storage: withSave({ bpm: stored }) });
    assert.equal(h.transport.bpm.value, want, `bpm ${JSON.stringify(stored)}`);
  }
});

test('tempo and the step clock stay in step with each other', () => {
  const h = boot({ storage: withSave({ bpm: 120 }) });
  assert.equal(h.transport.bpm.value, 120);
  assert.equal(h.app.STEP_MS, 60000 / 120 / 4);
});

test('swing is clamped to 0-50%', () => {
  for (const [stored, want] of [[0, 0], [0.25, 0.25], [0.5, 0.5], [0.9, 0.5], [-1, 0], ['x', 0]]) {
    const h = boot({ storage: withSave({ swing: stored }) });
    assert.equal(h.transport.swing, want, `swing ${JSON.stringify(stored)}`);
  }
});

test('an unknown scale is ignored and the default stands', () => {
  assert.equal(boot({ storage: withSave({ scale: 'lydian' }) }).app.scaleName, 'major');
  assert.equal(boot({ storage: withSave({ scale: 'minor' }) }).app.scaleName, 'minor');
});

test('mirror only accepts the three real settings', () => {
  for (const [stored, want] of [['off', 'off'], ['lr', 'lr'], ['kaleido', 'kaleido'], ['sideways', 'off'], [7, 'off']]) {
    assert.equal(boot({ storage: withSave({ mirror: stored }) }).app.mirror, want, `mirror ${stored}`);
  }
});

test('garden and attract need an exact true — anything else means off', () => {
  for (const junk of ['on', 1, 'true', {}, null]) {
    const h = boot({ storage: withSave({ garden: junk, attractOn: junk }) });
    assert.equal(h.app.garden, false, `garden ${JSON.stringify(junk)}`);
    assert.equal(h.app.attractOn, false, `attract ${JSON.stringify(junk)}`);
  }
  const on = boot({ storage: withSave({ garden: true, attractOn: true }) });
  assert.equal(on.app.garden, true);
  assert.equal(on.app.attractOn, true);
});

test('the edited-layer index is bounds-checked', () => {
  for (const [stored, want] of [[0, 0], [2, 2], [3, 0], [-1, 0], [1.5, 0], ['1', 0]]) {
    assert.equal(boot({ storage: withSave({ li: stored }) }).app.li, want, `li ${JSON.stringify(stored)}`);
  }
});

test('the panel sliders come back showing the loaded values', () => {
  const h = boot({ storage: withSave({ bpm: 140, swing: 0.3, layers: [{ mode: 'score', len: 8 }] }) });
  assert.equal(h.elements.get('bpm').value, 140);
  assert.equal(h.elements.get('bpmVal').textContent, 140);
  assert.equal(h.elements.get('swing').value, 30);
  assert.equal(h.elements.get('swingVal').textContent, 30);
  assert.equal(h.elements.get('len-slider-0').value, 8);
  assert.equal(h.elements.get('len0v').textContent, 8);
});

test('play/pause is deliberately not persisted — a rebooted kiosk comes back playing', () => {
  const h = boot();
  h.app.playing = false;
  h.app.save();
  assert.equal('playing' in h.saved(), false);
  assert.equal(boot({ storage: Object.fromEntries(h.storage) }).app.playing, true);
});

// --- The trust boundary against entries that are not layers at all ---

test('a null entry in layers does not stop the app booting', () => {
  const h = boot({ storage: withSave({ layers: [null] }) });
  assert.equal(h.app.layers[0].mode, 'score');
  assert.equal(countOn(h.app.layers[0]), 0);
});

test('junk in place of a layer skips that layer and leaves the rest intact', () => {
  const h = boot({
    storage: withSave({
      layers: [null, 'nonsense', { mode: 'bounce', placed: [{ col: 4, row: 4 }] }],
    }),
  });
  assert.equal(h.app.layers[0].mode, 'score', 'the null entry fell through to defaults');
  assert.equal(h.app.layers[1].mode, 'score', 'so did the string');
  assert.equal(h.app.layers[2].mode, 'bounce', 'and the good layer still loaded');
  assert.equal(h.app.layers[2].grid[4][4], true);
});

test('every shape of junk entry is survivable', () => {
  for (const junk of [null, undefined, 'a string', 42, true, []]) {
    const h = boot({ storage: withSave({ layers: [junk], bpm: 130 }) });
    assert.equal(h.app.layers[0].mode, 'score', `layers: [${JSON.stringify(junk)}]`);
    assert.equal(h.transport.bpm.value, 130, 'and the rest of the settings still load');
  }
});

test('an inherited Object.prototype key does not pass as a mode name', () => {
  for (const key of ['toString', 'constructor', 'valueOf', 'hasOwnProperty', '__proto__']) {
    const h = boot({ storage: withSave({ layers: [{ mode: key }] }) });
    assert.equal(h.app.layers[0].mode, 'score', `mode "${key}" must not be accepted`);
  }
});

test('a layer loaded from storage is always in a mode that can actually sound', () => {
  const h = boot({
    storage: withSave({ layers: [{ mode: 'toString', placed: [{ col: 0, row: 15 }] }] }),
  });
  const L = h.app.layers[0];
  assert.ok(Object.hasOwn(h.app.MODES, L.mode), 'the mode is a real strategy');
  h.clearLog();
  h.tick(0);
  assert.equal(h.notes().length, 1, 'and the restored pattern is audible, not a silently dead layer');
});
