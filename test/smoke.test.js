// Guards on the harness itself. These tests exist so the suite cannot quietly stop
// testing the real thing — if index.html is restructured, this is what fails first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { boot, appSource, INDEX_HTML } from './harness.js';

test('the tests run the code that actually ships', () => {
  const html = readFileSync(INDEX_HTML, 'utf8');
  const src = appSource(html);
  assert.ok(src.length > 20_000, 'the extracted script looks too small to be the app');
  assert.ok(src.includes("'use strict'"), 'extracted the wrong block');
  assert.ok(html.includes(src), 'the extracted source is not verbatim from index.html');
});

test('index.html still loads Tone.js and still has no build step', () => {
  const html = readFileSync(INDEX_HTML, 'utf8');
  assert.ok(/<script src="[^"]*tone[^"]*"><\/script>/i.test(html), 'Tone.js is gone');
  assert.equal((html.match(/<script/g) || []).length, 2, 'expected exactly the Tone tag and one inline script');
  assert.ok(!/type="module"|import\s+.*from/.test(html), 'the app picked up a module graph');
});

test('the app boots clean: no thrown errors, no console warnings, no failed self-checks', () => {
  const h = boot();
  assert.deepEqual(h.warnings, []);
  assert.deepEqual(h.consoleAsserts, []);
});

test('booting twice gives two fully independent instruments', () => {
  const a = boot();
  const b = boot();
  a.app.setCell(a.app.layers[0], 5, 5, true);
  assert.equal(b.app.layers[0].grid[5][5], false, 'state leaked between sandboxes');
});

test('the audio engine is wired to the transport, not to the render loop', () => {
  const h = boot();
  assert.equal(h.transportRepeats.length, 1, 'one scheduled repeat drives the whole instrument');
  assert.equal(h.transportRepeats[0].interval, '16n');
});

test('nothing sounds until the transport ticks', () => {
  const h = boot();
  const { app } = h;
  app.setCell(app.layers[0], 0, 15, true);
  h.clearLog();
  for (let f = 0; f < 60; f++) { h.advance(16); app.draw(h.now()); }
  assert.deepEqual(h.notes(), [], 'the renderer is silent by construction');
  h.tick(0);
  assert.equal(h.notes().length, 1, 'the transport is what makes sound');
});

test('an hour of transport ticks leaves no unbounded arrays behind', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  for (let i = 0; i < 8; i++) app.setCell(L, i * 2, i, true);

  const STEPS = Math.round((60 * 60 * 1000) / app.STEP_MS); // one hour of 16ths
  for (let i = 0; i < STEPS; i++) {
    h.advance(app.STEP_MS);
    h.tick(0);
    if (i % 4 === 0) h.flushDraw(); // the panel's rAF is slower than the audio clock
  }
  h.flushDraw();

  assert.ok(app.ripples.length <= app.RIPPLE_MAX, `ripple pool grew to ${app.ripples.length}`);
  assert.equal(app.pointers.size, 0);
  assert.equal(L.placed.length, 8, 'the pattern is unchanged after an hour');
  assert.equal(h.drawQueue.length, 0, 'the draw queue drains');
});
