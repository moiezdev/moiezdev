import { useEffect, useRef } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const clamp01 = (v) => Math.min(1, Math.max(0, v));

/**
 * Calls `onFrame(element, viewportHeight)` once per animation frame while the
 * page scrolls or resizes. Callers write styles directly, so scroll-linked
 * motion never triggers React re-renders. Skipped when reduced motion is on.
 */
export function useScrollFrame(ref, onFrame) {
  const cb = useRef(onFrame);
  cb.current = onFrame;

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;
    let raf = 0;
    const run = () => {
      raf = 0;
      cb.current(el, window.innerHeight);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    run();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ref]);
}
