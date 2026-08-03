import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Geometric robot mascot — charcoal + gray borders, one primary (yellow) eye.
 * Matches homepage square accents and sharp edges.
 * `faceOnly` crops to head + antenna and adds a mouth for lip-sync while thinking.
 */
const RobotAvatar = ({
  size = 64,
  isOpen = false,
  isThinking = false,
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
    if (!isThinking) return;
    const tween = gsap.to(leftEyeRef.current, {
      opacity: 0.35,
      duration: 0.4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
    return () => {
      tween.kill();
      gsap.set(leftEyeRef.current, { opacity: 1 });
    };
  }, [isThinking]);

  // Lip-sync: mouth opens/closes while thinking (face-only header avatar)
  useEffect(() => {
    const mouth = mouthRef.current;
    if (!mouth) return;

    gsap.set(mouth, { transformOrigin: '50% 50%' });

    if (!isThinking) {
      gsap.to(mouth, { scaleY: 0.35, duration: 0.2 });
      return;
    }

    const tl = gsap.timeline({ repeat: -1 });
    tl.to(mouth, { scaleY: 1, duration: 0.1, ease: 'power1.out' })
      .to(mouth, { scaleY: 0.3, duration: 0.09, ease: 'power1.in' })
      .to(mouth, { scaleY: 0.85, duration: 0.08, ease: 'power1.out' })
      .to(mouth, { scaleY: 0.25, duration: 0.1, ease: 'power1.in' })
      .to(mouth, { scaleY: 0.7, duration: 0.07, ease: 'power1.out' })
      .to(mouth, { scaleY: 0.35, duration: 0.12, ease: 'power1.in' })
      .to({}, { duration: 0.15 }); // brief pause between "syllables"

    return () => {
      tl.kill();
      gsap.set(mouth, { scaleY: 0.35 });
    };
  }, [isThinking]);

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
        {/* antenna */}
        <g ref={antennaRef}>
          <line x1="40" y1="12" x2="40" y2="3" stroke="#abb2bf" strokeWidth="1.5" />
          <rect ref={antennaDotRef} x="37" y="0" width="6" height="6" fill="#ffff00" />
        </g>

        {/* head — sharp corners like site cards */}
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

        {faceOnly ? (
          /* mouth — lip-syncs when thinking */
          <rect ref={mouthRef} x="34" y="37" width="12" height="5" fill="#abb2bf" />
        ) : (
          <>
            {/* neck */}
            <rect
              x="36"
              y="42"
              width="8"
              height="4"
              fill="#282c33"
              stroke="#abb2bf"
              strokeWidth="1"
            />

            {/* body */}
            <rect
              x="24"
              y="46"
              width="32"
              height="20"
              fill="#282c33"
              stroke="#abb2bf"
              strokeWidth="1.5"
            />
            {/* chest status square — homepage yellow-square motif */}
            <rect
              ref={chestRef}
              x="36"
              y="52"
              width="8"
              height="8"
              fill={isOpen ? '#ffff00' : '#abb2bf'}
            />

            {/* arms */}
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

            {/* legs */}
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
