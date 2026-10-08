import { flushSync } from 'react-dom';
import { prefersReducedMotion } from './reducedMotion';

/** View Transitions are used when supported and motion is allowed; otherwise updates are instant. */
export const canViewTransition = () =>
  typeof document !== 'undefined' && typeof document.startViewTransition === 'function' && !prefersReducedMotion();

/**
 * Runs a synchronous DOM/React update inside a view transition (flushSync makes
 * React commit inside the callback). `types` sets data attributes on <html> for
 * the duration so CSS can pick the right animation. Returns the transition or null.
 */
export function withViewTransition(update, { type } = {}) {
  if (!canViewTransition()) {
    update();
    return null;
  }
  const root = document.documentElement;
  if (type) root.dataset.vt = type;
  const vt = document.startViewTransition(() => flushSync(update));
  vt.finished.finally(() => {
    if (type && root.dataset.vt === type) delete root.dataset.vt;
  });
  return vt;
}
