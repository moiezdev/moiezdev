import { useEffect, useId, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Friendly robot mascot — one rounded head: pearl shell, dark glass visor,
 * glowing mint eyes, a small smile and a glowing antenna tip.
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
        if (mouth) gsap.set(mouth, { scaleY: 1, scaleX: 1, y: 0 });
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
        gsap.set(mouth, { scaleY: 1, scaleX: 1 });
        gsap.set(left, { opacity: 1 });
      };
    }

    // idle
    gsap.to([left, right], { x: 0, y: 0, scaleX: 1, opacity: 1, duration: 0.25 });
    if (head) gsap.to(head, { rotation: 0, duration: 0.25 });
    if (mouth) gsap.to(mouth, { scaleY: 1, scaleX: 1, y: 0, duration: 0.2 });

    return () => killMoodTweens();
  }, [mood]);

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

  // one head for both sizes; the panel header (faceOnly) just drops the floor shadow
  const viewBox = '4 0 72 68';
  const aspectH = size * (68 / 72);
  const id = (name) => `${uid}-${name}`;

  return (
    <div
      ref={rootRef}
      className={`relative select-none ${className}`}
      data-open={isOpen || undefined}
      style={{ width: size, height: aspectH }}
      aria-hidden
    >
      <svg viewBox={viewBox} width={size} height={aspectH} fill="none">
        <defs>
          <radialGradient id={id('shell')} cx="0.34" cy="0.22" r="0.95">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.55" stopColor="#e8eaef" />
            <stop offset="1" stopColor="#aeb4c0" />
          </radialGradient>
          <radialGradient id={id('pod')} cx="0.35" cy="0.3" r="0.9">
            <stop offset="0" stopColor="#f4f5f8" />
            <stop offset="1" stopColor="#9ea5b2" />
          </radialGradient>
          <linearGradient id={id('visor')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#22252e" />
            <stop offset="1" stopColor="#05060a" />
          </linearGradient>
          <linearGradient id={id('glow')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e6fff8" />
            <stop offset="1" stopColor="#56e0c2" />
          </linearGradient>
          <filter id={id('blur')} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <filter id={id('shadow')} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        {!faceOnly && <ellipse cx="40" cy="64" rx="20" ry="2.6" fill="#000" opacity="0.3" filter={`url(#${id('shadow')})`} />}

        <g ref={headRef}>
          {/* antenna with a glowing tip */}
          <g ref={antennaRef}>
            <line x1="40" y1="15" x2="40" y2="8" stroke="#c3c7cf" strokeWidth="2.2" strokeLinecap="round" />
            <g ref={antennaDotRef}>
              <circle cx="40" cy="6" r="4.5" fill="#56e0c2" opacity="0.6" filter={`url(#${id('blur')})`} />
              <circle cx="40" cy="6" r="3" fill={`url(#${id('glow')})`} />
            </g>
          </g>

          {/* side pods */}
          <circle cx="11.5" cy="38" r="5.5" fill={`url(#${id('pod')})`} />
          <circle cx="68.5" cy="38" r="5.5" fill={`url(#${id('pod')})`} />

          {/* shell: soft light from the top-left, a bright rim */}
          <rect x="12" y="14" width="56" height="48" rx="22" fill={`url(#${id('shell')})`} />
          <rect x="12.6" y="14.6" width="54.8" height="46.8" rx="21.4" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" opacity="0.7" />

          {/* glass visor with a reflection */}
          <rect x="18" y="22" width="44" height="29" rx="14.5" fill={`url(#${id('visor')})`} />
          <rect x="18.5" y="22.5" width="43" height="28" rx="14" stroke="rgba(255,255,255,0.08)" />
          <path d="M24 28.5c4.5-3.4 15-4.6 24-3" stroke="rgba(255,255,255,0.22)" strokeWidth="1.6" strokeLinecap="round" />

          <g ref={eyesRef}>
            <rect x="27.5" y="29.5" width="7" height="12" rx="3.5" fill="#56e0c2" opacity="0.75" filter={`url(#${id('blur')})`} />
            <rect x="45.5" y="29.5" width="7" height="12" rx="3.5" fill="#56e0c2" opacity="0.75" filter={`url(#${id('blur')})`} />
            <rect ref={leftEyeRef} x="27.5" y="29.5" width="7" height="12" rx="3.5" fill={`url(#${id('glow')})`} />
            <rect ref={rightEyeRef} x="45.5" y="29.5" width="7" height="12" rx="3.5" fill={`url(#${id('glow')})`} />
          </g>

          {/* smile — flattens while thinking, moves while speaking */}
          <path ref={mouthRef} d="M36.5 45.2q3.5 2.2 7 0" stroke="#7debd2" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

export default RobotAvatar;
