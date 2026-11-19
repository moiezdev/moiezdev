import { useEffect } from 'react';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';

/**
 * The home page's nano forge, as a dim background behind the whole page, driven by scroll (see MOTION.md).
 *
 * Each home section marks where it starts with `data-forge-spot="<shape name>"` (see ForgeSpot), and the hero
 * stands for the first shape. One fixed, viewport-sized canvas sits behind the content, at low opacity so it never
 * competes with the text, and draws one large shape in the middle of the screen. As a section's marker rises from
 * low on the screen to the upper part, the last shape breaks into cubes and they fuse into that section's shape;
 * scrolling back plays it in reverse. Nothing runs on a timer except the shape's own idle turning and rippling and the planet's orbiting debris,
 * and it never takes the pointer.
 */

// each section's shape stands whole, solid, for the middle 60% of the way between its neighbours' middles (while its
// own middle is near the middle of the screen); only the 40% around each hand-over is spent melting, floating
// across and forming the next shape
const HOLD = 0.6;
// how quickly the drawn shape catches up with the scroll (per second); lower is slower and smoother
const GLIDE = 1.4;
// the fastest it moves on, in sections per second, however fast the page is flung
const MAX_SPEED = 0.9;
// more than this many sections behind the scroll, it skips straight to the one in view, in a trip this long (s)
const SKIP = 1;
const SKIP_TIME = 1.8;
// how the way from one section to the next is spent by Deto, the living liquid (src/motion/deto.js):
//   0    - 0.28  the standing shape melts into one round body of liquid
//   0.28 - 0.6   the body floats to the next shape's place (its own physics adds inertia, stretch and its tail)
//   0.6  - 1     the next shape slowly grows out of it
// Every stage eases in and out of the next (no sudden change of speed), so the hand-overs do not jerk.
// Deto's morph phases are 0-0.22 melt, 0.22-0.78 round, 0.78-1 form.
const TRAVEL = [0.28, 0.6];
const wave = (u) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, u)));
const phase = (f) => (f < TRAVEL[0] ? 0.5 * wave(f / TRAVEL[0]) : f < TRAVEL[1] ? 0.5 : 0.5 + 0.5 * wave((f - TRAVEL[1]) / (1 - TRAVEL[1])));
// the target speeds up and slows down along the way
const ease = (u) => {
  const x = Math.min(1, Math.max(0, u));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

const lerp = (a, b, u) => a + (b - a) * u;

/**
 * Where a marker's shape stands. Inside a `.forge-side` section on a wide screen it is the middle of the column the
 * content leaves free (see index.css), at full strength; anywhere else (the hero, a phone) it is large, dim and in
 * the middle of the screen.
 */
const place = (el, W, H) => {
  const centre = { x: W / 2, y: H / 2, size: Math.min(W * 0.92, H * 0.9), lift: 0 };
  // the hero's blob sits dim behind the portrait, and scrolls with it
  const stage = el.closest('.hero-stage');
  if (stage) {
    const r = stage.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.45, size: Math.min(Math.max(r.width, r.height) * 0.9, H * 0.57), lift: 0 };
  }
  const box = el.closest('.forge-side');
  if (!box || W < 1024) return centre;
  const cs = getComputedStyle(box);
  const cols = cs.gridTemplateColumns.split(' ').map(parseFloat);
  if (cols.length !== 2 || cols.some((c) => !(c > 0))) return centre;
  const r = box.getBoundingClientRect();
  const gap = parseFloat(cs.columnGap) || 0;
  // the free column is the second for --end and the first for --start, counted from the inline start
  const free = box.classList.contains('forge-side--start') ? 0 : 1;
  const from = free === 0 ? 0 : cols[0] + gap;
  const mid = from + cols[free] / 2;
  const x = cs.direction === 'rtl' ? r.right - parseFloat(cs.paddingRight) - mid : r.left + parseFloat(cs.paddingLeft) + mid;
  return { x, y: H / 2, size: Math.min(cols[free] * 1.2, H * 0.8), lift: 1 };
};

