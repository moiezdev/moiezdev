import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * MoizDev mark — a Λ and a stroke that read as an "M", drawn with one even,
 * round-capped line weight. Colour follows the theme accent by default.
 * `animate` draws the strokes in once.
 */
const Logo = ({ color = 'var(--color-primary)', size = 32, animate = false, duration = 1.2, className = '' }) => {
  const pathsRef = useRef([]);

  useEffect(() => {
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const paths = pathsRef.current.filter(Boolean);
    const ctx = gsap.context(() => {
      paths.forEach((path, i) => {
        const length = path.getTotalLength();
        gsap.fromTo(
          path,
          { strokeDasharray: length, strokeDashoffset: length },
          { strokeDashoffset: 0, duration, delay: i * 0.15, ease: 'power2.out' },
        );
      });
    });
    return () => ctx.revert();
  }, [animate, duration]);

  return (
    <svg
      className={className}
      width={size}
      height={size * 0.6}
      viewBox="8 8 80 48"
      fill="none"
      aria-hidden
    >
      <g stroke={color} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
        <path ref={(el) => (pathsRef.current[0] = el)} d="M14 50 38 14 62 50" />
        <path ref={(el) => (pathsRef.current[1] = el)} d="M58 14 82 50" />
      </g>
    </svg>
  );
};

export default Logo;
