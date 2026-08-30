// src/pages/NotFound.jsx
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useContent } from '../i18n/content';

export default function NotFound() {
  const { t } = useContent();
  const container = useRef(null);
  const digitsRef = useRef([]);
  const subtitleRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stagger bounce animation for digits "404"
      gsap.fromTo(
        digitsRef.current,
        { y: -40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'bounce.out',
          stagger: 0.15,
        }
      );

      // Subtitle fade in
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.8, ease: 'power2.out' }
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={container}
      className="flex flex-col items-center justify-center h-screen w-screen bg-gray-b text-gray-a text-center px-6"
    >
      {/* 404 digits */}
      <div className="flex gap-4 text-xlarge font-bold text-primary">
        {['4', '0', '4'].map((digit, i) => (
          <span key={i} ref={(el) => (digitsRef.current[i] = el)} className="drop-shadow-lg">
            {digit}
          </span>
        ))}
      </div>

      {/* Subtitle */}
      <h2 ref={subtitleRef} className="mt-4 text-large font-semibold text-white">
        {t('notFound.title')}
      </h2>

      <p className="mt-2 text-gray-a max-w-md">{t('notFound.body')}</p>

      <Link to="/">
        <Button primary={true} className="mt-6">
          {t('notFound.home')}
        </Button>
      </Link>
    </div>
  );
}