const markers = () => [...document.querySelectorAll('[data-forge-spot]')].filter((el) => el.isConnected);

export default function ForgeLayer() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    const start = async () => {
      const { createDeto } = await import('../../motion/deto.js');
      if (cancelled) return;

      const root = document.documentElement;
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.className = 'forge-layer';
      document.body.appendChild(canvas);

      const theme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');

      let forge;
      try {
        forge = createDeto(canvas, { theme, gentle: reduced });
      } catch (err) {
        console.warn('[nano forge]', err);
      }
      if (!forge) {
        canvas.remove();
        return;
      }
      root.dataset.forge = '';

      // how far along the row of shapes we are (2.4 = 40% of the way from shape 2 to shape 3): scroll sets the
      // target, and the drawn position glides after it, so a shape forms gradually however fast you scroll
      let lift = -1;
      const setLift = (v) => {
        const r = Math.round(v * 100) / 100;
        if (r !== lift) canvas.style.setProperty('--forge-lift', String((lift = r)));
      };
      let pos = -1;
      let posV = 0;
      let lastPos = -1;
      let trip = null;
      let skip = null;
      let shown = null;
      const scene = (dt) => {
        const list = markers();
        if (!list.length) return null;
        const W = window.innerWidth;
        const H = window.innerHeight;
        const names = list.map((el) => el.dataset.forgeSpot);
        // each section's hold, in scroll position: from HOLD / 2 of the way back to the previous section's middle
        // to HOLD / 2 of the way on to the next one's. The first holds from the top of the page, the last to the
        // bottom, and no hold starts past the end of the page, so the last shape always completes.
        const y = window.scrollY;
        const maxY = Math.max(0, document.documentElement.scrollHeight - H);
        const mids = list.map((el) => {
          const r = (el.closest('section') || el).getBoundingClientRect();
          return r.top + y + r.height / 2 - H / 2;
        });
        const holds = mids.map((mid, i) => [
          i > 0 ? mid - ((mid - mids[i - 1]) * HOLD) / 2 : mid,
          i + 1 < mids.length ? mid + ((mids[i + 1] - mid) * HOLD) / 2 : mid,
        ]);
        holds[0][0] = -Infinity;
        holds[holds.length - 1][1] = Infinity;
        for (let i = holds.length - 1; i >= 1; i--) {
          holds[i][0] = Math.min(holds[i][0], maxY - 1, i + 1 < holds.length ? holds[i + 1][0] - 1 : Infinity);
          holds[i - 1][1] = Math.min(holds[i - 1][1], holds[i][0] - 1);
        }
        let target = 0;
        for (let i = 0; i < holds.length; i++) {
          if (y < holds[i][0]) break;
          target = y <= holds[i][1] || i === holds.length - 1 ? i : i + Math.min(1, (y - holds[i][1]) / Math.max(1, holds[i + 1][0] - holds[i][1]));
        }
        if (pos < 0) pos = target;
        // a fast scroll that leaves Deto more than a section behind: it goes straight to the section in view, from
        // where it is and the shape it shows now, without visiting the sections in between (one timed trip). The
        // section it is heading for follows the scroll until the new shape starts to form.
        const dest = Math.min(names.length - 1, Math.max(0, Math.round(target)));
        if (!skip && Math.abs(target - pos) > SKIP && shown) {
          const mNow = shown.still ? 1 : phase(shown.fw);
          // leave from the shape it mostly is now: still standing, or already round (then the trip starts round)
          const from = shown.still || mNow < 0.5 ? shown.ia : shown.ib;
          const round = !shown.still && mNow > 0.2 && mNow < 0.8;
          skip = { from, to: dest, f: round ? TRAVEL[0] : 0, start: shown.view };
        }
        let ia;
        let ib;
        let fw;
        let still;
        let pa;
        if (skip) {
          skip.f += dt / SKIP_TIME;
          if (skip.f < TRAVEL[1]) skip.to = dest;
          if (skip.f >= 1) {
            pos = lastPos = skip.to;
            posV = 0;
            trip = null;
            skip = null;
          }
        }
        if (skip) {
          ia = skip.from;
          ib = skip.to;
          fw = skip.f;
          still = false;
          pa = skip.start;
        } else {
          // otherwise the drawn position chases the scroll at a capped, smoothly changing speed, and never passes
          // it, so it never turns back on its own
          const want = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, (target - pos) * GLIDE));
          posV += (want - posV) * (1 - Math.exp(-dt * 6));
          const gap = target - pos;
          const step = posV * dt;
          if (Math.abs(gap) < 1e-4 || (step * gap > 0 && Math.abs(step) >= Math.abs(gap))) {
            pos = target;
            posV = 0;
          } else if (step * gap > 0) pos += step;
          // (moving away from the scroll, after it turned round: it holds still while its speed turns round too)
          // a whole number is a standing shape; in between, from shape k to k + 1
          const k = Math.min(names.length - 1, Math.floor(pos + 1e-6));
          const f = pos - k;
          still = f < 1e-4;
          // the head always leads: a trip entered scrolling back up runs the same journey the other way round, from
          // shape k + 1 to shape k (the direction is set when the trip starts, so turning back halfway never jumps)
          const prev = lastPos;
          lastPos = pos;
          if (still) trip = null;
          else if (!trip || trip.k !== k) trip = { k, back: pos < prev };
          const back = !still && trip.back;
          const kb = Math.min(names.length - 1, k + 1);
          ia = back ? kb : k;
          ib = still ? k : back ? k : kb;
          fw = back ? 1 - f : f;
          pa = place(list[ia], W, H);
        }
        const m = still ? 1 : phase(fw);
        const a = forge.shapeIndex(names[ia]);
        const b = forge.shapeIndex(names[ib]);
        // where each of the two shapes stands: the hero's behind the portrait, a section's in the middle of its free
        // side column; in between, the body floats from one to the other
        const pb = still ? pa : place(list[ib], W, H);
        // where the way has got to, straight from one place to the next (it floats: nothing pulls it down). This is
        // only the target: Deto's own physics (inertia, stretch, its tail) follows it.
        const eh = still ? 0 : ease((fw - TRAVEL[0]) / (TRAVEL[1] - TRAVEL[0]));
        const view = { x: lerp(pa.x, pb.x, eh), y: lerp(pa.y, pb.y, eh), size: lerp(pa.size, pb.size, eh) };
        const lifted = lerp(pa.lift, pb.lift, eh);
        setLift(lifted);
        shown = { ia, ib, fw, still, view: { ...view, lift: lifted } };
        return { a, b, m, view };
      };

      const onResize = () => forge.resize();
      window.addEventListener('resize', onResize);

      let raf = 0;
      let last = 0;
      let t = 0;
      const loop = (now) => {
        raf = requestAnimationFrame(loop);
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        t += dt;
        const s = scene(dt);
        if (s && s.a >= 0 && s.b >= 0) forge.drive(t, dt, s);
      };
      const sync = () => {
        const run = document.visibilityState === 'visible';
        if (run && !raf) {
          last = 0;
          raf = requestAnimationFrame(loop);
        } else if (!run && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      };
      document.addEventListener('visibilitychange', sync);
      sync();

      cleanup = () => {
        cancelAnimationFrame(raf);
        document.removeEventListener('visibilitychange', sync);
        window.removeEventListener('resize', onResize);
        forge.destroy();
        canvas.remove();
        delete root.dataset.forge;
      };
    };

    // never compete with first paint
    const idle = window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 1500 }) : window.setTimeout(start, 600);
    return () => {
      cancelled = true;
      if (window.requestIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      cleanup();
    };
  }, [reduced]);

  return null;
}

/** Marks where a section starts and which shape stands for it. It takes no space and renders nothing visible. */
export const ForgeSpot = ({ shape }) => <span data-forge-spot={shape} aria-hidden className="block h-0" />;
