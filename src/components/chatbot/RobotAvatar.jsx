import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Geometric robot mascot — charcoal + gray borders, one primary (yellow) eye.
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

  const killMoodTweens = () => {
    moodTweensRef.current.forEach((t) => t.kill());
    moodTweensRef.current = [];
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      gsap.to(root, {
        y: -5,
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
      fill: isOpen ? '#ffff00' : '#abb2bf',
      duration: 0.25,
    });
  }, [isOpen]);

  const viewBox = faceOnly ? '0 0 80 48' : '0 0 80 80';
  const aspectH = faceOnly ? size * 0.6 : size;

  return (
    <div
      ref={rootRef}
      className={`relative select-none ${className}`}
      style={{ width: size, height: aspectH }}
      aria-hidden
    >
      <svg viewBox={viewBox} width={size} height={aspectH} fill="none">
        <g ref={headRef}>
          {/* antenna */}
          <g ref={antennaRef}>
            <line x1="40" y1="12" x2="40" y2="3" stroke="#abb2bf" strokeWidth="1.5" />
            <rect ref={antennaDotRef} x="37" y="0" width="6" height="6" fill="#ffff00" />
          </g>

          {/* head */}
          <rect
            x="20"
            y="12"
            width="40"
            height={faceOnly ? 32 : 30}
            fill="#282c33"
            stroke="#abb2bf"
            strokeWidth="1.5"
          />
          {/* visor strip */}
          <rect
            x="24"
            y="18"
            width="32"
            height="16"
            fill="#1a1d22"
            stroke="#abb2bf"
            strokeWidth="1"
          />

          {/* eyes: left = primary only, right = muted */}
          <rect ref={leftEyeRef} x="28" y="22" width="8" height="8" fill="#ffff00" />
          <rect ref={rightEyeRef} x="44" y="22" width="8" height="8" fill="#abb2bf" />

          {faceOnly && (
            <rect ref={mouthRef} x="34" y="37" width="12" height="5" fill="#abb2bf" />
          )}
        </g>

        {!faceOnly && (
          <>
            <rect
              x="36"
              y="42"
              width="8"
              height="4"
              fill="#282c33"
              stroke="#abb2bf"
              strokeWidth="1"
            />
            <rect
              x="24"
              y="46"
              width="32"
              height="20"
              fill="#282c33"
              stroke="#abb2bf"
              strokeWidth="1.5"
            />
            <rect
              ref={chestRef}
              x="36"
              y="52"
              width="8"
              height="8"
              fill={isOpen ? '#ffff00' : '#abb2bf'}
            />
            <rect
              x="12"
              y="48"
              width="10"
              height="5"
              fill="#282c33"
              stroke="#abb2bf"
              strokeWidth="1.2"
            />
            <rect
              x="58"
              y="48"
              width="10"
              height="5"
              fill="#282c33"
              stroke="#abb2bf"
              strokeWidth="1.2"
            />
            <rect
              x="28"
              y="66"
              width="8"
              height="10"
              fill="#282c33"
              stroke="#abb2bf"
              strokeWidth="1.2"
            />
            <rect
              x="44"
              y="66"
              width="8"
              height="10"
              fill="#282c33"
              stroke="#abb2bf"
              strokeWidth="1.2"
            />
          </>
        )}
      </svg>
    </div>
  );
};

export default RobotAvatar;
