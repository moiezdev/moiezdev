import { useEffect } from 'react';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';

/**
 * The home page's nano forge, as a dim background behind the whole page, driven by scroll (see MOTION.md).
 *
 * Each home section marks where it starts with `data-forge-spot="<shape name>"` (see ForgeSpot), and the hero
 * stands for the first shape. One fixed, viewport-sized canvas sits behind the content, at low opacity so it never
 * competes with the text, and draws one large shape in the middle of the screen. As a section's marker rises from
 * low on the screen to the upper part, the last shape breaks into cubes and they fuse into that section's shape;
 * scrolling back plays it in reverse. Nothing runs on a timer except the shape's own idle turning and rippling,
 * and it never takes the pointer.
 */

// each section's shape stands whole while the section crosses the middle 3% of its trip over the screen; the
// rest of the trip it is forming (coming in) or coming apart (going out), through the cube cloud between sections
const HOLD = 0.03;
// how quickly the drawn shape catches up with the scroll (per second); lower is slower and smoother
const GLIDE = 1.4;
// how the way from one section to the next is spent, as one living mass:
//   0    - 0.28  the standing shape breaks up into its cubes and they pull together into one slime
//   0.28 - 0.6   the slime travels to the next shape's place, head first, a comet tail streaming behind along the
//                path the head took and thinning out; the tail catches up once the head has arrived
//   0.6  - 1     the gathered slime slowly spreads into the next shape's positions and its skin grows over them
// Every stage eases in and out of the next (no sudden change of speed), so the hand-overs do not jerk.
// The engine's own morph phases are 0-0.22 break, 0.22-0.78 cubes in flight, 0.78-1 form.
const TRAVEL = [0.28, 0.6];
const TAIL = 0.55; // how long the tail is, as a share of the journey
const wave = (u) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, u)));
const phase = (f) => (f < TRAVEL[0] ? 0.5 * wave(f / TRAVEL[0]) : f < TRAVEL[1] ? 0.5 : 0.5 + 0.5 * wave((f - TRAVEL[1]) / (1 - TRAVEL[1])));
// the head speeds up and slows down along the way (the same easing the engine gives the tail)
const ease = (u) => {
  const x = Math.min(1, Math.max(0, u));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

const ss = (a, b, x) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
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
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.45, size: Math.min(Math.max(r.width, r.height) * 1.5, H * 0.95), lift: 0 };
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
      const { createNanoForge } = await import('../../motion/nanoForge.js');
      if (cancelled) return;

      const root = document.documentElement;
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.className = 'forge-layer';
      document.body.appendChild(canvas);

      const theme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');
      // a background never reacts to the pointer
      const ptr = { x: 0, y: 0, active: false };

      let forge;
      try {
        forge = createNanoForge(canvas, { theme, pointer: () => ptr, gentle: reduced, page: true });
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
      let lastPos = -1;
      let trip = null;
      const scene = (dt) => {
        const list = markers();
        if (!list.length) return null;
        const W = window.innerWidth;
        const H = window.innerHeight;
        const names = list.map((el) => el.dataset.forgeSpot);
        // each section's hold, in scroll position: while its middle is within HOLD / 2 of its trip either side of
        // the middle of the screen. The first holds from the top of the page, the last to the bottom, and no hold
        // starts past the end of the page, so the last shape always completes.
        const y = window.scrollY;
        const maxY = Math.max(0, document.documentElement.scrollHeight - H);
        const holds = list.map((el) => {
          const r = (el.closest('section') || el).getBoundingClientRect();
          const mid = r.top + y + r.height / 2 - H / 2;
          const half = ((H + r.height) * HOLD) / 2;
          return [mid - half, mid + half];
        });
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
        pos = pos < 0 ? target : pos + (target - pos) * (1 - Math.exp(-dt * GLIDE));
        if (Math.abs(target - pos) < 1e-4) pos = target;
        // a whole number is a standing shape; in between, from shape k to k + 1
        const k = Math.min(names.length - 1, Math.floor(pos + 1e-6));
        const f = pos - k;
        const still = f < 1e-4;
        // the head always leads: a trip entered scrolling back up runs the same journey the other way round, from
        // shape k + 1 to shape k (the direction is set when the trip starts, so turning back halfway never jumps)
        const prev = lastPos;
        lastPos = pos;
        if (still) trip = null;
        else if (!trip || trip.k !== k) trip = { k, back: pos < prev };
        const back = !still && trip.back;
        const kb = Math.min(names.length - 1, k + 1);
        const ia = back ? kb : k;
        const ib = still ? k : back ? k : kb;
        const fw = back ? 1 - f : f;
        const m = still ? 1 : phase(fw);
        const a = forge.shapeIndex(names[ia]);
        const b = forge.shapeIndex(names[ib]);
        // where each of the two shapes stands: the hero's large and dim in the middle of the screen, a section's at
        // full strength in the middle of its free side column; in between, the cloud drifts from one to the other
        const pa = place(list[ia], W, H);
        const pb = still ? pa : place(list[ib], W, H);
        // the journey: h runs 0 -> 1 + TAIL while the slime travels (the head arrives at 1, the tail end at 1 + TAIL)
        const h = still ? 0 : Math.min(1, Math.max(0, (fw - TRAVEL[0]) / (TRAVEL[1] - TRAVEL[0]))) * (1 + TAIL);
        const eh = ease(h);
        const amt = still ? 0 : ss(0.12, 0.28, fw) * (1 - ss(TRAVEL[1], 0.8, fw));
        // the path bows downwards a little, as if the slime were heavy
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dist = Math.hypot(dx, dy);
        let nx = dist > 1 ? -dy / dist : 0;
        let ny = dist > 1 ? dx / dist : 0;
        if (ny < 0) {
          nx = -nx;
          ny = -ny;
        }
        const bow = dist * 0.16;
        const arc = Math.sin(Math.PI * eh);
        const size = lerp(pa.size, pb.size, eh);
        const view = { x: pa.x + dx * eh + nx * bow * arc, y: pa.y + dy * eh + ny * bow * arc, size };
        // the same path for the engine, in its units (y up), so each cube can sit where the head was a moment ago
        const unit = Math.max(1, size * 0.4);
        view.travel = { amt, head: h, tail: TAIL, d: [dx / unit, -dy / unit], n: [(nx * bow) / unit, (-ny * bow) / unit] };
        const e = eh;
        // the liquid stays solid all the way across (no fading back while it crosses the content)
        const l = lerp(pa.lift, pb.lift, e);
        setLift(l);
        // the dim background has no floor shadow; a shape in its own column stands on one
        view.shadow = l;
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
