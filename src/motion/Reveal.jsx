import { useLayoutEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './reducedMotion';

/**
 * Short fade + rise (--dur-base, --reveal-distance) the first time a section
 * heading or card group scrolls in.
 *
 * Content is visible by default — in the prerendered HTML, without JavaScript,
 * with reduced motion, and for anything already on screen at load. Only blocks
 * still below the fold are hidden after mount, and only while an
 * IntersectionObserver is watching them; they reveal once ~10% of the viewport
 * is past their top (or before printing, whichever comes first).
 */
const Reveal = ({ as = 'div', delay = 0, className = '', style, children, ...rest }) => {
  const Tag = as;
  const ref = useRef(null);
  const [state, setState] = useState('static'); // static | hidden | shown

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return undefined;
    if (el.getBoundingClientRect().top < window.innerHeight) return undefined; // any part on screen: never hide

    setState('hidden');
    const show = () => setState('shown');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(el);
    window.addEventListener('beforeprint', show);
    return () => {
      observer.disconnect();
      window.removeEventListener('beforeprint', show);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${state === 'hidden' ? 'reveal-hidden' : state === 'shown' ? 'reveal-shown' : ''} ${className}`}
      style={{ '--reveal-delay': `${Math.min(delay, 160)}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
