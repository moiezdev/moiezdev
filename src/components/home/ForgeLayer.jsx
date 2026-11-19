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
// the swarm's travel between places on screen: spring stiffness and damping (per second², per second; slightly
// under-damped, so it settles with a small overshoot) and how many seconds of its travel it trails behind
const SPRING = 5;
const DAMP = 3.4;
const LAG = 0.32;
// how the way from one section to the next is spent: the shape comes apart over the first 25%, the cubes fly as a
// cloud over the next 10%, and the next shape forms over the last 65%, a long, slow build (the engine's own phases
// are 22/56/22)
const phase = (f) => (f < 0.25 ? (f / 0.25) * 0.22 : f < 0.35 ? 0.22 + ((f - 0.25) / 0.1) * 0.56 : 0.78 + ((f - 0.35) / 0.65) * 0.22);

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
      let sp = null;
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
        const m = still ? 1 : phase(f);
        const a = forge.shapeIndex(names[k]);
        const b = forge.shapeIndex(names[still ? k : Math.min(names.length - 1, k + 1)]);
        // where each of the two shapes stands: the hero's large and dim in the middle of the screen, a section's at
        // full strength in the middle of its free side column; in between, the cloud drifts from one to the other
        const pa = place(list[k], W, H);
        const pb = still ? pa : place(list[Math.min(names.length - 1, k + 1)], W, H);
        // it changes sides while it is a cloud, over twice the scroll it used to take
        const e = still ? 0 : ss(0.08, 0.56, f);
        const goal = { x: lerp(pa.x, pb.x, e), y: lerp(pa.y, pb.y, e), size: lerp(pa.size, pb.size, e) };
        // the drawn position is a damped spring towards that goal, so the swarm accelerates, travels and settles
        // with a little overshoot, and its speed pulls it into a trailing drop (see uTrail in the engine)
        if (!sp) sp = { ...goal, vx: 0, vy: 0, vs: 0 };
        const step = Math.min(dt, 1 / 30);
        for (const [p, v] of [['x', 'vx'], ['y', 'vy'], ['size', 'vs']]) {
          sp[v] += ((goal[p] - sp[p]) * SPRING - sp[v] * DAMP) * step;
          sp[p] += sp[v] * step;
        }
        const unit = Math.max(1, sp.size * 0.45);
        let tx = (-sp.vx / unit) * LAG;
        let ty = (sp.vy / unit) * LAG;
        const tlen = Math.hypot(tx, ty);
        if (tlen > 0.9) {
          tx *= 0.9 / tlen;
          ty *= 0.9 / tlen;
        }
        const view = { x: sp.x, y: sp.y, size: sp.size, trail: [tx, ty] };
        // crossing the content from one side to the other, the cloud fades back a little
        const across = pa.lift && pb.lift && Math.abs(pa.x - pb.x) > W * 0.2 ? 0.5 * Math.sin(Math.PI * e) : 0;
        const l = lerp(pa.lift, pb.lift, e);
        setLift(l * (1 - across));
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
