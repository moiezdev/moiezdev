import { useEffect } from 'react';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';

/**
 * The nano swarm behind the home page (see src/motion/nanoSwarm.js and MOTION.md).
 *
 * Renders nothing itself: once the browser is idle it loads the engine and adds
 * one fixed canvas behind the page. The formation sits in the middle of the hero
 * (it never touches the hero markup). While the hero is on screen it
 * runs at full rate; past it, the slow field runs at half rate. It stops when
 * the tab is hidden, and with reduced motion it draws one still frame.
 */
export default function HeroSwarm() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const hero = document.querySelector('[data-hero]');
    if (!hero) return undefined;

    let cancelled = false;
    let cleanup = () => {};

    const start = async () => {
      const { createNanoSwarm } = await import('../../motion/nanoSwarm.js');
      if (cancelled) return;

      const root = document.documentElement;
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.className = 'nano-field';
      document.body.prepend(canvas);
      root.classList.add('has-nano-field');

      // the portrait's frame (the <img> sits inside a <picture>), and the copy beside it
      const portrait = () => hero.querySelector('img')?.closest('div');
      const copy = () => hero.querySelector('.app-container > div');
      const anchor = () => {
        const h = hero.getBoundingClientRect();
        if (h.bottom < -h.height) return null; // far past the hero: field only
        const p = portrait()?.getBoundingClientRect();
        const lag = Math.max(0, -h.top) * 0.3; // the formation trails the page a little
        if (!p || !p.width) return { x: h.left + h.width * 0.75, y: h.top + h.height * 0.45 + lag, size: 260 };
        if (window.innerWidth >= 1024) {
          // a large cloud in the middle of the hero, between the copy and the portrait,
          // so it's seen in full; cubes behind the copy are dimmed (see textRects)
          return { x: h.left + h.width / 2, y: h.top + h.height * 0.47 + lag, size: Math.min(380, h.height * 0.4) };
        }
        // phones: a wide halo around the round avatar
        return { x: p.left + p.width / 2, y: p.top + p.height / 2 + lag, size: Math.min(window.innerWidth * 0.44, 180) };
      };
      const header = document.querySelector('header') || document.querySelector('nav');
      const textRects = () => {
        const out = [];
        const r = copy()?.getBoundingClientRect();
        if (r && r.bottom > 0) out.push(r);
        const stats = hero.querySelector('.grid-cols-3')?.getBoundingClientRect();
        if (stats && stats.bottom > 0) out.push(stats);
        if (header) out.push(header.getBoundingClientRect());
        return out;
      };
      const theme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');

      const sc = { progress: 0, speed: 0, y: window.scrollY };
      const readScroll = (dt) => {
        const h = hero.getBoundingClientRect();
        sc.progress = Math.min(1, Math.max(0, -h.top / Math.max(1, h.height)));
        const y = window.scrollY;
        if (dt) sc.speed += ((y - sc.y) / dt - sc.speed) * Math.min(1, dt * 6);
        sc.y = y;
      };

      // the cursor, or a finger while it's on the screen
      const ptr = { x: 0, y: 0, active: false };
      const onMove = (e) => {
        if (e.pointerType === 'touch' && e.type === 'pointermove' && !e.isPrimary) return;
        ptr.x = e.clientX;
        ptr.y = e.clientY;
        ptr.active = true;
      };
      const onLeave = (e) => {
        if (e.type === 'pointerout' && e.relatedTarget) return; // still inside the window
        if (e.type === 'pointerup' && e.pointerType !== 'touch') return;
        ptr.active = false;
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onMove, { passive: true });
      window.addEventListener('pointerup', onLeave, { passive: true });
      window.addEventListener('pointercancel', onLeave, { passive: true });
      document.addEventListener('pointerout', onLeave, { passive: true });
      const unbindPointer = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerdown', onMove);
        window.removeEventListener('pointerup', onLeave);
        window.removeEventListener('pointercancel', onLeave);
        document.removeEventListener('pointerout', onLeave);
      };

      const swarm = createNanoSwarm(canvas, { anchor, textRects, theme, scroll: () => sc, pointer: () => ptr });
      const onResize = () => {
        swarm.resize();
        if (reduced) swarm.still();
      };
      window.addEventListener('resize', onResize);

      if (reduced) {
        readScroll(0);
        swarm.still();
        // repaint the still frame when the theme or language flips
        const mo = new MutationObserver(() => swarm.still());
        mo.observe(root, { attributes: true, attributeFilter: ['data-theme', 'dir'] });
        unbindPointer();
        cleanup = () => {
          mo.disconnect();
          window.removeEventListener('resize', onResize);
          canvas.remove();
          root.classList.remove('has-nano-field');
        };
        return;
      }

      let raf = 0;
      let last = 0;
      let t = 0;
      let skip = false;
      const loop = (now) => {
        raf = requestAnimationFrame(loop);
        // past the hero only the slow field is left: half the frames are plenty
        if (sc.progress >= 1 && (skip = !skip)) return;
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        t += dt;
        readScroll(dt);
        swarm.step(t, dt);
      };
      const sync = () => {
        if (document.visibilityState === 'visible' && !raf) {
          last = 0;
          raf = requestAnimationFrame(loop);
        } else if (document.visibilityState !== 'visible' && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      };
      sync();
      document.addEventListener('visibilitychange', sync);

      cleanup = () => {
        unbindPointer();
        cancelAnimationFrame(raf);
        document.removeEventListener('visibilitychange', sync);
        window.removeEventListener('resize', onResize);
        canvas.remove();
        root.classList.remove('has-nano-field');
      };
    };

    // never compete with first paint or the hero image
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 2500 })
      : window.setTimeout(start, 1200);

    return () => {
      cancelled = true;
      if (window.requestIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      cleanup();
    };
  }, [reduced]);

  return null;
}
