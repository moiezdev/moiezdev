import { useEffect } from 'react';
import { usePrefersReducedMotion } from '../../motion/reducedMotion';

/**
 * The nano swarm behind the hero (see src/motion/nanoSwarm.js and MOTION.md).
 *
 * Renders nothing itself: once the browser is idle it loads the engine and puts
 * one canvas at the back of `[data-hero]`, anchored to the portrait, so the hero
 * layout stays untouched. It runs only while the hero is on screen and the tab
 * is visible; with reduced motion it draws one still formation.
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

      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.className = 'hero-swarm';
      hero.prepend(canvas);

      const root = document.documentElement;
      // the portrait's frame (the <img> sits inside a <picture>)
      const portrait = () => hero.querySelector('img')?.closest('div');
      const anchor = () => {
        const h = hero.getBoundingClientRect();
        const p = portrait()?.getBoundingClientRect();
        const rtl = root.dir === 'rtl';
        if (!p || !p.width) return { x: rtl ? h.width * 0.2 : h.width * 0.8, y: h.height * 0.4, size: 150 };
        if (window.innerWidth >= 1024) {
          // rises from behind the portrait's lower edge into the empty space below it,
          // clear of the copy; it lags the page a little as you scroll
          // (parallax on the swarm only, never on text)
          const x = p.left - h.left + p.width * (rtl ? 0.38 : 0.62);
          return { x, y: p.bottom - h.top + 55 + Math.max(0, -h.top) * 0.35, size: p.width * 0.36 };
        }
        // phones: a halo around the round avatar
        return { x: p.left - h.left + p.width / 2, y: p.top - h.top + p.height / 2, size: p.width * 0.78 };
      };
      const theme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');
      // scroll state, sampled once per frame by the loop below
      const sc = { progress: 0, speed: 0, y: window.scrollY };
      const readScroll = (dt) => {
        const h = hero.getBoundingClientRect();
        sc.progress = Math.min(1, Math.max(0, -h.top / Math.max(1, h.height)));
        const y = window.scrollY;
        if (dt) sc.speed += ((y - sc.y) / dt - sc.speed) * Math.min(1, dt * 6);
        sc.y = y;
      };
      const swarm = createNanoSwarm(canvas, { anchor, theme, scroll: () => sc });

      const ro = new ResizeObserver(() => {
        swarm.resize();
        if (reduced) swarm.still();
      });
      ro.observe(hero);

      if (reduced) {
        readScroll(0);
        swarm.still();
        // repaint the still frame when the theme or language flips
        const mo = new MutationObserver(() => swarm.still());
        mo.observe(root, { attributes: true, attributeFilter: ['data-theme', 'dir'] });
        cleanup = () => {
          ro.disconnect();
          mo.disconnect();
          canvas.remove();
        };
        return;
      }

      let raf = 0;
      let last = 0;
      let t = 0;
      let onScreen = false;
      const loop = (now) => {
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        t += dt;
        readScroll(dt);
        swarm.step(t, dt);
        raf = requestAnimationFrame(loop);
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
      const io = new IntersectionObserver(([e]) => {
        onScreen = e.isIntersecting;
        sync();
      });
      io.observe(hero);
      document.addEventListener('visibilitychange', sync);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener('visibilitychange', sync);
        canvas.remove();
      };
    };

    // never compete with first paint or the hero image
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 2500 })
      : window.setTimeout(start, 1200);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      cleanup();
    };
  }, [reduced]);

  return null;
}
