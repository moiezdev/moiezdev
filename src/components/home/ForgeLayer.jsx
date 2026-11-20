import { useEffect } from 'react';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';

/**
 * Deto, the home page's living liquid (src/motion/deto.js), on one fixed canvas behind the content (see MOTION.md).
 *
 * It lives in two places only. Behind the hero portrait it runs through all its shapes on a timer, melting each into
 * round liquid and growing the next out of it. In Contact (marked with `data-forge-spot="handshake"`, see ForgeSpot)
 * it holds two hands shaking, in the column the contact content leaves free. It never travels between them: the
 * hero's Deto scrolls away with the hero, and once Contact comes up from the bottom of the screen Deto starts there.
 * It never takes the pointer.
 */

// the hero's cycle of shapes, and how long each stands and takes to change into the next (seconds)
const CYCLE = ['toxic sludge', 'cube', 'torus knot', 'double helix', 'möbius loop', 'planet'];
const HOLD_S = 4;
const MORPH_S = 2.6;
// how one change of shape is spent: 0-0.28 the standing shape melts into round liquid, it stays round to 0.6, then
// the next shape slowly grows out of it. Every stage eases into the next, so nothing jerks.
// Deto's morph phases are 0-0.22 melt, 0.22-0.78 round, 0.78-1 form.
const TRAVEL = [0.28, 0.6];
const wave = (u) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, u)));
const phase = (f) => (f < TRAVEL[0] ? 0.5 * wave(f / TRAVEL[0]) : f < TRAVEL[1] ? 0.5 : 0.5 + 0.5 * wave((f - TRAVEL[1]) / (1 - TRAVEL[1])));
/**
 * Where a marker's shape stands. In the hero, behind the portrait, scrolling with it. Inside a `.forge-side` section
 * on a wide screen, the middle of the column the content leaves free; on a phone, the middle of the screen. Either
 * way it rises with its section from the bottom of the screen and then stays at mid-height while the section is read.
 */
const place = (el, W, H) => {
  const sec = el.closest('section');
  const sr = sec ? sec.getBoundingClientRect() : null;
  const y = sr ? Math.max(H / 2, sr.top + Math.min(sr.height, H) / 2) : H / 2;
  const centre = { x: W / 2, y, size: Math.min(W * 0.92, H * 0.9), lift: 0 };
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
  return { x, y, size: Math.min(cols[free] * 1.2, H * 0.8), lift: 1 };
};

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
      // Deto lives in two places only (Moiz, 2026-11-20): behind the hero portrait, where it runs through all its
      // shapes on its own, and beside the contact form, where it holds a handshake. Between them it does not travel:
      // the hero's Deto scrolls away with the hero, and once Contact comes up from the bottom Deto starts over there.
      let lastAnchor = null;
      let clock = 0;
      const scene = (dt) => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const hero = document.querySelector('.hero-stage [data-forge-spot]');
        const contact = document.querySelector('[data-forge-spot="handshake"]');
        const contactBox = contact && (contact.closest('section') || contact);
        const useContact = !!contact && (!hero || contactBox.getBoundingClientRect().top < H);
        const anchor = useContact ? contact : hero;
        if (!anchor) return null;
        const snap = lastAnchor !== null && anchor !== lastAnchor;
        lastAnchor = anchor;
        const p = place(anchor, W, H);
        setLift(p.lift);
        const view = { x: p.x, y: p.y, size: p.size };
        if (useContact) {
          const hands = forge.shapeIndex('handshake');
          return { a: hands, b: hands, m: 1, view, snap };
        }
        // the hero's cycle: each shape stands for HOLD_S seconds, then melts into the round liquid and the next one
        // grows out of it over MORPH_S seconds, round and round
        clock += dt;
        const step = HOLD_S + MORPH_S;
        const n = Math.floor(clock / step);
        const into = clock - n * step;
        const i = n % CYCLE.length;
        const a = forge.shapeIndex(CYCLE[i]);
        if (into < HOLD_S) return { a, b: a, m: 1, view, snap };
        const b = forge.shapeIndex(CYCLE[(i + 1) % CYCLE.length]);
        return { a, b, m: phase((into - HOLD_S) / MORPH_S), view, snap };
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
