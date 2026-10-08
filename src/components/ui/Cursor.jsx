import { useEffect, useRef } from 'react';

const INTERACTIVE = 'a, button, [role="button"], label[for], select, summary';
const NATIVE = 'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"], [data-native-cursor]';
const TEXT = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, dd, dt, figcaption, td, th, pre, code';

const RING = 36; // px, unscaled diameter
const TRAIL_MS = 16; // ring time constant: lags ~16ms in steady motion; ~95% caught up after 50ms
const SCALE = { default: 1, hidden: 1, link: 1.4, label: 2.4 };

/**
 * Custom pointer for fine pointers only.
 * - The dot sits exactly on the pointer (written every frame, no smoothing).
 * - A hairline ring trails it by at most ~80ms, frame-rate independent.
 * - States: text → dot only; links/buttons → ring ×1.4; elements with
 *   `data-cursor-label` (project cards, case-study images) → larger ring with
 *   the label; inputs, textareas and anything inside `[data-native-cursor]`
 *   (the chat panel) → custom cursor hidden, native cursor shown.
 * - Off on touch/coarse pointers and with reduced motion; the native cursor is
 *   only hidden while this one is active. The rAF loop idles when the ring has
 *   settled and stops while the tab is hidden.
 */
const Cursor = () => {
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    const root = document.documentElement;

    const mouse = { x: 0, y: 0 };
    const pos = { x: 0, y: 0, s: 1 };
    let mode = 'default'; // default | text | link | label | native
    let seen = false;
    let raf = 0;
    let last = 0;
    let enabled = false;

    const paint = (now) => {
      raf = 0;
      const dt = last ? Math.min(now - last, 64) : 16;
      last = now;
      const k = 1 - Math.exp(-dt / TRAIL_MS);
      pos.x += (mouse.x - pos.x) * k;
      pos.y += (mouse.y - pos.y) * k;
      const target = SCALE[mode] ?? 1;
      pos.s += (target - pos.s) * (1 - Math.exp(-dt / 60));

      dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
      ring.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${pos.s})`;
      label.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;

      const settled = Math.abs(mouse.x - pos.x) < 0.1 && Math.abs(mouse.y - pos.y) < 0.1 && Math.abs(target - pos.s) < 0.002;
      if (!settled && document.visibilityState !== 'hidden') raf = requestAnimationFrame(paint);
      else last = 0;
    };
    const wake = () => {
      if (!raf && enabled && document.visibilityState !== 'hidden') raf = requestAnimationFrame(paint);
    };

    const show = () => {
      const custom = seen && mode !== 'native';
      root.classList.toggle('has-custom-cursor', custom);
      dot.style.opacity = custom ? '1' : '0';
      ring.style.opacity = custom && mode !== 'text' ? '1' : '0';
      label.style.opacity = custom && mode === 'label' ? '1' : '0';
    };

    const resolve = (el) => {
      let next = 'default';
      let text = '';
      if (el instanceof Element) {
        const labelled = el.closest('[data-cursor-label]');
        if (el.closest(NATIVE)) next = 'native';
        else if (labelled) {
          next = 'label';
          text = labelled.getAttribute('data-cursor-label');
        } else if (el.closest(INTERACTIVE)) next = 'link';
        else if (el.closest(TEXT)) next = 'text';
      }
      if (next === mode && text === label.textContent) return;
      mode = next;
      label.textContent = text;
      show();
      wake();
    };

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!seen) {
        seen = true;
        pos.x = mouse.x;
        pos.y = mouse.y;
        resolve(e.target);
        show();
      }
      wake();
    };
    const onOver = (e) => resolve(e.target);
    const onLeave = () => {
      seen = false;
      show();
    };
    const onScroll = () => seen && resolve(document.elementFromPoint(mouse.x, mouse.y));
    const onVisibility = () => (document.visibilityState === 'hidden' ? cancelAnimationFrame(raf) || (raf = 0) : wake());

    const enable = () => {
      if (enabled) return;
      enabled = true;
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      document.addEventListener('mouseover', onOver);
      root.addEventListener('mouseleave', onLeave);
      document.addEventListener('visibilitychange', onVisibility);
    };
    const disable = () => {
      if (!enabled) return;
      enabled = false;
      seen = false;
      cancelAnimationFrame(raf);
      raf = 0;
      show(); // removes has-custom-cursor: native cursor back
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseover', onOver);
      root.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    const sync = () => (fine.matches && !reduce.matches ? enable() : disable());

    sync();
    fine.addEventListener('change', sync);
    reduce.addEventListener('change', sync);
    return () => {
      fine.removeEventListener('change', sync);
      reduce.removeEventListener('change', sync);
      disable();
    };
  }, []);

  return (
    <>
      <svg ref={ringRef} className="cursor-ring" width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} aria-hidden>
        <circle cx={RING / 2} cy={RING / 2} r={RING / 2 - 1} />
      </svg>
      <span ref={labelRef} className="cursor-label" aria-hidden />
      <span ref={dotRef} className="cursor-dot" aria-hidden />
    </>
  );
};

export default Cursor;
