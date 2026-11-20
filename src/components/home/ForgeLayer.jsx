import { useEffect } from 'react';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';

/**
 * Deto, the home page's living liquid (src/motion/deto.js), on one fixed canvas behind the content (see MOTION.md).
 *
 * It lives only in the hero: dim, in the middle of the hero. It grows out of its centre as a plain sphere, then runs
 * through all its shapes on a timer, each turning straight into the next, and scrolls away with the hero. It never
 * takes the pointer.
 */

// the hero's cycle of shapes, and how long each stands and takes to change into the next (seconds)
const CYCLE = ['toxic sludge', 'cube', 'torus knot', 'double helix', 'möbius loop', 'planet'];
const HOLD_S = 4;
const MORPH_S = 2.6;
// how strong the hero's Deto is drawn (it sits behind the hero's text)
const HERO_OPACITY = 0.32;
/** Where the hero's Deto stands: dim, in the middle of the hero section, scrolling with it. */
const place = (el, W, H) => {
  const r = (el.closest('section') || el).getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + Math.min(r.height, H) / 2, size: Math.min(W * 0.62, H * 0.72), lift: 0 };
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
      // Deto lives only in the hero (Moiz, 2026-11-20): dim in its middle, running through all its shapes on its own,
      // and scrolling away with it
      let clock = 0;
      const scene = (dt) => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const hero = document.querySelector('.hero-stage [data-forge-spot]');
        if (!hero) return null;
        const p = place(hero, W, H);
        setLift(p.lift);
        // dim, so it never competes with the hero's text and buttons
        if (canvas.style.opacity !== String(HERO_OPACITY)) canvas.style.opacity = String(HERO_OPACITY);
        const view = { x: p.x, y: p.y, size: p.size };
        // the hero's cycle: each shape stands for HOLD_S seconds, then turns straight into the next one over
        // MORPH_S seconds (no round liquid between), round and round
        clock += dt;
        const step = HOLD_S + MORPH_S;
        const n = Math.floor(clock / step);
        const into = clock - n * step;
        const i = n % CYCLE.length;
        const a = forge.shapeIndex(CYCLE[i]);
        if (into < HOLD_S) return { a, b: a, m: 1, view };
        const b = forge.shapeIndex(CYCLE[(i + 1) % CYCLE.length]);
        return { a, b, m: (into - HOLD_S) / MORPH_S, view };
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
