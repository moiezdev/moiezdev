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

// a section's shape starts to form when its marker passes START x the screen height and has formed by END
const START = 0.8;
const END = 0.35;

const markers = () => [...document.querySelectorAll('[data-forge-spot]')].filter((el) => el.isConnected);

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

      const scene = () => {
        const list = markers();
        if (!list.length) return null;
        const W = window.innerWidth;
        const H = window.innerHeight;
        const names = list.map((el) => el.dataset.forgeSpot);
        const tops = list.map((el) => el.getBoundingClientRect().top);
        // the last marker that has come up past START leads; the one before it is where we came from
        let j = 0;
        for (let i = 1; i < tops.length; i++) if (tops[i] < H * START) j = i;
        const m = j === 0 ? 1 : smooth(Math.min(1, Math.max(0, (H * START - tops[j]) / (H * (START - END)))));
        const a = forge.shapeIndex(names[Math.max(0, j - 1)]);
        const b = forge.shapeIndex(names[j]);
        // one large shape, centred on the screen. In a move the old shape first rides up with its section, then
        // the loose cloud pours down towards the section coming up from below, and settles into its shape at the
        // centre; scrolling back up runs it backwards, so the cloud rises instead.
        const flow = j === 0 ? 0 : -Math.sin(2 * Math.PI * m) * H * 0.2;
        const view = { x: W / 2, y: H / 2 + flow, size: Math.min(W * 0.92, H * 0.9) };
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
