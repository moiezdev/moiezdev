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

const SHARED = 'shared-hero';
const resolveEl = (x) => (typeof x === 'string' ? document.querySelector(x) : x);

/**
 * Resolves once <main data-path> shows `path` (the router has committed the new
 * page), or after `timeout`. React Router commits navigations as React
 * transitions, so flushSync can't force them; we wait for the DOM instead.
 * (rAF doesn't run while a view transition's update is pending, hence the observer.)
 */
function pageCommitted(path, timeout = 1000) {
  const main = document.getElementById('main');
  const done = () => main?.dataset.path === path;
  if (!main || done()) return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      mo.disconnect();
      clearTimeout(timer);
      resolve();
    };
    const mo = new MutationObserver(() => done() && finish());
    mo.observe(main, { attributes: true, attributeFilter: ['data-path'] });
    const timer = setTimeout(finish, timeout);
  });
}

/**
 * Page navigation inside a view transition, with an optional shared element:
 * `from` (element or selector, on the current page) morphs into `toSelector`
 * (looked up on the new page). Names exist only for this transition, so pages
 * that show a project twice never end up with duplicate names. `preload` must
 * resolve once the target page's code is loaded (so no Suspense fallback is
 * captured).
 */
export async function navigateWithTransition(navigate, to, { preload, from, toSelector } = {}) {
  if (!canViewTransition()) {
    navigate(to);
    return;
  }
  await preload?.();
  const path = new URL(to, window.location.href).pathname;
  const source = from ? resolveEl(from) : null;
  if (source) source.style.viewTransitionName = SHARED;
  document.documentElement.dataset.vt = 'page';
  let target = null;
  const vt = document.startViewTransition(async () => {
    if (source) source.style.viewTransitionName = '';
    navigate(to);
    await pageCommitted(path);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    target = source && toSelector ? document.querySelector(toSelector) : null;
    if (target) target.style.viewTransitionName = SHARED;
  });
  vt.finished.finally(() => {
    if (target) target.style.viewTransitionName = '';
    if (document.documentElement.dataset.vt === 'page') delete document.documentElement.dataset.vt;
  });
}
