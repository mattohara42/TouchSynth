// The hidden grown-up panel. Every control here has to survive the "walk up and play" test
// by staying out of the way — but when a grown-up does reach for one, it must take effect
// immediately and be remembered.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, countOn } from './harness.js';

/** Set a control's value and fire the event the app listens for. */
const setControl = (h, id, value, type = 'input') => {
  const el = h.elements.get(id) || h.sandbox.document.getElementById(id);
  el.value = value;
  el.emit(type);
  return el;
};

test('the panel starts hidden — the instrument greets a kid, not a settings screen', () => {
  const h = boot();
  assert.notEqual(h.elements.get('panel').style.display, 'flex');
});

test('the tempo slider retunes the transport and the step clock together', () => {
  const h = boot();
  setControl(h, 'bpm', '150');
  assert.equal(h.transport.bpm.value, 150);
  assert.equal(h.app.STEP_MS, 60000 / 150 / 4);
  assert.equal(h.elements.get('bpmVal').textContent, '150');
});

test('each loop slider sets its own layer length and saves', () => {
  const h = boot();
  h.storage.clear();
  for (const i of [0, 1, 2]) {
    setControl(h, 'len-slider-' + i, '7');
    assert.equal(h.app.layers[i].len, 7);
    assert.equal(h.elements.get('len' + i + 'v').textContent, '7');
  }
  assert.equal(h.saved().layers[1].len, 7);
});

test('unequal loop lengths are what make the layers phase', () => {
  const h = boot();
  setControl(h, 'len-slider-0', '16');
  setControl(h, 'len-slider-1', '12');
  assert.notEqual(h.app.layers[0].len, h.app.layers[1].len);
});

test('the swing slider is a percentage on screen and a fraction in the engine', () => {
  const h = boot();
  setControl(h, 'swing', '40');
  assert.equal(h.transport.swing, 0.4);
  assert.equal(h.elements.get('swingVal').textContent, '40');
  assert.equal(h.transport.swingSubdivision, '16n');
  assert.equal(h.saved().swing, 0.4);
});

test('the scale selector reshapes the whole grid at once', () => {
  const h = boot();
  setControl(h, 'scaleSel', 'hirajoshi', 'change');
  assert.equal(h.app.scaleName, 'hirajoshi');
  assert.equal(h.app.SCALE[1], 'Db3');
  assert.equal(h.saved().scale, 'hirajoshi');
});

test('changing scale keeps the pattern — the same dots, a different mood', () => {
  const h = boot();
  h.app.setCell(h.app.layers[0], 3, 3, true);
  setControl(h, 'scaleSel', 'minor', 'change');
  assert.equal(countOn(h.app.layers[0]), 1);
});

test('the mirror selector takes effect on the next tap', () => {
  const h = boot();
  setControl(h, 'mirrorSel', 'lr', 'change');
  assert.equal(h.app.mirror, 'lr');
  assert.equal(h.saved().mirror, 'lr');
  setControl(h, 'mirrorSel', 'off', 'change');
  assert.equal(h.app.mirror, 'off');
});

test('the garden switch is remembered', () => {
  const h = boot();
  setControl(h, 'gardenSel', 'on', 'change');
  assert.equal(h.app.garden, true);
  assert.equal(h.saved().garden, true);
  setControl(h, 'gardenSel', 'off', 'change');
  assert.equal(h.app.garden, false);
  assert.equal(h.saved().garden, false);
});

test('the attract switch is remembered', () => {
  const h = boot();
  setControl(h, 'attractSel', 'on', 'change');
  assert.equal(h.app.attractOn, true);
  assert.equal(h.saved().attractOn, true);
});

test('switching attract off mid-ghost hands the grid back at once', () => {
  const h = boot();
  h.app.attractOn = true;
  h.app.started = true;
  h.advance(h.app.IDLE_MS + 1);
  h.intervalWithPeriod(1000).fn();
  assert.ok(h.app.attract, 'the ghost is playing');

  const ghostTimer = h.intervals.find((i) => i.ms === h.app.ATTRACT_TICK_MS && !i.cleared);
  ghostTimer.fn();
  assert.ok(countOn(h.app.layers[h.app.li]) > 0);

  setControl(h, 'attractSel', 'off', 'change');
  assert.equal(h.app.attract, null);
  assert.equal(ghostTimer.cleared, true);
  assert.equal(countOn(h.app.layers[h.app.li]), 0);
});

test('switching attract off when no ghost is playing is harmless', () => {
  const h = boot();
  setControl(h, 'attractSel', 'on', 'change');
  assert.doesNotThrow(() => setControl(h, 'attractSel', 'off', 'change'));
  assert.equal(h.app.attractOn, false);
});

test('clear all wipes every layer, unlike the ✕ button', () => {
  const h = boot();
  const { app } = h;
  app.layers.forEach((L, i) => app.setCell(L, i, i, true));
  h.elements.get('clearAll').emit('click');
  for (const L of app.layers) {
    assert.equal(countOn(L), 0);
    assert.equal(L.placed.length, 0);
  }
});

test('done closes the panel', () => {
  const h = boot();
  h.elements.get('panel').style.display = 'flex';
  h.elements.get('panelClose').emit('click');
  assert.equal(h.elements.get('panel').style.display, 'none');
});

test('every panel control the markup declares is wired to a listener', () => {
  const h = boot();
  for (const id of ['bpm', 'swing', 'scaleSel', 'mirrorSel', 'gardenSel', 'attractSel', 'clearAll', 'panelClose']) {
    const el = h.elements.get(id);
    assert.ok(el, `#${id} was never looked up`);
    assert.ok(el.listeners.size > 0, `#${id} has no handler`);
  }
  for (const i of [0, 1, 2]) {
    assert.ok(h.elements.get('len-slider-' + i).listeners.size > 0, `loop slider ${i} has no handler`);
  }
});

test('the panel round-trips: set everything, reboot, find it all again', () => {
  const first = boot();
  setControl(first, 'bpm', '132');
  setControl(first, 'swing', '25');
  setControl(first, 'scaleSel', 'minor', 'change');
  setControl(first, 'mirrorSel', 'kaleido', 'change');
  setControl(first, 'gardenSel', 'on', 'change');
  setControl(first, 'attractSel', 'on', 'change');
  setControl(first, 'len-slider-1', '9');
  first.app.save();

  const second = boot({ storage: Object.fromEntries(first.storage) });
  assert.equal(second.transport.bpm.value, 132);
  assert.equal(second.transport.swing, 0.25);
  assert.equal(second.app.scaleName, 'minor');
  assert.equal(second.app.mirror, 'kaleido');
  assert.equal(second.app.garden, true);
  assert.equal(second.app.attractOn, true);
  assert.equal(second.app.layers[1].len, 9);
});
