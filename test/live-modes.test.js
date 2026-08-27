// Push and Solo are finger-driven. Push holds notes open on a shared pad voice, so the
// invariant that matters on a panel running unattended for hours is: every attack gets a
// release. A stuck drone is the one failure a kid cannot undo by walking away.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './harness.js';

const pad = (h) => h.notes().filter((n) => n.voice === h.app.padVoice.name);
// Pad activity since a marker, so a test can assert on one gesture in isolation.
const padSince = (h, mark) => h.voiceLog.slice(mark).filter((n) => n.voice === h.app.padVoice.name);
// Notes left sounding across the WHOLE session. Must always come back empty.
const balance = (h) => {
  const open = new Map();
  for (const n of pad(h)) {
    if (n.kind === 'attack') open.set(n.note, (open.get(n.note) || 0) + 1);
    if (n.kind === 'release') open.set(n.note, (open.get(n.note) || 0) - 1);
  }
  return [...open].filter(([, c]) => c !== 0);
};

test('pushDown sustains the row note and records the hold', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  h.clearLog();
  app.pushDown(1, L, 3, 15);
  assert.deepEqual(pad(h).map((n) => [n.kind, n.note]), [['attack', 'C3']]);
  assert.equal(L.held.get(1).note, 'C3');
  assert.deepEqual({ col: L.held.get(1).col, row: L.held.get(1).row }, { col: 3, row: 15 });
});

test('Push ignores the column — a whole row is one fat target', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  h.clearLog();
  app.pushDown(1, L, 0, 10);
  app.pushDown(2, L, 15, 10);
  const notes = pad(h).filter((n) => n.kind === 'attack').map((n) => n.note);
  assert.deepEqual(notes, [notes[0], notes[0]], 'both ends of the row give the same pitch');
});

test('pushUp releases the held note and forgets the finger', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.pushDown(1, L, 3, 15);
  h.clearLog();
  app.pushUp(1);
  assert.deepEqual(pad(h).map((n) => [n.kind, n.note]), [['release', 'C3']]);
  assert.equal(L.held.size, 0);
});

test('pushUp for a finger that was never down is harmless', () => {
  const h = boot();
  h.clearLog();
  h.app.pushUp(99);
  assert.deepEqual(pad(h), []);
});

test('dragging swaps the note: old one released, new one attacked', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.pushDown(1, L, 3, 15); // C3
  const mark = h.voiceLog.length;
  app.pushMove(1, L, 4, 14); // D3
  assert.deepEqual(padSince(h, mark).map((n) => [n.kind, n.note]), [['release', 'C3'], ['attack', 'D3']]);
  assert.equal(L.held.get(1).note, 'D3');
  app.pushUp(1);
  assert.deepEqual(balance(h), [], 'no note left hanging after the drag');
});

test('sliding within the same cell re-triggers nothing', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.pushDown(1, L, 3, 15);
  h.clearLog();
  app.pushMove(1, L, 3, 15);
  assert.deepEqual(pad(h), [], 'still on the same cell — nothing to do');
});

test('pushMove for an untracked finger does nothing', () => {
  const h = boot();
  const { app } = h;
  h.clearLog();
  app.pushMove(42, app.layers[0], 1, 1);
  assert.deepEqual(pad(h), []);
});

test('several fingers stack into a held chord and all release cleanly', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  h.clearLog();
  app.pushDown(1, L, 0, 15);
  app.pushDown(2, L, 0, 14);
  app.pushDown(3, L, 0, 13);
  assert.equal(L.held.size, 3);
  assert.equal(pad(h).filter((n) => n.kind === 'attack').length, 3);

  app.pushUp(1); app.pushUp(2); app.pushUp(3);
  assert.equal(L.held.size, 0);
  assert.deepEqual(balance(h), [], 'chord fully released');
});

test('a held note survives a layer switch — pushUp scans every layer', () => {
  const h = boot();
  const { app } = h;
  app.li = 0;
  app.pushDown(1, app.layers[0], 3, 15);
  app.li = 2; // the kid hits a different dice button mid-hold
  h.clearLog();
  app.pushUp(1);
  assert.deepEqual(pad(h).map((n) => n.kind), ['release']);
  assert.equal(app.layers[0].held.size, 0, 'released from the layer that actually held it');
});

test('releaseAllHeld drops every drone when a mode changes under a finger', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.pushDown(1, L, 0, 15);
  app.pushDown(2, L, 0, 10);
  const mark = h.voiceLog.length;
  app.releaseAllHeld(L);
  assert.equal(L.held.size, 0);
  assert.equal(padSince(h, mark).filter((n) => n.kind === 'release').length, 2);
  assert.deepEqual(balance(h), []);
});

test('a long two-kid session leaves no note sounding', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  h.clearLog();
  for (let i = 0; i < 200; i++) {
    const id = i % 4; // four fingers on the panel
    h.advance(30);
    app.pushDown(id, L, i % app.N, (i * 7) % app.N);
    app.pushMove(id, L, (i + 3) % app.N, (i * 5) % app.N);
    app.pushUp(id);
  }
  assert.equal(L.held.size, 0);
  assert.deepEqual(balance(h), [], 'every attack across the whole session was released');
});

test('Push stamps the anim clocks so the held cell inflates and jiggles out', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  const t0 = h.now();
  app.pushDown(1, L, 3, 15);
  assert.equal(L.born[3][15], t0);

  const t1 = h.advance(100);
  app.pushMove(1, L, 4, 15);
  assert.equal(L.died[3][15], t1, 'the cell the finger left jiggles out');
  assert.equal(L.born[4][15], t1, 'the cell it arrived on inflates in');

  const t2 = h.advance(100);
  app.pushUp(1);
  assert.equal(L.died[4][15], t2);
});

test('Push never writes to the grid — held cells are transient, not a pattern', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.pushDown(1, L, 3, 15);
  app.pushMove(1, L, 4, 14);
  assert.equal(L.grid[3][15], false);
  assert.equal(L.grid[4][14], false);
  assert.equal(L.placed.length, 0);
  app.pushUp(1);
});

test('Solo plucks the layer voice once, and leaves nothing held', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  h.clearLog();
  app.playSolo(L, 7, 15);
  assert.deepEqual(h.notes().map((n) => [n.kind, n.note, n.dur]), [['attackRelease', 'C3', '8n']]);
  assert.equal(L.held.size, 0);
});

test('Solo pitch is row-mapped, column ignored', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  h.clearLog();
  app.playSolo(L, 0, 5);
  app.playSolo(L, 15, 5);
  const notes = h.notes().map((n) => n.note);
  assert.equal(notes[0], notes[1]);
  assert.equal(notes[0], app.SCALE[app.N - 1 - 5]);
});

test('Solo uses the edited layer own voice, not the shared pad', () => {
  const h = boot();
  const { app } = h;
  h.clearLog();
  app.playSolo(app.layers[1], 0, 0);
  assert.equal(h.notes()[0].voice, app.layers[1].voice.name);
  assert.notEqual(h.notes()[0].voice, app.padVoice.name);
});

test('live modes give visual feedback on every touch', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.ripples.length = 0;
  app.pushDown(1, L, 2, 2);
  app.pushMove(1, L, 3, 3);
  app.playSolo(L, 4, 4);
  app.pushUp(1);
  assert.equal(app.ripples.length, 3);
});
