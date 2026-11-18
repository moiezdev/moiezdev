import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';

/**
 * The hero's 3D stage: the nano forge (src/motion/nanoForge.js, see MOTION.md).
 *
 * The prerendered HTML is just the stage's glow and pedestal. Once the browser is
 * idle the engine loads and adds one WebGL canvas. It runs only while the stage is
 * on screen and the tab is visible; with reduced motion it draws one still shape.
 * Without WebGL2 the stage keeps its static glow.
 */
export default function HeroStage() {
  const stageRef = useRef(null);
  const captionRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    let cancelled = false;
    let cleanup = () => {};

    const start = async () => {
      const { createNanoForge } = await import('../../motion/nanoForge.js');
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
      const caption = (i, name, total) => {
        const el = captionRef.current;
        if (!el) return;
        el.textContent = `${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')} · ${name}`;
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
        forge = createNanoForge(canvas, { theme, scroll, pointer: () => ptr, onShape: caption });
      } catch (err) {
        console.warn('[nano forge]', err);
      }
      if (!forge) {
        canvas.remove();
        return;
      }
      stage.dataset.live = '';

      const onResize = () => {
        forge.resize();
        if (reduced) forge.still();
      };
      window.addEventListener('resize', onResize);

      if (reduced) {
        forge.still();
        const mo = new MutationObserver(() => forge.still());
        mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
        cleanup = () => {
          mo.disconnect();
          window.removeEventListener('resize', onResize);
          forge.destroy();
          canvas.remove();
          delete stage.dataset.live;
        };
        return;
      }

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
        <div className="hero-stage__floor" />
      </div>
      <p ref={captionRef} className="hero-stage__caption" dir="ltr" />
    </div>
  );
}
