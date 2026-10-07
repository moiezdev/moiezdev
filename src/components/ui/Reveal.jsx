import { useLayoutEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../hooks/useScrollFrame';

/**
 * Fades and lifts its children in when they scroll into view.
 *
 * Content is visible by default (prerendered HTML, no JS, reduced motion, and
 * anything already on screen when the page loads). Only elements still below
 * the fold get hidden, and they reveal once ~12% of the viewport is past them.
 */
const Reveal = ({ as = 'div', delay = 0, className = '', style, children, ...rest }) => {
  const Tag = as;
  const ref = useRef(null);
  const [state, setState] = useState('static'); // static | hidden | shown

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return undefined;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.88) return undefined;

    setState('hidden');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('shown');
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${state === 'hidden' ? 'reveal-hidden' : state === 'shown' ? 'reveal-shown' : ''} ${className}`}
      style={{ '--reveal-delay': `${Math.min(delay, 240) / 2}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
