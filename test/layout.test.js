// Seam 3: the renderer reads state and decides nothing. These tests cover the layout maths
// that keeps controls big enough for small fingers and clear of the grid on every target
// from a phone to the 21.5" wall panel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './harness.js';

// A representative sweep: wall panel, desktop, tablet, phone, and awkward shapes.
const SCREENS = [
  ['wall panel landscape', 1920, 1080],
  ['wall panel portrait', 1080, 1920],
  ['desktop', 1440, 900],
  ['small laptop', 1280, 800],
  ['tablet landscape', 1024, 768],
  ['tablet portrait', 768, 1024],
  ['phone', 390, 844],
  ['phone landscape', 844, 390],
  ['near square', 700, 700],
];

test('the grid is square, centred, and never sits under the control strip', () => {
  for (const [name, w, h] of SCREENS) {
    const { app } = boot({ width: w, height: h });
    const size = app.cell * app.N;
    assert.ok(size > 0, `${name}: grid has size`);
    assert.ok(app.ox >= 0 && app.oy >= 0, `${name}: grid origin is on screen`);
    assert.ok(app.ox + size <= w + 0.01, `${name}: grid fits horizontally`);
    assert.ok(app.oy + size <= h - app.bar + 0.01, `${name}: grid stops above the control strip`);
    assert.ok(Math.abs(app.ox - (w - size) / 2) < 0.01, `${name}: centred horizontally`);
  }
});

test('screens narrower than 852px stack the control strip into two rows', () => {
  assert.equal(boot({ width: 851, height: 800 }).app.twoRow, true);
  assert.equal(boot({ width: 852, height: 800 }).app.twoRow, false);
});

test('852 is exactly where one row can still hold a 44px target', () => {
  // The threshold is not a round number picked by feel — it is where btnR's no-overlap
  // cap, (innerWidth/2 - 96)/15, first reaches r = 22. Below it, one row would shrink
  // buttons under a fingertip; at and above it, one row fits.
  const oneRow = boot({ width: 852, height: 800 }).app;
  assert.equal(oneRow.twoRow, false);
  assert.ok(oneRow.btnR() * 2 >= 44, 'the first one-row width already clears 44px');

  const justUnder = boot({ width: 851, height: 800 }).app;
  assert.equal(justUnder.twoRow, true, 'one pixel narrower has to stack');
  assert.ok(justUnder.btnR() * 2 >= 44);
});

test('the two-row strip is taller, so stacked buttons still get room', () => {
  const narrow = boot({ width: 500, height: 900 }).app;
  const wide = boot({ width: 900, height: 900 }).app;
  assert.ok(narrow.bar > wide.bar);
});

test('mode buttons never collide with the layer dice', () => {
  for (let w = 320; w <= 2560; w += 17) {
    const { app } = boot({ width: w, height: 900 });
    const modes = app.modeButtons();
    const dice = app.layerButtons();
    for (const m of modes) {
      for (const d of dice) {
        if (Math.abs(m.y - d.y) > 1) continue; // different rows cannot collide
        const gap = Math.hypot(m.x - d.x, m.y - d.y) - (m.r + d.r);
        assert.ok(gap >= 0, `width ${w}: mode ${m.m} overlaps layer ${d.i} by ${-gap.toFixed(2)}`);
      }
    }
  }
});

test('no two controls in the strip ever overlap', () => {
  for (const [name, w, h] of SCREENS) {
    const { app } = boot({ width: w, height: h });
    const all = [
      ...app.modeButtons().map((b) => ({ ...b, id: 'mode:' + b.m })),
      ...app.layerButtons().map((b) => ({ ...b, id: 'layer:' + b.i })),
      { ...app.transportButton(), id: 'transport' },
      { ...app.clearButton(), id: 'clear' },
    ];
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j];
        const gap = Math.hypot(a.x - b.x, a.y - b.y) - (a.r + b.r);
        assert.ok(gap >= -0.01, `${name}: ${a.id} overlaps ${b.id}`);
      }
    }
  }
});

test('every strip control stays fully on screen', () => {
  for (const [name, w, h] of SCREENS) {
    const { app } = boot({ width: w, height: h });
    const all = [...app.modeButtons(), ...app.layerButtons(), app.transportButton(), app.clearButton()];
    for (const b of all) {
      assert.ok(b.x - b.r >= 0, `${name}: control runs off the left`);
      assert.ok(b.x + b.r <= w, `${name}: control runs off the right`);
      assert.ok(b.y + b.r <= h + 0.01, `${name}: control runs off the bottom`);
    }
  }
});

