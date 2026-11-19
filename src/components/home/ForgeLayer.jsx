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

// the move to a section's shape runs while its marker rises from the bottom of the screen (START x the screen
// height) to END; the rest of the time each shape simply stands
const START = 1.0;
const END = 0.3;
// how quickly the drawn shape catches up with the scroll (per second); lower is slower and smoother
const GLIDE = 1.4;

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
      let pos = -1;
      const scene = (dt) => {
        const list = markers();
        if (!list.length) return null;
        const W = window.innerWidth;
        const H = window.innerHeight;
        const names = list.map((el) => el.dataset.forgeSpot);
        const tops = list.map((el) => el.getBoundingClientRect().top);
        // where each marker's move starts: START x the screen height, or sooner for a marker that is already that
        // close at the top of the page, so the first shape always stands whole before any scrolling
        const begin = tops.map((top) => Math.min(H * START, top + window.scrollY - 1));
        // the last marker that has come up past its start leads; the one before it is where we came from
        let j = 0;
        for (let i = 1; i < tops.length; i++) if (tops[i] < begin[i]) j = i;
        // scrubbed evenly, so the shape comes apart and forms at the pace of the scroll
        const target = j === 0 ? 0 : j - 1 + Math.min(1, Math.max(0, (begin[j] - tops[j]) / Math.max(1, begin[j] - H * END)));
        pos = pos < 0 ? target : pos + (target - pos) * (1 - Math.exp(-dt * GLIDE));
        if (Math.abs(target - pos) < 1e-4) pos = target;
        // a whole number is a standing shape; in between, from shape k to k + 1
        const k = Math.min(names.length - 1, Math.floor(pos + 1e-6));
        const f = pos - k;
        const still = f < 1e-4;
        const m = still ? 1 : f;
        const a = forge.shapeIndex(names[k]);
        const b = forge.shapeIndex(names[still ? k : Math.min(names.length - 1, k + 1)]);
        // one large shape that stays centred on the screen: it dissolves into a cloud of cubes in place and the
        // cloud forms the next shape there, with no pull towards any section
        const view = { x: W / 2, y: H / 2, size: Math.min(W * 0.92, H * 0.9) };
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
