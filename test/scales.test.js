// The no-wrong-notes guarantee: every scale is pentatonic, spans C3–C6, and maps
// row 0 (top) to the highest note. If this breaks, the instrument stops being kid-safe.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './harness.js';

test('boots on major pentatonic spanning C3 to C6', () => {
  const { app } = boot();
  assert.equal(app.scaleName, 'major');
  assert.equal(app.SCALE.length, 16);
  assert.equal(app.SCALE[0], 'C3');
  assert.equal(app.SCALE[15], 'C6');
});

test("the app's own boot-time console.assert on scale mapping passes", () => {
  const h = boot();
  assert.deepEqual(h.consoleAsserts, []);
});

test('every scale is 5 notes wide and repeats by octave every 5 rows', () => {
  const { app } = boot();
  for (const name of Object.keys(app.SCALES)) {
    app.setScale(name);
    assert.equal(app.SCALES[name].length, 5, `${name} must be pentatonic`);
    assert.equal(app.SCALE.length, 16);
    for (let i = 0; i < 16; i++) {
      const degree = app.SCALES[name][i % 5];
      const octave = 3 + Math.floor(i / 5);
      assert.equal(app.SCALE[i], degree + octave, `${name}[${i}]`);
    }
  }
});

test('setScale swaps the active scale and remembers its name', () => {
  const { app } = boot();
  app.setScale('hirajoshi');
  assert.equal(app.scaleName, 'hirajoshi');
  assert.equal(app.SCALE[0], 'C3');
  assert.equal(app.SCALE[1], 'Db3');

  app.setScale('minor');
  assert.equal(app.scaleName, 'minor');
  assert.equal(app.SCALE[1], 'Eb3');
});

test('row 0 is the top of the grid and the highest pitch', () => {
  const { app } = boot();
  const N = app.N;
  // Score/Random pitch mapping is SCALE[N - 1 - row]
  assert.equal(app.SCALE[N - 1 - 0], 'C6', 'top row is the top of the range');
  assert.equal(app.SCALE[N - 1 - 15], 'C3', 'bottom row is the bottom of the range');
});