test('touch targets stay finger-sized on every screen', () => {
  const MIN_DIAMETER = 44; // the usual accessibility floor, in CSS px
  for (const [name, w, h] of SCREENS) {
    const { app } = boot({ width: w, height: h });
    assert.ok(app.btnR() * 2 >= MIN_DIAMETER, `${name}: buttons are ${(app.btnR() * 2).toFixed(1)}px across`);
  }
});

test('touch targets hold up across the whole width range, not just the sampled screens', () => {
  // From 375px (the narrowest phone worth targeting) up. Below that the geometry runs out:
  // six mode buttons at 44px plus their gaps and margins need 364px of width, so a 320px
  // screen cannot satisfy this layout at all — see the assertion below.
  for (let w = 375; w <= 2560; w += 4) {
    for (const h of [390, 800, 1024, 1920]) {
      const { app } = boot({ width: w, height: h });
      assert.ok(app.btnR() * 2 >= 44, `${w}x${h}: buttons are ${(app.btnR() * 2).toFixed(1)}px across`);
    }
  }
});

test('below 375px the layout runs out of width, and does so predictably', () => {
  // Not a regression — six buttons plus gaps and margins simply do not fit. Pinned so that
  // if the strip is ever reworked, what happens on a very small screen is a deliberate choice.
  const tiny = boot({ width: 320, height: 480 }).app;
  assert.equal(tiny.twoRow, true, 'it still stacks');
  assert.ok(tiny.btnR() * 2 < 44, 'and shrinks rather than overflowing');
  const modes = tiny.modeButtons();
  assert.ok(modes.at(-1).x + modes.at(-1).r <= 320, 'the last mode button is still on screen');
});

test('a wider screen never means smaller buttons', () => {
  // The bug this replaces: a 390px phone stacked and got 48px buttons, while a 768px
  // tablet stayed on one row and got 38px. Stacking must never lose to not stacking.
  const phone = boot({ width: 390, height: 1024 }).app;
  const tablet = boot({ width: 768, height: 1024 }).app;
  const desktop = boot({ width: 1440, height: 1024 }).app;
  assert.ok(tablet.btnR() >= phone.btnR(), 'the tablet is not worse off than the phone');
  assert.ok(desktop.btnR() >= 22, 'and the desktop clears the floor too');
});

test('the gear stays out of the grid, in whichever margin is wider', () => {
  for (const [name, w, h] of SCREENS) {
    const { app } = boot({ width: w, height: h });
    const g = app.gearButton();
    const size = app.cell * app.N;
    const leftOfGrid = g.x + g.r <= app.ox + 0.01;
    const aboveGrid = g.y + g.r <= app.oy + 0.01;
    // On a near-square window r is clamped up to its 14px floor and may graze the grid.
    if (g.r > 14) assert.ok(leftOfGrid || aboveGrid, `${name}: gear lands on the grid`);
    assert.ok(g.x - g.r >= 0 && g.y - g.r >= 0, `${name}: gear is on screen`);
    assert.ok(g.y + g.r < h - app.bar, `${name}: gear is clear of the control strip`);
    assert.ok(size > 0);
  }
});

test('the gear is never smaller than its floor or bigger than its cap', () => {
  for (const [, w, h] of SCREENS) {
    const r = boot({ width: w, height: h }).app.gearButton().r;
    assert.ok(r >= 14 && r <= 28, `gear radius ${r} out of range`);
  }
});

test('there are six modes and one button per layer', () => {
  const { app } = boot();
  assert.deepEqual(app.modeButtons().map((b) => b.m).join(','), 'score,bounce,random,draw,push,solo');
  assert.equal(app.layerButtons().length, app.LAYERS);
});

test('a resize relays out the grid', () => {
  const h = boot({ width: 1280, height: 800 });
  const before = h.app.cell;
  h.sandbox.innerWidth = 600;
  h.sandbox.innerHeight = 900;
  h.app.layout();
  assert.notEqual(h.app.cell, before);
  assert.equal(h.app.twoRow, true);
});

