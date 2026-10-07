import { useEffect, useRef } from 'react';

/**
 * MoizDev mark — a Λ and a stroke that read as an "M", drawn with one even,
 * round-capped line weight. Colour follows the theme accent by default.
 * `animate` draws the strokes in once.
 */
const Logo = ({ color = 'var(--color-primary)', size = 32, animate = false, duration = 1.2, className = '' }) => {
  const pathsRef = useRef([]);

  useEffect(() => {
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    // Web Animations API: no animation library in the main bundle for this
    const animations = pathsRef.current.filter(Boolean).map((path, i) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      return path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
        duration: duration * 1000,
        delay: i * 150,
        easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
        fill: 'backwards',
      });
    });
    return () => animations.forEach((a) => a.cancel());
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
