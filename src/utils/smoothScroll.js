import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

let lenis = null;

/**
 * Inertial page scrolling (wheel and trackpad; touch keeps native momentum).
 * Pauses while a dialog locks the body, and stays off for reduced motion.
 * Returns a cleanup function.
 */
export function startSmoothScroll() {
  if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => 1 - Math.pow(1 - t, 4),
    wheelMultiplier: 1,
    allowNestedScroll: true, // chat, palette, textareas, code blocks keep their own scroll
    anchors: { offset: -64 },
    autoRaf: true,
  });

  // dialogs lock scrolling with body overflow: hidden, so follow that
  const sync = () => (document.body.style.overflow === 'hidden' ? lenis.stop() : lenis.start());
  const observer = new MutationObserver(sync);
  observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
  sync();

  return () => {
    observer.disconnect();
    lenis?.destroy();
    lenis = null;
  };
}

/** Scroll to an element or position, smoothly when Lenis is running. */
export function scrollToTarget(target, { immediate = false, offset = 0 } = {}) {
  if (lenis) return lenis.scrollTo(target, { immediate, offset, force: true });
  if (typeof target === 'number') return window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' });
  target?.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' });
}
