// The walk-up-and-play test, exercised through real pointer events on the canvas:
// first tap unlocks audio, taps toggle cells, buttons hit where they are drawn, and
// no gesture can strand a note or a held finger.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, cellCenter, countOn } from './harness.js';

const started = (opts) => { const h = boot(opts); h.app.started = true; return h; };

test('the first tap anywhere unlocks audio and starts the clock', async () => {
  const h = boot();
  assert.equal(h.app.started, false);
  assert.equal(h.sandbox.Tone.__started, false);

  await h.tap(10, 10);
  assert.equal(h.sandbox.Tone.__started, true, 'Tone.start() ran on pointer UP, as iOS requires');
  assert.equal(h.app.started, true);
  assert.equal(h.transport.started, true);
  assert.equal(h.elements.get('hint').style.opacity, '0', 'the tap-anywhere hint fades');
});

test('a failed unlock leaves the app ready to retry on the next tap', async () => {
  const h = boot();
  h.sandbox.Tone.start = async () => { throw new Error('no user activation'); };
  await h.tap(10, 10);
  assert.equal(h.app.started, false, 'still unstarted, so the next tap tries again');
  assert.equal(h.warnings.length, 1);

  h.sandbox.Tone.start = async () => { h.sandbox.Tone.__started = true; };
  await h.tap(10, 10);
  assert.equal(h.app.started, true);
});

test('tapping a cell turns it on, tapping again turns it off', async () => {
  const h = started();
  const { app } = h;
  const p = cellCenter(app, 5, 9);
  await h.tap(p.x, p.y);
  assert.equal(app.layers[0].grid[5][9], true);
  await h.tap(p.x, p.y);
  assert.equal(app.layers[0].grid[5][9], false);
});

test('every cell in the grid is reachable by tapping its centre', async () => {
  const h = started();
  const { app } = h;
  for (let col = 0; col < app.N; col++) {
    for (let row = 0; row < app.N; row++) {
      const p = cellCenter(app, col, row);
      await h.tap(p.x, p.y);
    }
  }
  assert.equal(countOn(app.layers[0]), app.N * app.N, 'no dead cells');
});

test('a tap outside the grid changes nothing', async () => {
  const h = started();
  const { app } = h;
  await h.tap(app.ox - 20, app.oy + 5);   // left of the grid
  await h.tap(app.ox + 5, app.oy - 20);   // above it
  assert.equal(countOn(app.layers[0]), 0);
});

test('a tap edits the layer you are on, and only that one', async () => {
  const h = started();
  const { app } = h;
  app.li = 1;
  const p = cellCenter(app, 2, 2);
  await h.tap(p.x, p.y);
  assert.equal(app.layers[1].grid[2][2], true);
  assert.equal(app.layers[0].grid[2][2], false);
  assert.equal(app.layers[2].grid[2][2], false);
});

test('a tap persists straight away — a kiosk can be unplugged at any moment', async () => {
  const h = started();
  h.storage.clear();
  const p = cellCenter(h.app, 1, 1);
  await h.tap(p.x, p.y);
  assert.ok(h.saved(), 'the pattern was written before the finger left the glass');
});

test('mirror painting echoes a tap across the grid', async () => {
  const h = started();
  const { app } = h;
  app.mirror = 'kaleido';
  const p = cellCenter(app, 3, 4);
  await h.tap(p.x, p.y);
  assert.equal(countOn(app.layers[0]), 4);
  for (const [c, r] of [[3, 4], [12, 4], [3, 11], [12, 11]]) {
    assert.equal(app.layers[0].grid[c][r], true, `mirror ${c},${r}`);
  }
});

test('the mode buttons switch the mode of the layer being edited', async () => {
  const h = started();
  const { app } = h;
  app.li = 2;
  for (const b of app.modeButtons()) {
    await h.tap(b.x, b.y);
    assert.equal(app.layers[2].mode, b.m, `tapping ${b.m}`);
    assert.equal(app.layers[0].mode, 'score', 'other layers keep their own mode');
  }
});

test('leaving Push mode never leaves a drone hanging', async () => {
  const h = started();
  const { app } = h;
  const push = app.modeButtons().find((b) => b.m === 'push');
  const score = app.modeButtons().find((b) => b.m === 'score');
  await h.tap(push.x, push.y);

  const p = cellCenter(app, 4, 4);
  h.press(p.x, p.y, 7); // a finger is still down on a held cell
  assert.equal(app.layers[0].held.size, 1);

  await h.tap(score.x, score.y); // mode changes out from under it
  assert.equal(app.layers[0].held.size, 0, 'the held note was released with the mode');
  await h.release(7);
});

