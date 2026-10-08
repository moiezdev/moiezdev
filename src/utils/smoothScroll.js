import { prefersReducedMotion } from '../motion/reducedMotion';

/**
 * Native scrolling only (no scroll-jacking). Smooth unless `immediate` or the
 * visitor prefers reduced motion; elements land below the fixed header via
 * their scroll-margin-top.
 */
export function scrollToTarget(target, { immediate = false } = {}) {
  const behavior = immediate || prefersReducedMotion() ? 'instant' : 'smooth';
  if (typeof target === 'number') return window.scrollTo({ top: target, left: 0, behavior });
  target?.scrollIntoView({ behavior, block: 'start' });
}
