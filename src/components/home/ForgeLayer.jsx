import { useEffect } from 'react';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';

/**
 * The home page's nano forge, driven by scroll (see MOTION.md).
 *
 * Each home section marks a spot for its shape with `data-forge-spot="<shape name>"` (see ForgeSpot). One
 * page-sized canvas sits above the page, never takes the pointer, and draws one shape at a time into its
 * section's spot. While a section's spot rises from the bottom of the screen to the middle, the last shape
 * breaks into cubes, they fly to the new spot, and fuse into the new shape; scrolling back plays it in
 * reverse. Nothing runs on a timer except the shape's own idle turning and rippling.
 */

// the next spot starts pulling the shape over when its centre enters the bottom of the screen
// (START x the screen height), and the new shape has formed by the time it reaches END
const START = 1.0;
const END = 0.55;

const spots = () =>
  [...document.querySelectorAll('[data-forge-spot]')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });

const smooth = (x) => x * x * (3 - 2 * x);

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
      const ptr = { x: 0, y: 0, active: false };
      const onMove = (e) => {
        if (e.pointerType === 'touch' && !e.isPrimary) return;
        ptr.x = e.clientX;
        ptr.y = e.clientY;
        ptr.active = true;
      };
      const onLeave = (e) => {
        if (e.type === 'pointerout' && e.relatedTarget) return;
        if (e.type === 'pointerup' && e.pointerType !== 'touch') return;
        ptr.active = false;
      };

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

      // where each spot's shape goes, in viewport px
      const boxOf = (el) => {
        const r = el.getBoundingClientRect();
        const size = Math.min(r.width, r.height * 1.15);
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, size };
      };

      const scene = () => {
        const list = spots();
        if (!list.length) return null;
        const H = window.innerHeight;
        const names = list.map((el) => el.dataset.forgeSpot);
        const boxes = list.map(boxOf);
        // the last spot whose centre has come up into the screen leads; the one before it is where we came from
        let j = 0;
        for (let i = 1; i < boxes.length; i++) if (boxes[i].y < H * START) j = i;
        const m = j === 0 ? 1 : smooth(Math.min(1, Math.max(0, (H * START - boxes[j].y) / (H * (START - END)))));
        const i = Math.max(0, j - 1);
        const a = forge.shapeIndex(names[i]);
        const b = forge.shapeIndex(names[j]);
        const A = boxes[i];
        const B = boxes[j];
        const view = m >= 1 ? B : { x: A.x + (B.x - A.x) * m, y: A.y + (B.y - A.y) * m, size: A.size + (B.size - A.size) * m };
        // nothing to draw when the shape and both spots are well off screen
        const off = view.y + view.size < -H * 0.2 || view.y - view.size > H * 1.2;
        return { a, b, m, view: off ? null : view };
      };

      const onResize = () => forge.resize();
      window.addEventListener('resize', onResize);
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onMove, { passive: true });
      window.addEventListener('pointerup', onLeave, { passive: true });
      window.addEventListener('pointercancel', onLeave, { passive: true });
      document.addEventListener('pointerout', onLeave, { passive: true });

      let raf = 0;
      let last = 0;
      let t = 0;
      const loop = (now) => {
        raf = requestAnimationFrame(loop);
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        t += dt;
        const s = scene();
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
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerdown', onMove);
        window.removeEventListener('pointerup', onLeave);
        window.removeEventListener('pointercancel', onLeave);
        document.removeEventListener('pointerout', onLeave);
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

/**
 * Marks where the forge draws this section's shape. `className` sizes it; it renders nothing visible
 * (the hero's spot keeps a soft glow as its placeholder before the canvas loads).
 */
export const ForgeSpot = ({ shape, className = '', children }) => (
  <div data-forge-spot={shape} aria-hidden className={className}>
    {children}
  </div>
);