test('switching mode clears the Random light so it does not hop from a dead cell', async () => {
  const h = started();
  const { app } = h;
  app.layers[0].randFrom = { col: 1, row: 1 };
  app.layers[0].randTo = { col: 2, row: 2 };
  const b = app.modeButtons().find((m) => m.m === 'bounce');
  await h.tap(b.x, b.y);
  assert.equal(app.layers[0].randFrom, null);
  assert.equal(app.layers[0].randTo, null);
});

test('a mode change is remembered across a reboot', async () => {
  const h = started();
  const { app } = h;
  const b = app.modeButtons().find((m) => m.m === 'bounce');
  h.storage.clear();
  await h.tap(b.x, b.y);
  assert.equal(h.saved().layers[0].mode, 'bounce', 'the mode change was persisted');

  const second = boot({ storage: Object.fromEntries(h.storage) });
  assert.equal(second.app.layers[0].mode, 'bounce');
});

test('the layer you were last editing is remembered across a reboot', async () => {
  const h = started();
  h.storage.clear();
  await h.tap(h.app.layerButtons()[2].x, h.app.layerButtons()[2].y);
  assert.equal(h.saved().li, 2);
  assert.equal(boot({ storage: Object.fromEntries(h.storage) }).app.li, 2);
});

test('the dice buttons switch which layer you edit', async () => {
  const h = started();
  const { app } = h;
  for (const b of app.layerButtons()) {
    await h.tap(b.x, b.y);
    assert.equal(app.li, b.i);
  }
});

test('switching layer re-inflates the incoming pattern rather than snapping it on', async () => {
  const h = started();
  const { app } = h;
  app.setCell(app.layers[1], 6, 6, true);
  const t = h.advance(5000);
  await h.tap(app.layerButtons()[1].x, app.layerButtons()[1].y);
  assert.equal(app.layers[1].born[6][6], t);
});

test('the gear opens the grown-up panel, and tapping it again puts it away', async () => {
  const h = started();
  const g = h.app.gearButton();
  await h.tap(g.x, g.y);
  assert.equal(h.elements.get('panel').style.display, 'flex');
  await h.tap(g.x, g.y);
  assert.equal(h.elements.get('panel').style.display, 'none');
});

test('opening the panel does not also toggle the cell underneath', async () => {
  const h = started();
  const { app } = h;
  const g = app.gearButton();
  await h.tap(g.x, g.y);
  assert.equal(countOn(app.layers[0]), 0);
});

test('play/pause stops and restarts the transport', async () => {
  const h = started();
  const t = h.app.transportButton();
  assert.equal(h.app.playing, true);

  await h.tap(t.x, t.y);
  assert.equal(h.app.playing, false);
  assert.equal(h.transport.paused, true);

  await h.tap(t.x, t.y);
  assert.equal(h.app.playing, true);
  assert.equal(h.transport.paused, false);
});

test('pausing before the first tap holds the clock off when audio unlocks', async () => {
  const h = boot(); // deliberately not started
  const t = h.app.transportButton();
  h.press(t.x, t.y);
  await h.release();
  assert.equal(h.app.playing, false);
  assert.equal(h.transport.started, false, 'unlocking audio does not override the paused button');
});

test('the clear button needs a real hold, so a stray tap cannot wipe a pattern', async () => {
  const h = started();
  const { app } = h;
  app.setCell(app.layers[0], 1, 1, true);
  const c = app.clearButton();

  h.press(c.x, c.y);
  assert.ok(app.clearHoldStart !== null, 'the hold started');
  await h.release();
  assert.equal(countOn(app.layers[0]), 1, 'a quick tap leaves the pattern alone');
  assert.equal(app.clearHoldStart, null, 'and the hold is cancelled on release');
});

test('a tap on a button never falls through to the grid', async () => {
  const h = started();
  const { app } = h;
  const hits = [app.gearButton(), app.transportButton(), app.clearButton(), ...app.modeButtons(), ...app.layerButtons()];
  for (const b of hits) {
    await h.tap(b.x, b.y);
  }
  assert.equal(countOn(app.layers[app.li]), 0, 'no button tap painted a cell');
});

