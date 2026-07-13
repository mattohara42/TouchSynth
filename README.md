# Grid Sings

A Tenori-on-inspired grid music instrument for kids. Walk up, tap the grid, and it
sings — no instructions, no wrong notes. Built for a 21.5" touch panel on the wall,
runs happily in any modern browser.

**Live:** [touchsynth.netlify.app](https://touchsynth.netlify.app)

Everything is quantised to a pentatonic scale, so any combination of taps sounds
intentional. A child should be making music within ten seconds of walking up.

---

## Playing it (the kid surface)

The whole grid is the instrument. The only chrome is a single row of buttons along
the bottom.

- **Tap a cell** to toggle it on/off. The first tap anywhere also wakes the sound up.
- **Mode buttons** (bottom-left, 6 of them) change what the grid *does* — see below.
- **Layer dice** (bottom-centre, 1/2/3 dots) pick which layer you're editing. All
  three layers sound at once; each has its own voice, mode, and loop length.
- **Clear ✕** (bottom-right) — *hold* for about a second (a ring fills) to wipe the
  layer you're on. Holding, not tapping, so a stray finger never erases a pattern.

### The six modes

| Mode | Icon | What it does | Pitch from |
|------|------|--------------|------------|
| **Score** | ▶ | A playhead sweeps left→right on a loop; lit cells in the current column sing. | row |
| **Bounce** | ball over floor | Each lit cell drops a ball that strikes the floor every `16 − row` steps — higher = slower. Guaranteed polyrhythms. | column |
| **Random** | zig-zag | A light hops dot-to-dot in the order you placed them, one hop per eighth note. | row |
| **Draw** | squiggle | Drag to paint a trail that plays like Score and evaporates after a few loops. | row |
| **Push** | pad + chevron | *Live.* Hold a cell to sustain it; hold several for a chord; drag and the note follows your finger. Uses a soft pad voice. | row |
| **Solo** | radiating waves | *Live.* Each cell you touch plucks the layer's own voice once; slide for a glissando. | row |

Score, Bounce, Random and Draw are *sequencer* modes — they play a stored pattern on
the transport clock. Push and Solo are *live* modes — the finger is the sequencer, so
they make no sound on their own and don't store a pattern. Switching a layer into a
live mode hides its stored pattern (and restores it when you switch back — nothing is
ever destroyed).

---

## The grown-up panel (hidden settings)

Kids never need it and won't find it: **hold a finger still for 3 seconds in the
top-left corner** (a small dead zone above the grid). The grid keeps playing around
the card. Inside:

- **Tempo** — 60–180 BPM
- **Per-layer loop length** — 4–16 steps each. Set layers to unequal lengths (say 15
  and 16) and they drift in and out of phase — Steve Reich's *Piano Phase* on a wall.
- **Swing** — 0–50%
- **Scale** — major pentatonic (sunny), minor pentatonic (moody), or hirajoshi (gamelan)
- **Mirror painting** — off / left–right echo / kaleidoscope
- **Garden** — the Brian Eno switch: a left-behind pattern slowly grows and prunes
  itself, one dot every 8 bars
- **Clear all layers**, and a *"who makes music like this?"* teaching card with a QR
  code linking to a listening page ([artists.html](./artists.html))

---

## What else it does on its own

- **Three voices** — marimba (layer 1), a soft pluck up an octave (layer 2), and FM
  glass bells down an octave (layer 3), each its own layer.
- **Night palette** — from 20:00 to 07:00 the colours dim, the background darkens, and
  the master level drops, for a kitchen wall that shouldn't shout after bedtime.
- **Idle attract mode** — after two minutes untouched *with an empty grid*, a ghost
  plays gentle preset patterns to lure someone over. Any tap hands it straight back.
- **It remembers** — every change is saved to `localStorage`, so a kiosk reboot brings
  the pattern (and all panel settings) back.
- **Rubber/gummy feel** — nothing snaps; cells inflate, squash and wobble, ripples push
  the membrane, buttons dip and spring. Colour follows *pitch class*, so the same note
  is the same candy colour in every octave.

---

## Running it locally

No build step. It's a single `index.html` that loads [Tone.js](https://tonejs.github.io/)
from a CDN, so you just need to serve the folder (opening the file directly works too,
as long as you're online for the CDN):

```bash
npx http-server        # then open the printed http://localhost:… URL
```

(The repo's `.claude/launch.json` starts exactly this for in-editor previews.)

Web Audio needs a user gesture, so the first tap starts everything — that's the
"tap anywhere to begin" hint.

## Deploying

Manual deploys only — **pushing to GitHub does not deploy.**

```bash
netlify deploy         # draft URL to preview
netlify deploy --prod  # publish to touchsynth.netlify.app (Matt's call when to ship)
```

---

## How it's built

Three seams, kept deliberately separate so new modes and layers extend rather than
rewrite (see `CLAUDE.md` for the rules that protect them):

1. **State** — dumb data. Per-layer 16×16 boolean grids plus tap order and animation
   timestamps. No logic.
2. **Audio engine** — owns timing. A Tone.js Transport fires a 16-step loop; on each
   step it reads state and triggers notes. Modes are swappable "what fires when"
   strategies in a `MODES{}` map. Never depends on the render loop.
3. **Renderer** — a Canvas `requestAnimationFrame` loop that reads state and a ripple
   queue and draws. Owns nothing, decides nothing.

**Stack:** vanilla JS, Tone.js 14.8.49 (pinned), HTML Canvas. No framework, no bundler.
**Target:** a 21.5" RAYPODO Android touch panel running Fully Kiosk Browser, fullscreen,
for hours unattended. Desktop browser is the dev environment.

---

## The docs

| File | What's in it |
|------|--------------|
| `README.md` | This file — what it is and how to run it. |
| `CLAUDE.md` | North star, architecture rules, and working agreements. |
| `BACKLOG.md` | Everything shipped, deferred, and open, plus a dated assumptions log. |
| `CONCEPTS.md` | Planning for two follow-on toys (Pond Chimes, Chord Garden) — future, separate repos. |
| `artists.html` | The listening page the teaching-card QR points to. |
| `*-mockup.html` | Approved visual specs for the follow-on toys (planning artifacts). |

Grid Sings is a working title. It is **not** a DAW, not settings-rich, and not part of
Family Hub — it's a separate repo with a separate Netlify site. Every control has to
earn its place against the "walk up and play" test.
