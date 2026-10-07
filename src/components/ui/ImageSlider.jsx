import { useCallback, useEffect, useRef, useState } from 'react';
import Img from './Img';
import { useContent } from '../../i18n/content';

const Arrow = ({ dir, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={`absolute top-1/2 -translate-y-1/2 z-20 ${dir === 'prev' ? 'start-4' : 'end-4'} size-10 rounded-full glass ring-1 ring-separator text-label inline-flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer`}
  >
    <svg className={`w-4 h-4 ${dir === 'prev' ? 'ltr:rotate-180' : 'rtl:rotate-180'}`} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </button>
);

/** Crossfading gallery with swipe, keyboard arrows, and pill page indicators. */
export default function ImageSlider({ images = [], title = '' }) {
  const { t } = useContent();
  const [idx, setIdx] = useState(0);
  const touchX = useRef(null);
  const count = images.length;

  const go = useCallback((n) => setIdx(((n % count) + count) % count), [count]);

  useEffect(() => {
    if (count <= 1) return undefined;
    const id = setTimeout(() => go(idx + 1), 6000);
    return () => clearTimeout(id);
  }, [idx, count, go]);

  const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  return (
    <div
      className="group relative w-full overflow-hidden rounded-[28px] bg-surface-2 aspect-[16/10] select-none"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(idx + (rtl ? -1 : 1));
        if (e.key === 'ArrowLeft') go(idx + (rtl ? 1 : -1));
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(idx + ((dx < 0) !== rtl ? 1 : -1));
        touchX.current = null;
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label={t('a11y.gallery', { title })}
    >
      {images.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-[opacity,transform] duration-700 ease-[var(--ease-apple)]"
          style={{ opacity: i === idx ? 1 : 0, transform: i === idx ? 'scale(1)' : 'scale(1.03)' }}
          aria-hidden={i !== idx}
        >
          <Img
            src={src}
            alt={t('a11y.screenshot', { title, n: i + 1, count })}
            sizes="(min-width: 1280px) 1200px, 100vw"
            priority={i === 0}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {count > 1 && (
        <>
          <Arrow dir="prev" label={t('a11y.prevImage')} onClick={() => go(idx - 1)} />
          <Arrow dir="next" label={t('a11y.nextImage')} onClick={() => go(idx + 1)} />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center glass ring-1 ring-separator rounded-full px-1">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={t('a11y.goToImage', { n: i + 1 })}
                aria-current={i === idx}
                // a 24px target around the small pill
                className="group/dot inline-flex h-6 min-w-6 items-center justify-center px-[3px] cursor-pointer"
              >
                <span
                  aria-hidden
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === idx ? 'w-5 bg-label' : 'w-1.5 bg-label-3 group-hover/dot:bg-label-2'
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
