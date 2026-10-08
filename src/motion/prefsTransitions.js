import { withViewTransition } from './viewTransition';

/**
 * Theme change as a circular reveal from `origin` (the toggle button, or the
 * screen centre): the new theme's snapshot is clipped to a growing circle
 * (clip-path on the View Transition snapshot only — the agreed exception to
 * transform/opacity — 400ms). Instant with reduced motion or no support.
 */
export function transitionTheme(update, origin) {
  const r = origin?.getBoundingClientRect?.();
  const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
  const y = r ? r.top + r.height / 2 : window.innerHeight / 2;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const root = document.documentElement.style;
  root.setProperty('--vt-x', `${x}px`);
  root.setProperty('--vt-y', `${y}px`);
  root.setProperty('--vt-r', `${radius}px`);
  withViewTransition(update, { type: 'theme' });
}

/** Language switch: a quick crossfade hides the direction flip (no visible jump). */
export function transitionLang(update) {
  withViewTransition(update, { type: 'lang' });
}
