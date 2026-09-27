import { useEffect, useId, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Friendly robot mascot — aluminium shell, glass visor, glowing capsule eyes.
 * `mood`: idle | thinking | speaking
 * `faceOnly` crops to head + antenna and shows a mouth for expression / lip-sync.
 */
const RobotAvatar = ({
  size = 64,
  isOpen = false,
  mood = 'idle',
  faceOnly = false,
  className = '',
}) => {
  const rootRef = useRef(null);
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const antennaRef = useRef(null);
  const antennaDotRef = useRef(null);
  const chestRef = useRef(null);
  const mouthRef = useRef(null);
  const headRef = useRef(null);
  const moodTweensRef = useRef([]);
  const eyesRef = useRef(null);
  const uid = useId().replace(/:/g, '');

  const killMoodTweens = () => {
    moodTweensRef.current.forEach((t) => t.kill());
    moodTweensRef.current = [];
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      gsap.to(root, {
        y: -2,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      const blink = () => {
        gsap
          .timeline()
          .to([leftEyeRef.current, rightEyeRef.current], {
            scaleY: 0.12,
            duration: 0.07,
            transformOrigin: 'center',
          })
          .to([leftEyeRef.current, rightEyeRef.current], {
            scaleY: 1,
            duration: 0.1,
            transformOrigin: 'center',
          });
      };

      const blinkLoop = gsap.delayedCall(2.8 + Math.random() * 2, function repeat() {
        blink();
        blinkLoop.restart(true);
        blinkLoop.delay(2.8 + Math.random() * 3);
      });

      gsap.to(antennaDotRef.current, {
        opacity: 0.3,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to(antennaRef.current, {
        rotation: 6,
        duration: 1.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        transformOrigin: '50% 100%',
      });
    }, root);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    killMoodTweens();

    const left = leftEyeRef.current;
    const right = rightEyeRef.current;
    const mouth = mouthRef.current;
    const head = headRef.current;
    const antennaDot = antennaDotRef.current;

    if (!left || !right) return undefined;

    gsap.set([left, right], { transformOrigin: '50% 50%' });
    if (mouth) gsap.set(mouth, { transformOrigin: '50% 50%' });

    if (mood === 'thinking') {
      // Eyes drift up / inward — “pondering”
      moodTweensRef.current.push(
        gsap.to(left, { x: 1.5, y: -2.5, scaleX: 0.85, duration: 0.35, ease: 'power2.out' }),
        gsap.to(right, { x: -1.5, y: -2.5, scaleX: 0.85, duration: 0.35, ease: 'power2.out' }),
        gsap.to(left, {
          opacity: 0.45,
          duration: 0.55,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }),
      );

      if (head) {
        moodTweensRef.current.push(
          gsap.to(head, {
            rotation: -4,
            duration: 0.4,
            ease: 'power2.out',
            transformOrigin: '50% 80%',
          }),
        );
      }

      if (mouth) {
        moodTweensRef.current.push(
          gsap.to(mouth, {
            scaleY: 0.22,
            scaleX: 1.15,
            y: 0.5,
            duration: 0.25,
            ease: 'power2.out',
          }),
        );
      }

      if (antennaDot) {
        moodTweensRef.current.push(
          gsap.to(antennaDot, {
            opacity: 0.15,
            duration: 0.35,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          }),
        );
      }

      return () => {
        killMoodTweens();
        gsap.set([left, right], { x: 0, y: 0, scaleX: 1, opacity: 1 });
        if (head) gsap.set(head, { rotation: 0 });
        if (mouth) gsap.set(mouth, { scaleY: 0.35, scaleX: 1, y: 0 });
        if (antennaDot) gsap.set(antennaDot, { opacity: 1 });
      };
    }

    if (mood === 'speaking' && mouth) {
      gsap.set([left, right], { x: 0, y: 0, scaleX: 1, opacity: 1 });
      if (head) gsap.set(head, { rotation: 0 });

      const tl = gsap.timeline({ repeat: -1 });
      tl.to(mouth, { scaleY: 1.15, scaleX: 0.9, duration: 0.09, ease: 'power1.out' })
        .to(mouth, { scaleY: 0.28, scaleX: 1.05, duration: 0.08, ease: 'power1.in' })
        .to(mouth, { scaleY: 0.95, scaleX: 0.92, duration: 0.07, ease: 'power1.out' })
        .to(mouth, { scaleY: 0.22, scaleX: 1.1, duration: 0.09, ease: 'power1.in' })
        .to(mouth, { scaleY: 0.8, scaleX: 0.95, duration: 0.06, ease: 'power1.out' })
        .to(mouth, { scaleY: 0.32, scaleX: 1, duration: 0.1, ease: 'power1.in' })
        .to({}, { duration: 0.08 + Math.random() * 0.12 });

      moodTweensRef.current.push(tl);

      // Subtle attentive eye pulse on the primary eye
      moodTweensRef.current.push(
        gsap.to(left, {
          opacity: 0.7,
          duration: 0.25,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }),
      );

      return () => {
        killMoodTweens();
        gsap.set(mouth, { scaleY: 0.35, scaleX: 1 });
        gsap.set(left, { opacity: 1 });
      };
    }

    // idle
    gsap.to([left, right], { x: 0, y: 0, scaleX: 1, opacity: 1, duration: 0.25 });
    if (head) gsap.to(head, { rotation: 0, duration: 0.25 });
    if (mouth) gsap.to(mouth, { scaleY: 0.35, scaleX: 1, y: 0, duration: 0.2 });

    return () => killMoodTweens();
  }, [mood]);

  useEffect(() => {
    if (!chestRef.current) return;
    gsap.to(chestRef.current, {
      fill: isOpen ? '#2997ff' : '#c7c7cc',
      duration: 0.25,
    });
  }, [isOpen]);

  // Eyes glance toward the pointer.
  useEffect(() => {
    const eyes = eyesRef.current;
    const root = rootRef.current;
    if (!eyes || !root || !window.matchMedia('(pointer: fine)').matches) return undefined;
    const onMove = (e) => {
      const r = root.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const reach = Math.min(d / 160, 1);
      gsap.to(eyes, { x: (dx / d) * 2.6 * reach, y: (dy / d) * 1.8 * reach, duration: 0.35, ease: 'power2.out' });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const viewBox = faceOnly ? '6 0 68 50' : '0 0 80 80';
  const aspectH = faceOnly ? size * (50 / 68) : size;

  return (
    <div
      ref={rootRef}
      className={`relative select-none ${className}`}
      style={{ width: size, height: aspectH }}
      aria-hidden
    >
      <svg viewBox={viewBox} width={size} height={aspectH} fill="none">
        <defs>
          <linearGradient id={`${uid}-shell`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.55" stopColor="#ececf0" />
            <stop offset="1" stopColor="#c9c9d1" />
          </linearGradient>
          <linearGradient id={`${uid}-visor`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2c2c34" />
            <stop offset="1" stopColor="#0b0b0f" />
          </linearGradient>
          <linearGradient id={`${uid}-glow`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fdcff" />
            <stop offset="1" stopColor="#2997ff" />
          </linearGradient>
          <filter id={`${uid}-blur`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>

        <g ref={headRef}>
          {/* antenna */}
          <g ref={antennaRef}>
            <line x1="40" y1="12" x2="40" y2="5.5" stroke="#b8b8c0" strokeWidth="2" strokeLinecap="round" />
            <circle ref={antennaDotRef} cx="40" cy="4" r="3" fill={`url(#${uid}-glow)`} />
          </g>

          {/* ears */}
          <rect x="11" y="23" width="5" height="12" rx="2.5" fill="#b8b8c0" />
          <rect x="64" y="23" width="5" height="12" rx="2.5" fill="#b8b8c0" />

          {/* head shell */}
          <rect x="14" y="11" width="52" height="36" rx="15" fill={`url(#${uid}-shell)`} />
          <rect x="14.5" y="11.5" width="51" height="35" rx="14.5" stroke="rgba(0,0,0,0.08)" />
          {/* specular highlight */}
          <path d="M22 15.5c4-2 12-2.5 18-2.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />

          {/* glass visor */}
          <rect x="20" y="17" width="40" height="24" rx="11" fill={`url(#${uid}-visor)`} />
          <path d="M25 20.5c5-1.6 17-1.8 26-0.6" stroke="rgba(255,255,255,0.14)" strokeWidth="1.4" strokeLinecap="round" />

          <g ref={eyesRef}>
            {/* glow */}
            <rect x="28" y="23" width="6" height="10" rx="3" fill="#2997ff" filter={`url(#${uid}-blur)`} opacity="0.8" />
            <rect x="46" y="23" width="6" height="10" rx="3" fill="#2997ff" filter={`url(#${uid}-blur)`} opacity="0.8" />
            <rect ref={leftEyeRef} x="28" y="23" width="6" height="10" rx="3" fill={`url(#${uid}-glow)`} />
            <rect ref={rightEyeRef} x="46" y="23" width="6" height="10" rx="3" fill={`url(#${uid}-glow)`} />
          </g>

          {faceOnly && (
            <rect ref={mouthRef} x="36" y="35" width="8" height="3" rx="1.5" fill={`url(#${uid}-glow)`} />
          )}
        </g>

        {!faceOnly && (
          <>
            <rect x="24" y="51" width="32" height="23" rx="11" fill={`url(#${uid}-shell)`} />
            <rect x="24.5" y="51.5" width="31" height="22" rx="10.5" stroke="rgba(0,0,0,0.08)" />
            <circle ref={chestRef} cx="40" cy="62.5" r="3.5" fill={isOpen ? '#2997ff' : '#c7c7cc'} />
          </>
        )}
      </svg>
    </div>
  );
};

export default RobotAvatar;
