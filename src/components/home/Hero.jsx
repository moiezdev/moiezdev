import Img from '../ui/Img';
import Button from '../ui/Button';
import Reveal from '../../motion/Reveal';
import ExternalIcon from '../ui/ExternalIcon';
import { useContent } from '../../i18n/content';
import site from '../../data/site.json';

const Stat = ({ value, label }) => (
  <div className="flex flex-col items-center text-center px-3 sm:px-4">
    <span className="text-[34px] md:text-[48px] font-bold tracking-[-0.04em] leading-none text-label" dir="ltr">
      {value}
    </span>
    <span className="mt-2 text-[13px] md:text-[15px] text-label-2">{label}</span>
  </div>
);

/** Small round portrait, cropped to the face from the cut-out hero photo. */
const Avatar = () => (
  <span className="relative inline-block size-12 md:size-14 shrink-0 overflow-hidden rounded-full bg-surface-2 ring-1 ring-separator">
    <Img
      src="/heroSection/hero-img.webp"
      alt=""
      sizes="120px"
      priority
      className="absolute max-w-none w-[170%] left-[-36%] top-[-6%] h-auto"
    />
  </span>
);

const Hero = () => {
  const { t, projects, jobs } = useContent();

  return (
    <section data-hero className="relative px-5 pt-[112px] md:pt-[140px] pb-16 md:pb-24 overflow-hidden">
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

        <Reveal delay={40} className="mt-8 flex items-center gap-3 text-start">
          <Avatar />
          <span className="flex flex-col">
            <span className="text-[17px] md:text-[19px] font-semibold tracking-[-0.02em] text-label leading-tight">
              {t('hero.name')}
            </span>
            <span className="mt-0.5 text-[13px] md:text-[14px] font-medium text-label-2">{t('hero.eyebrow')}</span>
          </span>
        </Reveal>

        <Reveal
          delay={80}
          as="h1"
          className="headline-hero !text-[clamp(2.125rem,5.6vw,4.5rem)] mt-7 max-w-4xl text-label text-balance"
        >
          {t('hero.title')}
        </Reveal>

        <Reveal delay={160} as="p" className="lead mt-6 max-w-2xl text-balance">
          {t('hero.subtitle')}
        </Reveal>

        <Reveal delay={240} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button to="/works" primary size="lg">
            {t('hero.viewWork')}
          </Button>
          <Button href={site.cv.url} download={site.cv.fileName} size="lg" variant="outline">
            {t('hero.resume')}
          </Button>
        </Reveal>
        <Reveal delay={300} className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a href={site.cv.url} target="_blank" rel="noopener noreferrer" className="link-arrow text-[15px]">
            {t('hero.viewResume')}
            <ExternalIcon />
          </a>
          {site.calendlyUrl && (
            <a href={site.calendlyUrl} target="_blank" rel="noopener noreferrer" className="link-arrow text-[15px]">
              {t('hero.bookCall')}
              <ExternalIcon />
            </a>
          )}
        </Reveal>
      </div>

      {/* stats */}
      <div className="relative app-container mt-14 md:mt-20">
        <Reveal className="mx-auto max-w-3xl grid grid-cols-3 [&>*+*]:border-s [&>*+*]:border-separator">
          <Stat value={t('hero.statLatencyValue')} label={t('hero.statLatency')} />
          <Stat value={`${projects.length}+`} label={t('hero.statProjects')} />
          <Stat value={jobs.length} label={t('hero.statCompanies')} />
        </Reveal>
      </div>
    </section>
  );
};

export default Hero;
