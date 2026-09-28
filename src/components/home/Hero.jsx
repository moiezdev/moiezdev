import { useRef } from 'react';
import Button from '../ui/Button';
import { clamp01, useScrollFrame } from '../../hooks/useScrollFrame';
import Reveal from '../ui/Reveal';
import { Chevron } from '../ui/SectionTitle';
import { useContent } from '../../i18n/content';
import { getExperienceYears } from '../../utils/experience';
import { scrollToTarget } from '../../utils/smoothScroll';

const Stat = ({ value, label }) => (
  <div className="flex flex-col items-center text-center px-4">
    <span className="text-[40px] md:text-[56px] font-bold tracking-[-0.04em] leading-none text-label">
      {value}
    </span>
    <span className="mt-2 text-[13px] md:text-[15px] text-label-2">{label}</span>
  </div>
);

/** Statement whose words light up one by one as it scrolls through the viewport. */
const ScrollStatement = ({ text }) => {
  const ref = useRef(null);
  const words = String(text).split(' ');

  useScrollFrame(ref, (el, vh) => {
    const r = el.getBoundingClientRect();
    // 0 when the block enters the lower part of the screen, 1 near the middle
    const p = clamp01((vh * 0.85 - r.top) / (vh * 0.55));
    const spans = el.children;
    const lit = p * spans.length;
    for (let i = 0; i < spans.length; i += 1) {
      spans[i].style.opacity = String(0.18 + 0.82 * clamp01(lit - i));
    }
  });

  return (
    <blockquote ref={ref} className="headline-1 text-label">
      {words.map((w, i) => (
        <span key={i} className="transition-opacity duration-150">
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </blockquote>
  );
};

const Hero = () => {
  const { t, projects, jobs } = useContent();
  const years = getExperienceYears();
  const stageRef = useRef(null);

  // the portrait stage grows to full size as it scrolls into view
  useScrollFrame(stageRef, (el, vh) => {
    const r = el.parentElement.getBoundingClientRect();
    const p = clamp01((vh - r.top) / (vh * 0.75));
    el.style.transform = `scale(${0.86 + 0.14 * p})`;
    el.style.borderRadius = `${64 - 20 * p}px`;
  });

  return (
    <section className="relative px-5 pt-[120px] md:pt-[150px] overflow-hidden">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] opacity-60 dark:opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(40% 50% at 30% 40%, var(--glow-a), transparent 70%), radial-gradient(35% 45% at 70% 45%, var(--glow-b), transparent 70%)',
        }}
      />

      <div className="relative app-container text-center flex flex-col items-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full glass ring-1 ring-separator px-3.5 py-1.5 text-[13px] text-label-2">
            <span className="status-dot" aria-hidden />
            {t('hero.available')}
          </span>
        </Reveal>

        <Reveal delay={40} as="p" className="mt-7 text-[17px] md:text-[21px] font-semibold tracking-[-0.02em] text-label">
          {t('hero.intro')}
        </Reveal>

        <Reveal delay={80} as="h1" className="headline-hero text-label mt-3 max-w-4xl">
          {t('hero.titleBefore')}
          <br />
          <span className="text-gradient">{t('hero.titleRole')}</span>
          {t('hero.titleAfter') ? ` ${t('hero.titleAfter')}` : null}
        </Reveal>

        <Reveal delay={160} as="p" className="lead mt-6 max-w-2xl">
          {t('hero.lead')}
        </Reveal>

        <Reveal delay={240} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button to="/contact" primary size="lg">
            {t('hero.contact')}
          </Button>
          <Button href="/Moieez%20ur%20Rehman.pdf" download="Moieez ur Rehman.pdf" size="lg" variant="outline">
            {t('hero.resume')}
          </Button>
        </Reveal>
        <Reveal delay={300} className="mt-5">
          <button
            type="button"
            onClick={() => scrollToTarget(document.getElementById('work'), { offset: -64 })}
            className="link-arrow text-[15px] cursor-pointer"
          >
            {t('hero.seeWork')}
            <Chevron dir="down" />
          </button>
        </Reveal>
      </div>

      {/* portrait stage */}
      <Reveal delay={200} className="relative app-container-wide mt-16 md:mt-20">
        <div
          ref={stageRef}
          className="relative mx-auto overflow-hidden rounded-[36px] md:rounded-[44px] h-[380px] sm:h-[500px] md:h-[620px] bg-surface-2 origin-top will-change-transform"
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(60% 70% at 50% 100%, var(--glow-a), transparent 70%), radial-gradient(40% 50% at 15% 20%, var(--glow-b), transparent 70%), radial-gradient(40% 50% at 85% 25%, var(--glow-b), transparent 70%)',
            }}
          />
          <img
            src="/heroSection/hero-img.webp"
            alt="Moieez ur Rehman"
            className="portrait-fade absolute bottom-0 left-1/2 -translate-x-1/2 h-[94%] w-auto max-w-none object-contain rtl:-scale-x-100"
            fetchPriority="high"
          />

          {/* floating glass cards */}
          <div className="hidden sm:flex absolute top-8 start-8 md:top-12 md:start-12 glass ring-1 ring-separator rounded-2xl px-4 py-3 flex-col items-start text-start max-w-[240px] shadow-lg">
            <span className="text-[11px] uppercase tracking-wider text-label-3 font-semibold">
              {t('hero.now')}
            </span>
            <span className="text-[15px] text-label font-medium mt-0.5">{t('hero.nowFocus')}</span>
          </div>
          <div className="hidden sm:flex absolute bottom-8 end-8 md:bottom-12 md:end-12 glass ring-1 ring-separator rounded-2xl px-4 py-3 items-center gap-3 shadow-lg">
            <span className="text-[28px] font-bold tracking-[-0.03em] text-label">{years}+</span>
            <span className="text-[13px] leading-tight text-label-2 max-w-[110px] text-start">
              {t('hero.yearsShort')}
            </span>
          </div>
        </div>
      </Reveal>

      {/* stats */}
      <Reveal className="app-container mt-14 md:mt-20 grid grid-cols-3 [&>*+*]:border-s [&>*+*]:border-separator">
        <Stat value={`${years}+`} label={t('hero.statYears')} />
        <Stat value={`${projects.length}+`} label={t('hero.statProjects')} />
        <Stat value={jobs.length} label={t('hero.statCompanies')} />
      </Reveal>

      {/* quote */}
      <Reveal as="figure" className="app-container text-center mt-28 md:mt-40 max-w-4xl">
        <ScrollStatement text={t('hero.statement')} />
        <figcaption className="mt-5 text-[15px] text-label-2">{t('hero.quote')}</figcaption>
      </Reveal>
    </section>
  );
};

export default Hero;
