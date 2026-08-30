import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const Logo = ({
  color = 'var(--color-primary)',
  hoverColor = 'var(--color-primary)',
  size = 1,
  animate = false,
  duration = 2,
  floatDuration = 2,
  simple = false,
  staticLogo = false, // new prop
  className,
}) => {
  const pathRefs = useRef([]);
  const groupRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (staticLogo || simple) return; // ⛔ Skip animation if static

    if (!animate) return;

    // Draw animation
    pathRefs.current.forEach((path) => {
      const length = path.getTotalLength();

      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
        stroke: color,
        fill: 'none',
      });

      gsap.to(path, {
        strokeDashoffset: 0,
        duration,
        ease: 'power2.out',
      });
    });

    // Floating effect
    gsap.to(groupRef.current, {
      y: '+=8',
      duration: floatDuration,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: duration,
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [animate, color, duration, floatDuration, simple, staticLogo]);

  // Animate stroke → fill on hover
  useEffect(() => {
    if (!pathRefs.current.length || staticLogo || simple) return; // ⛔ Skip hover if static

    if (hovered) {
      pathRefs.current.forEach((path) => {
        gsap.to(path, {
          fill: hoverColor,
          stroke: 'none',
          duration: 0,
          ease: 'power2.out',
        });
      });
    } else {
      pathRefs.current.forEach((path) => {
        gsap.to(path, {
          fill: 'none',
          stroke: color,
          duration: 0,
          ease: 'power2.inOut',
        });
      });
    }
  }, [hovered, hoverColor, color, staticLogo, simple]);

  return (
    <svg
      ref={groupRef}
      className={`overflow-visible ${className}`}
      width={1 * size}
      height={0.51 * size}
      viewBox="0 0 115 59"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => !staticLogo && setHovered(true)}
      onMouseLeave={() => !staticLogo && setHovered(false)}
    >
      <path
        ref={(el) => (pathRefs.current[0] = el)}
        d="M78.6874 0.971741H75.1778C71.9043 0.971741 68.8381 2.57389 66.9687 5.2611L63.8205 9.78672C62.8168 11.2295 62.8725 13.1583 63.9576 14.5408L96.6139 56.1439C97.3722 57.11 98.5322 57.6741 99.7603 57.6741H103.547C108.084 57.6741 112.053 54.6192 113.214 50.2329L113.776 48.1104C114.55 45.1851 113.958 42.0666 112.166 39.6285L86.7445 5.04865C84.8602 2.48544 81.8687 0.971741 78.6874 0.971741Z"
        fill={staticLogo ? color : 'none'}
        stroke={staticLogo ? 'none' : color}
        className="logo-path"
      />
      <path
        ref={(el) => (pathRefs.current[1] = el)}
        d="M47.3561 27.8583L68.111 55.1661C69.593 57.1159 71.8864 58.2795 74.3352 58.3239L75.8508 58.3514C82.5446 58.4728 86.4176 50.8088 82.3495 45.4916L50.6898 4.11064C49.1761 2.13217 46.8271 0.971741 44.336 0.971741H36.7573C34.2816 0.971741 31.9454 2.11789 30.4304 4.07577L2.86611 39.6961C1.09575 41.9839 0.698346 45.0492 1.82678 47.7128L4.07235 53.0133C5.26934 55.8387 8.04025 57.6741 11.1088 57.6741C13.6986 57.6741 16.1122 56.3624 17.521 54.1893L34.2742 28.3473C37.2886 23.6975 44.003 23.4465 47.3561 27.8583Z"
        fill={staticLogo ? color : 'none'}
        stroke={staticLogo ? 'none' : color}
        className="logo-path"
      />
    </svg>
  );
};

export default Logo;
