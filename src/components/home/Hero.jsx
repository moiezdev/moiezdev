import Img from '../ui/Img';
import Button from '../ui/Button';
import ExternalIcon from '../ui/ExternalIcon';
import { useContent } from '../../i18n/content';
import { getExperienceYears } from '../../utils/experience';
import site from '../../data/site.json';
import HeroStage from './HeroStage';

const Stat = ({ value, label }) => (
  <div className="flex flex-col items-center lg:items-start text-center lg:text-start px-2 sm:px-4 lg:ps-0 lg:pe-6 min-w-0">
    <span className="text-[30px] sm:text-[34px] md:text-[44px] font-bold tracking-[-0.04em] leading-none text-label tabular-nums" dir="ltr">
      {value}
    </span>
    <span className="mt-2 text-[12px] sm:text-[13px] md:text-[14px] leading-snug text-label-2 text-balance">{label}</span>
  </div>
);

/** A small round portrait beside the name: the hero's visual is the 3D stage. */
const Avatar = ({ alt }) => (
  <div className="relative shrink-0 size-14 md:size-16 overflow-hidden rounded-full ring-1 ring-separator bg-surface-2">
    <Img
      src="/heroSection/hero-img.webp"
      alt={alt}
      sizes="64px"
      priority
      className="absolute max-w-none w-[170%] start-[-35%] top-[-4%] h-auto"
    />
  </div>
);

const Hero = () => {
  const { t } = useContent();
  const years = getExperienceYears();

  return (
    <section data-hero className="relative px-5 pt-[76px] md:pt-[112px] lg:pt-[124px] pb-16 md:pb-24 overflow-hidden">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] opacity-60 dark:opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(40% 50% at 30% 40%, var(--glow-a), transparent 70%), radial-gradient(35% 45% at 70% 45%, var(--glow-b), transparent 70%)',
        }}
      />

      <div className="relative app-container grid items-center gap-4 lg:gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-start">
          <span className="inline-flex items-center gap-2 rounded-full glass ring-1 ring-separator px-4 py-1.5 text-[13px] md:text-[14px] text-label-2">
            <span className="status-dot" aria-hidden />
            {t('hero.available')}
          </span>

          <div className="mt-6 lg:mt-8 flex items-center gap-3.5 text-start">
            <Avatar alt={t('hero.portraitAlt')} />
            <p className="flex flex-col min-w-0">
              <span className="text-[18px] md:text-[22px] font-semibold tracking-[-0.02em] text-label leading-tight">
                {t('hero.name')}
              </span>
              <span className="mt-1 text-[13px] md:text-[15px] font-medium text-label-2 text-pretty">{t('hero.eyebrow')}</span>
            </p>
          </div>

          <h1 className="headline-hero is-compact mt-5 lg:mt-6 max-w-3xl text-label text-balance">
            {t('hero.title')}
          </h1>

          <p className="lead is-hero mt-5 lg:mt-6 max-w-2xl lg:max-w-none text-balance lg:text-pretty">{t('hero.subtitle', { years })}</p>
          <p className="mt-3 font-mono text-[13px] md:text-[14px] text-label-3" dir="ltr">
            {t('hero.stack')}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <Button to="/works" primary size="lg">
              {t('hero.viewWork')}
            </Button>
            <Button to="/contact" size="lg" variant="outline">
              {t('hero.contact')}
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2">
            <a href={site.cv.url} download={site.cv.fileName} className="link-arrow text-[15px]">
              {t('hero.resumeShort')}
              <span aria-hidden>↓</span>
            </a>
            {site.calendlyUrl && (
              <a href={site.calendlyUrl} target="_blank" rel="noopener noreferrer" className="link-arrow text-[15px]">
                {t('hero.bookCall')}
                <ExternalIcon />
              </a>
            )}
          </div>
        </div>

        <div className="order-first lg:order-none">
          <HeroStage />
        </div>
      </div>

      {/* stats: a full-width row under copy and portrait, so the portrait centres on the copy alone */}
      <div className="relative app-container flex justify-center lg:justify-start">
        <div className="mt-12 md:mt-16 w-full max-w-3xl grid grid-cols-3 [&>*+*]:border-s [&>*+*]:border-separator lg:[&>*+*]:ps-6">
          <Stat value={t('hero.statLatencyValue')} label={t('hero.statLatency')} />
          <Stat value={t('hero.statTicketsValue')} label={t('hero.statTickets')} />
          <Stat value={`${years}+`} label={t('hero.statYearsLabel')} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