test('Draw mode paints a trail as the finger moves', async () => {
  const h = started();
  const { app } = h;
  app.layers[0].mode = 'draw';
  h.press(cellCenter(app, 0, 8).x, cellCenter(app, 0, 8).y);
  for (let col = 1; col < 6; col++) {
    const p = cellCenter(app, col, 8);
    h.move(p.x, p.y);
  }
  await h.release();
  assert.equal(countOn(app.layers[0]), 6);
  for (const p of app.layers[0].placed) assert.ok(p.exp, 'every painted dot carries an expiry');
});

test('Draw ignores the part of a drag that leaves the grid', async () => {
  const h = started();
  const { app } = h;
  app.layers[0].mode = 'draw';
  const p = cellCenter(app, 2, 2);
  h.press(p.x, p.y);
  h.move(-500, -500);
  await h.release();
  assert.equal(countOn(app.layers[0]), 1);
});

test('Solo glissandos: sliding across cells sounds each new one exactly once', async () => {
  const h = started();
  const { app } = h;
  app.layers[0].mode = 'solo';
  const start = cellCenter(app, 0, 8);
  h.clearLog();
  h.press(start.x, start.y);
  for (const col of [1, 1, 2, 2, 3]) { // repeats within a cell must not re-trigger
    const p = cellCenter(app, col, 8);
    h.move(p.x, p.y);
  }
  await h.release();
  assert.equal(h.notes().length, 4, 'one note per new cell entered');
  assert.equal(countOn(app.layers[0]), 0, 'Solo never writes to the grid');
});

test('Push holds a note under the finger and follows it as it drags', async () => {
  const h = started();
  const { app } = h;
  app.layers[0].mode = 'push';
  const a = cellCenter(app, 2, 15), b = cellCenter(app, 9, 14);
  h.clearLog();
  h.press(a.x, a.y);
  assert.equal(app.layers[0].held.size, 1);
  h.move(b.x, b.y);
  assert.equal(app.layers[0].held.get(1).row, 14);
  await h.release();
  assert.equal(app.layers[0].held.size, 0);

  const kinds = h.notes().map((n) => n.kind);
  assert.equal(kinds.filter((k) => k === 'attack').length, kinds.filter((k) => k === 'release').length);
});

test('a cancelled pointer releases its note — a palm on the panel cannot leave a drone', async () => {
  const h = started();
  const { app } = h;
  app.layers[0].mode = 'push';
  const p = cellCenter(app, 3, 3);
  h.press(p.x, p.y, 4);
  assert.equal(app.layers[0].held.size, 1);

  await h.emitWindow('pointercancel', { pointerId: 4 });
  assert.equal(app.layers[0].held.size, 0);
  assert.equal(app.pointers.has(4), false);
  assert.equal(app.clearHoldStart, null);
});

test('two kids on one panel keep their own fingers straight', async () => {
  const h = started();
  const { app } = h;
  const a = cellCenter(app, 2, 2), b = cellCenter(app, 12, 12);
  h.press(a.x, a.y, 1);
  h.press(b.x, b.y, 2);
  assert.equal(app.pointers.size, 2);
  await h.release(1);
  assert.equal(app.pointers.size, 1);
  assert.equal(app.pointers.has(2), true);
  await h.release(2);
  assert.equal(app.pointers.size, 0);
});

test('a long play session leaks no pointers', async () => {
  const h = started();
  const { app } = h;
  for (const mode of ['score', 'draw', 'solo', 'push']) {
    app.layers[0].mode = mode;
    for (let i = 0; i < 60; i++) {
      const id = i % 3;
      const p = cellCenter(app, i % app.N, (i * 5) % app.N);
      h.advance(20);
      h.press(p.x, p.y, id);
      h.move(p.x + 10, p.y + 10, id);
      await h.release(id);
    }
  }
  assert.equal(app.pointers.size, 0, 'no finger left tracked');
  assert.equal(app.layers[0].held.size, 0, 'no note left sounding');
});

test('any touch counts as activity, so the ghost keeps its distance', async () => {
  const h = started();
  h.advance(60_000);
  const before = h.app.lastTouch;
  await h.tap(h.app.gearButton().x, h.app.gearButton().y);
  assert.ok(h.app.lastTouch > before, 'even a button tap resets the idle timer');
});
