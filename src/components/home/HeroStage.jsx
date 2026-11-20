import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';

/**
 * The hero's 3D stage: the nano forge (src/motion/nanoForge.js, see MOTION.md).
 *
 * The prerendered HTML is just the stage's glow; the engine draws the shape's own floor shadow. Once the browser is
 * idle the engine loads and adds one WebGL canvas. It runs only while the stage is
 * on screen and the tab is visible; with reduced motion it plays a gentle version (half speed, no swarm flying in,
 * no scroll scatter).
 * Without WebGL2 the stage keeps its static glow.
 */
// the canvas reaches past the stage on every side (see .hero-stage__canvas > canvas), so nothing is cut off
const BLEED = 1.5;

export default function HeroStage() {
  const stageRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    let cancelled = false;
    let cleanup = () => {};

    const start = async () => {
      const { createNanoForge } = await import('../../motion/nanoForge.js');
      if (cancelled) return;
      // packing the shapes with thousands of cubes runs in a worker, so it never blocks scrolling
      const small = Math.min(window.innerWidth, window.innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
      let data;
      try {
        data = await new Promise((resolve, reject) => {
          const worker = new Worker(new URL('../../motion/forgeShapes.worker.js', import.meta.url), { type: 'module' });
          worker.onmessage = (e) => {
            resolve(e.data);
            worker.terminate();
          };
          worker.onerror = (e) => {
            reject(e);
            worker.terminate();
          };
          worker.postMessage({ small });
        });
      } catch {
        const { buildShapes } = await import('../../motion/forgeShapes.js');
        data = buildShapes(small);
      }
      if (cancelled) return;

      const root = document.documentElement;
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.className = 'nano-forge';
      stage.prepend(canvas);

      const hero = stage.closest('[data-hero]');
      const theme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');
      const scroll = () => {
        const h = hero?.getBoundingClientRect();
        return h ? -h.top / Math.max(1, h.height) : 0;
      };

      // the cursor, or a finger while it's down, in the canvas's own pixels
      const ptr = { x: 0, y: 0, active: false };
      const onMove = (e) => {
        if (e.pointerType === 'touch' && !e.isPrimary) return;
        const r = canvas.getBoundingClientRect();
        ptr.x = e.clientX - r.left;
        ptr.y = e.clientY - r.top;
        ptr.active = true;
      };
      const onLeave = (e) => {
        if (e.type === 'pointerout' && e.relatedTarget) return;
        if (e.type === 'pointerup' && e.pointerType !== 'touch') return;
        ptr.active = false;
      };

      let forge;
      try {
        forge = createNanoForge(canvas, { data, theme, scroll, pointer: () => ptr, bleed: BLEED, gentle: reduced });
      } catch (err) {
        console.warn('[nano forge]', err);
      }
      if (!forge) {
        canvas.remove();
        return;
      }
      stage.dataset.live = '';

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
      let onScreen = true;
      const loop = (now) => {
        raf = requestAnimationFrame(loop);
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        t += dt;
        forge.step(t, dt);
      };
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
      const io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      });
      io.observe(stage);
      document.addEventListener('visibilitychange', sync);
      sync();

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        document.removeEventListener('visibilitychange', sync);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerdown', onMove);
        window.removeEventListener('pointerup', onLeave);
        window.removeEventListener('pointercancel', onLeave);
        document.removeEventListener('pointerout', onLeave);
        forge.destroy();
        canvas.remove();
        delete stage.dataset.live;
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

  return (
    <div className="hero-stage" aria-hidden>
      <div ref={stageRef} className="hero-stage__canvas">
        <div className="hero-stage__glow" />
      </div>
    </div>
  );
}
