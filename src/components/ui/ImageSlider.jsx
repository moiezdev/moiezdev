import { useCallback, useEffect, useRef, useState } from 'react';
import LazyImage from './LazyImage';

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
export default function ImageSlider({ images = [] }) {
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
      aria-roledescription="carousel"
    >
      {images.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-[opacity,transform] duration-700 ease-[var(--ease-apple)]"
          style={{ opacity: i === idx ? 1 : 0, transform: i === idx ? 'scale(1)' : 'scale(1.03)' }}
          aria-hidden={i !== idx}
        >
          <LazyImage src={src} alt={`Screenshot ${i + 1}`} wrapperClass="w-full h-full" className="object-cover" />
        </div>
      ))}

      {count > 1 && (
        <>
          <Arrow dir="prev" label="Previous image" onClick={() => go(idx - 1)} />
          <Arrow dir="next" label="Next image" onClick={() => go(idx + 1)} />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 glass ring-1 ring-separator rounded-full px-2.5 py-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === idx}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                  i === idx ? 'w-5 bg-label' : 'w-1.5 bg-label-3 hover:bg-label-2'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
