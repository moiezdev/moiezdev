import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';

/**
 * Deto, the hero's living liquid (src/motion/deto.js, see MOTION.md), on one canvas that covers the hero section and
 * scrolls with it. It lives only in the hero.
 *
 * Desktop: dim, in the middle of the hero, in the gap between the copy and the portrait (the copy and the portrait
 * both sit above it). Phones, where the portrait stacks above the copy: dim, behind the portrait.
 * It appears at once as a waving, dancing round liquid, then runs through all its shapes on a timer, each turning
 * straight into the next. It never takes the pointer.
 */

// the cycle of shapes, and how long each stands and takes to change into the next (seconds)
const CYCLE = ['toxic sludge', 'cube', 'torus knot', 'double helix', 'möbius loop', 'planet'];
const HOLD_S = 4;
const MORPH_S = 2.6;

/** Where Deto stands, in the canvas's own CSS px (the canvas covers the section). */
const place = (section) => {
  const s = section.getBoundingClientRect();
  const copy = section.querySelector('[data-hero-copy]')?.getBoundingClientRect();
  const pic = section.querySelector('[data-hero-portrait]')?.getBoundingClientRect();
  if (!copy || !pic) return null;
  const side = pic.top < copy.bottom - 40 && (pic.left >= copy.right - 40 || pic.right <= copy.left + 40);
  if (side) {
    // in the gap between the two columns, whichever side the portrait is on (RTL mirrors the grid)
    const x = pic.left >= copy.right - 40 ? (copy.right + pic.left) / 2 : (pic.right + copy.left) / 2;
    const top = Math.min(copy.top, pic.top);
    const bottom = Math.max(copy.bottom, pic.bottom);
    return { x: x - s.left, y: (top + bottom) / 2 - s.top, size: Math.min(460, (bottom - top) * 0.64) };
  }
  // stacked (phones): behind the portrait
  return { x: pic.left + pic.width / 2 - s.left, y: pic.top + pic.height * 0.5 - s.top, size: Math.min(520, pic.height * 1.45) };
};

export default function HeroLiquid() {
  const hostRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    const section = host?.closest('[data-hero]');
    if (!host || !section) return undefined;
    let cancelled = false;
    let cleanup = () => {};

    const start = async () => {
      const { createDeto } = await import('../../motion/deto.js');
      if (cancelled) return;

      const root = document.documentElement;
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.className = 'hero-liquid__canvas';
      host.appendChild(canvas);

      const theme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');
      let forge;
      try {
        forge = createDeto(canvas, { theme, gentle: reduced });
      } catch (err) {
        console.warn('[deto]', err);
      }
      if (!forge) {
        canvas.remove();
        return;
      }

      let view = place(section);
      const measure = () => {
        forge.resize();
        view = place(section);
      };
      const ro = new ResizeObserver(measure);
      ro.observe(section);

      // each shape stands HOLD_S seconds, then turns straight into the next over MORPH_S (no round liquid between)
      let clock = 0;
      const scene = (dt) => {
        clock += dt;
        const step = HOLD_S + MORPH_S;
        const n = Math.floor(clock / step);
        const into = clock - n * step;
        const a = forge.shapeIndex(CYCLE[n % CYCLE.length]);
        if (into < HOLD_S) return { a, b: a, m: 1, view };
        const b = forge.shapeIndex(CYCLE[(n + 1) % CYCLE.length]);
        return { a, b, m: (into - HOLD_S) / MORPH_S, view };
      };

      let raf = 0;
      let last = 0;
      let t = 0;
      const loop = (now) => {
        raf = requestAnimationFrame(loop);
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        t += dt;
        if (view) forge.drive(t, dt, scene(dt));
      };

      // runs only while the hero is on screen and the tab is visible
      let onScreen = true;
      const sync = () => {
        const run = onScreen && document.visibilityState === 'visible';
        if (run && !raf) {
          last = 0;
          raf = requestAnimationFrame(loop);
        } else if (!run && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      };
      const io = new IntersectionObserver(([e]) => {
        onScreen = e.isIntersecting;
        sync();
      });
      io.observe(section);
      document.addEventListener('visibilitychange', sync);
      sync();

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener('visibilitychange', sync);
        forge.destroy();
        canvas.remove();
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

  return <div ref={hostRef} aria-hidden className="hero-liquid" />;
}