test('daytime keeps the bright palette', () => {
  const h = boot({ hours: 12 });
  assert.equal(h.app.night, false);
  assert.equal(h.app.BG, h.app.DAY_BG);
  assert.deepEqual(h.app.CANDY.join('|'), h.app.DAY_CANDY.join('|'));
  assert.equal(h.sandbox.Tone.Destination.volume.value, 0);
});

test('after bedtime the wall glows dimmer and sings softer', () => {
  const h = boot({ hours: 21 });
  assert.equal(h.app.night, true);
  assert.equal(h.app.BG, h.app.NIGHT_BG);
  assert.equal(h.sandbox.Tone.Destination.volume.value, -8);
  assert.equal(h.sandbox.document.body.style.background, h.app.NIGHT_BG);
  for (let i = 0; i < h.app.DAY_CANDY.length; i++) {
    const day = h.app.DAY_CANDY[i].split(',').map(Number);
    const nite = h.app.CANDY[i].split(',').map(Number);
    for (let c = 0; c < 3; c++) assert.ok(nite[c] < day[c], 'every channel is dimmer at night');
  }
});

test('bedtime runs 20:00 to 07:00', () => {
  for (const hour of [20, 21, 23, 0, 3, 6]) {
    assert.equal(boot({ hours: hour }).app.night, true, `${hour}:00 should be night`);
  }
  for (const hour of [7, 9, 12, 17, 19]) {
    assert.equal(boot({ hours: hour }).app.night, false, `${hour}:00 should be day`);
  }
});

test('the night check is scheduled to keep running all evening', () => {
  const h = boot();
  assert.ok(h.intervalWithPeriod(60000), 'a minute-by-minute bedtime check is registered');
});

test('the spring starts at rest, overshoots, and settles', () => {
  const { app } = boot();
  assert.equal(app.spring(0), 0);
  const peak = Math.max(...Array.from({ length: 100 }, (_, i) => app.spring(i / 100)));
  assert.ok(peak > 1, 'it overshoots — nothing snaps');
  assert.ok(Math.abs(app.spring(3) - 1) < 0.001, 'and comes to rest at 1');
});

test('a button dips and springs back only while it is the last one tapped', () => {
  const h = boot();
  const { app } = h;
  const now = h.now();
  assert.equal(app.btnScale('score', now), 1, 'nothing tapped yet');

  app.btnPop = { id: 'score', at: now };
  assert.equal(app.btnScale('score', now), 1, 'starts at rest');
  assert.ok(app.btnScale('score', now + 60) < 1, 'dips in');
  assert.equal(app.btnScale('bounce', now + 60), 1, 'other buttons are unaffected');
  assert.equal(app.btnScale('score', now + app.ANIM_MS + 1), 1, 'settled once the animation ends');
});

test('the render loop is running and the renderer survives every mode', () => {
  const h = boot();
  const { app } = h;
  assert.equal(h.rafs.length, 1, 'one requestAnimationFrame loop kicked off at boot');

  for (const mode of Object.keys(app.MODES)) {
    app.layers.forEach((L) => { L.mode = mode; });
    app.setCell(app.layers[0], 3, 3, true);
    app.setCell(app.layers[1], 8, 12, true);
    app.pointers.set(1, { x: 400, y: 400 });
    app.spawnRipple(3, 3);
    h.advance(16);
    assert.doesNotThrow(() => app.draw(h.now()), `draw() threw in ${mode} mode`);
  }
});

test('drawing decides nothing — one frame leaves the state untouched', () => {
  const h = boot();
  const { app } = h;
  const L = app.layers[0];
  app.setCell(L, 4, 4, true);
  app.setCell(L, 9, 2, true);
  const before = JSON.stringify({ grid: L.grid, placed: L.placed, mode: L.mode, len: L.len });
  h.clearLog();

  for (let f = 0; f < 30; f++) { h.advance(16); app.draw(h.now()); }

  assert.equal(JSON.stringify({ grid: L.grid, placed: L.placed, mode: L.mode, len: L.len }), before);
  assert.deepEqual(h.notes(), [], 'the renderer never triggers a note');
});

test('the renderer actually puts something on the canvas', () => {
  const h = boot();
  h.app.setCell(h.app.layers[0], 4, 4, true);
  h.drawCalls.length = 0;
  h.app.draw(h.now());
  assert.ok(h.drawCalls.length > 100, 'a full grid frame was drawn');
});
