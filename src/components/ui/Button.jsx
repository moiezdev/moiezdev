import { forwardRef, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Magnetic from './Magnetic';

const Button = forwardRef(function Button(
  {
    children,
    onClick,
    className = '',
    primary = false,
    type = 'button',
    disabled = false,
    ...rest
  },
  ref
) {
  const localRef = useRef(null);
  const overlayRef = useRef(null);

  const setRefs = (node) => {
    localRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  useEffect(() => {
    const btn = localRef.current;
    const overlay = overlayRef.current;
    if (!btn || !overlay || disabled) return undefined;

    const handleMouseEnter = () => {
      gsap.to(overlay, {
        x: '0%',
        duration: 0.4,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(overlay, {
        x: '-100%',
        duration: 0.4,
        ease: 'power2.inOut',
      });
    };

    btn.addEventListener('mouseenter', handleMouseEnter);
    btn.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      btn.removeEventListener('mouseenter', handleMouseEnter);
      btn.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [disabled]);

  return (
    <Magnetic strength={0.2}>
      <button
        ref={setRefs}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`cursor-pointer cursor-scale-0 relative overflow-hidden px-4 py-2 border disabled:opacity-40 disabled:cursor-not-allowed ${
          primary ? 'border-primary text-white' : 'border-gray-a text-gray-a'
        } transition ${className} flex items-center justify-center`}
        {...rest}
      >
        <span
          ref={overlayRef}
          className={`absolute top-0 left-0 w-full h-full ${
            primary ? 'bg-primary/10' : 'bg-gray-a/20'
          } -translate-x-full pointer-events-none`}
          style={{ zIndex: 0 }}
        />
        <span className="relative z-10 inline-flex items-center justify-center gap-1">
          {children}
        </span>
      </button>
    </Magnetic>
  );
});

export default Button;
