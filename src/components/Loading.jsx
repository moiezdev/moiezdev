import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { t } from '../i18n/content';
import { usePreferences } from '../context/Preferences';

// Usage:
// 1. npm install gsap
// 2. import LoadingScreen from './LoadingScreen'
// 3. <LoadingScreen message="Loading..." />

export default function Loading({ height = 'h-screen', message }) {
  const { lang } = usePreferences();
  const label = message ?? t(lang, 'common.loading');
  const container = useRef(null);
  const logoRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Simple fade in
      gsap.fromTo(
        container.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power2.out' }
      );

      // Logo bounce loop
      gsap.to(logoRef.current, {
        y: -12,
        duration: 0.6,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1,
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={container}
      className={`flex items-center justify-center w-full bg-gray-b/80 ${height}`}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Logo */}
        <div
          ref={logoRef}
          className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-r from-primary to-gray-a"
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" stroke="var(--color-white)" strokeWidth="2" />
          </svg>
        </div>

        {/* Message */}
        <p className="font-medium">{label}</p>
      </div>
    </div>
  );
}
