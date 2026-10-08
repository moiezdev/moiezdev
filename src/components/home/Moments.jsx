import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import SectionTitle from '../ui/SectionTitle';
import Reveal from '../../motion/Reveal';
import Img from '../ui/Img';
import { events } from '../../data';
import { useContent } from '../../i18n/content';

/** Full-screen photo viewer with keyboard and swipe navigation. */
const Lightbox = ({ photos, index, onClose, onGo, lang }) => {
  const { t } = useContent();
  const [touchX, setTouchX] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      const rtl = document.documentElement.dir === 'rtl';
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onGo(index + (rtl ? -1 : 1));
      if (e.key === 'ArrowLeft') onGo(index + (rtl ? 1 : -1));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, onClose, onGo]);

  const photo = photos[index];
  const arrow = (dir) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onGo(index + (dir === 'next' ? 1 : -1));
      }}
      aria-label={dir === 'next' ? t('a11y.nextPhoto') : t('a11y.prevPhoto')}
      className={`absolute top-1/2 -translate-y-1/2 ${dir === 'next' ? 'end-4 md:end-8' : 'start-4 md:start-8'} size-11 rounded-full bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.22)] text-[#fff] inline-flex items-center justify-center backdrop-blur-md transition-colors`}
    >
      <svg className={`w-4 h-4 ${dir === 'prev' ? 'ltr:rotate-180' : 'rtl:rotate-180'}`} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[70] bg-[rgba(0,0,0,0.92)] backdrop-blur-xl flex flex-col items-center justify-center page-in"
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption[lang]}
      onClick={onClose}
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        const rtl = document.documentElement.dir === 'rtl';
        if (Math.abs(dx) > 40) onGo(index + ((dx < 0) !== rtl ? 1 : -1));
        setTouchX(null);
      }}
    >
      <Img
        key={photo.src}
        src={photo.src}
        alt={photo.caption[lang]}
        sizes="92vw"
        priority
        className="max-h-[80vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl page-in"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="mt-5 text-[15px] text-[rgba(255,255,255,0.85)] text-center px-6">{photo.caption[lang]}</p>
      <p className="mt-1 text-[12px] text-[rgba(255,255,255,0.5)] font-mono">
        {index + 1} / {photos.length}
      </p>
      {arrow('prev')}
      {arrow('next')}
      <button
        type="button"
        onClick={onClose}
        aria-label={t('a11y.close')}
        className="absolute top-4 end-4 md:top-6 md:end-6 size-10 rounded-full bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.22)] text-[#fff] inline-flex items-center justify-center backdrop-blur-md"
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  );
};

/** Gallery of industry events, e.g. LEAP: a bento grid, or a compact strip. */
const Moments = ({ compact = false }) => {
  const { t, lang } = useContent();
  const event = events[0];
  const [open, setOpen] = useState(null);
  const count = event?.photos.length || 0;
  const go = useCallback((n) => setOpen(((n % count) + count) % count), [count]);
  const close = useCallback(() => setOpen(null), []);
  if (!event) return null;

  const [cover, ...rest] = event.photos;

  const Tile = ({ photo, index, className = '', big = false }) => (
    <button
      type="button"
      onClick={() => setOpen(index)}
      data-cursor-label={t('moments.view')}
      className={`group relative block w-full h-full overflow-hidden rounded-[24px] md:rounded-[28px] bg-surface-2 text-start ${className}`}
    >
      <Img
        src={photo.src}
        alt=""
        sizes={big ? '(min-width: 768px) 640px, 100vw' : '(min-width: 768px) 320px, 50vw'}
        className="absolute inset-0 w-full h-full object-cover object-[50%_25%] card-img"
      />
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[rgba(0,0,0,0.6)] to-transparent" aria-hidden />
      <span className={`absolute bottom-0 inset-x-0 p-4 md:p-5 text-[#fff] ${big ? 'md:p-7' : ''}`}>
        {big && <span className="block text-[12px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.75)] mb-1">{event.place[lang]}</span>}
        <span className={`block font-semibold tracking-[-0.02em] leading-tight ${big ? 'text-[22px] md:text-[28px]' : 'text-[15px]'}`}>
          {photo.caption[lang]}
        </span>
      </span>
    </button>
  );

  return (
    <section className="w-full px-5 pt-28 md:pt-40" id="moments">
      <div className="app-container">
        {compact ? (
          <>
            <Reveal className="mb-6 md:mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-10">
              <div>
                <p className="eyebrow mb-2">{t('moments.eyebrow')}</p>
                <h2 className="headline-2 text-label">
                  {event.name} <span className="text-label-3">· {event.place[lang]}</span>
                </h2>
              </div>
              <p className="text-[15px] leading-relaxed text-label-2 max-w-xl">{event.summary[lang]}</p>
            </Reveal>
            <div className="grid gap-2 md:gap-3 grid-cols-2 sm:grid-cols-5">
              {event.photos.map((photo, i) => (
                <Reveal key={photo.src} delay={i * 50} className={`aspect-[4/5] ${i === 0 ? 'col-span-2 aspect-[16/10] sm:col-span-1 sm:aspect-[4/5]' : ''}`}>
                  <Tile photo={photo} index={i} />
                </Reveal>
              ))}
            </div>
          </>
        ) : (
          <>
            <SectionTitle eyebrow={t('moments.eyebrow')} title={t('moments.headline')} subtitle={event.summary[lang]} />

            <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 lg:h-[640px]">
              <Reveal className="col-span-2 row-span-2 aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto">
                <Tile photo={cover} index={0} big />
              </Reveal>
              {rest.map((photo, i) => (
                <Reveal key={photo.src} delay={(i + 1) * 70} className="aspect-[3/4] lg:aspect-auto">
                  <Tile photo={photo} index={i + 1} />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </div>

      {open !== null &&
        createPortal(
          <Lightbox photos={event.photos} index={open} onClose={close} onGo={go} lang={lang} />,
          document.body,
        )}
    </section>
  );
};

export default Moments;
