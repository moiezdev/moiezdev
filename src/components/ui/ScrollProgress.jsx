import { useRef } from 'react';
import { clamp01, useScrollFrame } from '../../hooks/useScrollFrame';

/**
 * Thin reading-progress bar under the header (scaleX, written once per frame;
 * grows from the right in RTL). With reduced motion it isn't driven at all.
 */
export default function ScrollProgress() {
  const ref = useRef(null);
  useScrollFrame(ref, (el) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    el.style.transform = `scaleX(${max > 0 ? clamp01(window.scrollY / max) : 0})`;
  });
  return <div ref={ref} className="scroll-progress" aria-hidden />;
}
