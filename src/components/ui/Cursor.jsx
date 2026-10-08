import { useEffect, useRef } from 'react';

const INTERACTIVE = 'a, button, [role="button"], label[for], select, summary, [data-cursor]';
const TEXT_INPUT = 'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';
// inside these (the chat panel) the native pointer is used and the custom one hides
const NATIVE = '[data-native-cursor]';

const lerp = (a, b, t) => a + (b - a) * t;

/**
 * iPadOS-style adaptive pointer.
 * - A dot tracks the mouse; a soft ring trails behind it.
 * - Over buttons and links the ring morphs into the element's own shape and
 *   the element leans slightly toward the pointer.
 * - Elements with `data-cursor-label` turn the ring into a labelled bubble.
 * - The chat panel ([data-native-cursor]) and text fields use the native pointer.
 * Disabled on touch devices and when the user prefers reduced motion; the loop
 * stops while the tab is hidden.
 */
const Cursor = () => {
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduce.matches) return undefined;

    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    const root = document.documentElement;
    root.classList.add('has-custom-cursor');

    const mouse = { x: -100, y: -100 };
    const pos = { x: -100, y: -100, w: 36, h: 36 };
    let target = null; // { el, mode: 'shape' | 'label' }
    let hidden = true;
    let pressed = false;
    let caretH = 22;
    let raf = 0;

    const setVisible = (v) => {
      if (hidden === !v) return;
      hidden = !v;
      ring.style.opacity = v ? '1' : '0';
      dot.style.opacity = v && (!target || target.mode === 'none') ? '1' : '0';
    };

    const release = () => {
      if (target?.el && target.mode === 'shape' && target.lean) target.el.style.translate = '';
      target = null;
      ring.dataset.mode = 'default';
      ring.style.borderRadius = '999px';
      label.textContent = '';
      dot.style.opacity = hidden ? '0' : '1';
    };

    const resolve = (el) => {
      if (!el || !(el instanceof Element)) return release();
      if (el.closest(NATIVE)) {
        // chat panel: hand over to the native pointer
        release();
        ring.dataset.mode = 'native';
        dot.style.opacity = '0';
        return undefined;
      }
      const field = el.closest(TEXT_INPUT);
      if (field) {
        // text fields: the ring becomes an iPad-style caret sized to the field's text
        release();
        ring.dataset.mode = 'text';
        ring.style.borderRadius = '2px';
        caretH = Math.round(Math.min(Math.max((parseFloat(getComputedStyle(field).fontSize) || 16) * 1.35, 18), 34));
        dot.style.opacity = '0';
        return undefined;
      }
      const hit = el.closest(INTERACTIVE);
      if (!hit || hit.hasAttribute('disabled')) return release();
      if (target?.el === hit) return undefined;
      release();

      const text = hit.getAttribute('data-cursor-label');
      if (text) {
        target = { el: hit, mode: 'label' };
        ring.dataset.mode = 'label';
        label.textContent = text;
        dot.style.opacity = '0';
        return undefined;
      }

      const rect = hit.getBoundingClientRect();
      if (rect.width > 420 || rect.height > 140) {
        ring.dataset.mode = 'hover';
        target = { el: hit, mode: 'hover' };
        return undefined;
      }
      const lean = getComputedStyle(hit).translate === 'none';
      target = { el: hit, mode: 'shape', lean };
      ring.dataset.mode = 'shape';
      const radius = parseFloat(getComputedStyle(hit).borderTopLeftRadius) || 10;
      ring.style.borderRadius = `${Math.min(radius + 4, 999)}px`;
      dot.style.opacity = '0';
      return undefined;
    };

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      setVisible(true);
    };
    const onOver = (e) => resolve(e.target);
    const onDown = () => {
      pressed = true;
    };
    const onUp = () => {
      pressed = false;
    };
    const onLeave = () => setVisible(false);
    const onScroll = () => resolve(document.elementFromPoint(mouse.x, mouse.y));

    const tick = () => {
      let tx = mouse.x;
      let ty = mouse.y;
      let tw = 36;
      let th = 36;

      if (target?.el && !target.el.isConnected) release();

      if (target?.mode === 'shape') {
        const r = target.el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = mouse.x - cx;
        const dy = mouse.y - cy;
        // element leans toward the pointer, ring follows a bit further
        if (target.lean) target.el.style.translate = `${dx * 0.12}px ${dy * 0.18}px`;
        tx = cx + dx * 0.2;
        ty = cy + dy * 0.25;
        tw = r.width + 14;
        th = r.height + 10;
      } else if (target?.mode === 'label') {
        tw = 76;
        th = 76;
      } else if (target?.mode === 'hover') {
        tw = 52;
        th = 52;
      } else if (ring.dataset.mode === 'text') {
        tw = 2;
        th = caretH;
      }

      if (pressed) {
        tw *= 0.9;
        th *= 0.9;
      }

      if (ring.dataset.mode === 'text') {
        // a caret is a precise tool: snap to it and sit exactly on the pointer
        pos.x = tx;
        pos.y = ty;
        pos.w = tw;
        pos.h = th;
      } else {
        const k = target?.mode === 'shape' ? 0.28 : 0.2;
        pos.x = lerp(pos.x, tx, k);
        pos.y = lerp(pos.y, ty, k);
        pos.w = lerp(pos.w, tw, 0.25);
        pos.h = lerp(pos.h, th, 0.25);
      }

      ring.style.width = `${pos.w}px`;
      ring.style.height = `${pos.h}px`;
      ring.style.transform = `translate3d(${pos.x - pos.w / 2}px, ${pos.y - pos.h / 2}px, 0)`;
      dot.style.transform = `translate3d(${mouse.x - 3}px, ${mouse.y - 3}px, 0) scale(${pressed ? 0.6 : 1})`;
      // stop while the tab is hidden; resumes on visibilitychange
      raf = document.visibilityState === 'hidden' ? 0 : requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden' && !raf) raf = requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', onVisibility);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseover', onOver);
    document.documentElement.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      release();
      root.classList.remove('has-custom-cursor');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseover', onOver);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" data-mode="default" aria-hidden>
        <span ref={labelRef} className="cursor-label" />
      </div>
      <div ref={dotRef} className="cursor-dot" aria-hidden />
    </>
  );
};

export default Cursor;
