import Img from '../ui/Img';
import Button from '../ui/Button';
import ExternalIcon from '../ui/ExternalIcon';
import { useContent } from '../../i18n/content';
import { getExperienceYears } from '../../utils/experience';
import site from '../../data/site.json';

const Stat = ({ value, label }) => (
  <div className="flex flex-col items-center lg:items-start text-center lg:text-start px-2 sm:px-4 lg:ps-0 lg:pe-6 min-w-0">
    <span className="text-[30px] sm:text-[34px] md:text-[44px] font-bold tracking-[-0.04em] leading-none text-label tabular-nums" dir="ltr">
      {value}
    </span>
    <span className="mt-2 text-[12px] sm:text-[13px] md:text-[14px] leading-snug text-label-2 text-balance">{label}</span>
  </div>
);

/**
 * The portrait: a transparent cut-out, so the nano swarm shows around it.
 * One element for every breakpoint: a round face crop on phones, a frameless
 * cut-out beside the copy on desktop.
 */
const Portrait = () => {
  const { t } = useContent();
  return (
    <div className="relative order-first lg:order-none justify-self-center lg:justify-self-end w-full max-w-[112px] lg:max-w-[380px]">
      {/* soft light behind the cut-out so a dark shirt never melts into the page */}
      <div
        aria-hidden
        className="hidden lg:block absolute -inset-10 -z-10 opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(50% 50% at 50% 45%, var(--glow-a), transparent 70%)' }}
      />
      <div className="relative overflow-hidden lg:overflow-visible rounded-full lg:rounded-none aspect-square lg:aspect-[960/1079] ring-1 ring-separator lg:ring-0 bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-2)_100%)] lg:bg-none">
        <Img
          src="/heroSection/hero-cutout.webp"
          alt={t('hero.portraitAlt')}
          sizes="(min-width: 1024px) 380px, 112px"
          priority
          className="absolute max-w-none w-[190%] start-[-45%] top-[-2%] h-auto lg:w-full lg:start-0 lg:top-0"
        />
      </div>
    </div>
  );
};

const Hero = () => {
  const { t } = useContent();
  const years = getExperienceYears();

  return (
    <section data-hero className="relative px-5 pt-[104px] md:pt-[132px] lg:pt-[124px] pb-16 md:pb-24 overflow-hidden">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] opacity-60 dark:opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(40% 50% at 30% 40%, var(--glow-a), transparent 70%), radial-gradient(35% 45% at 70% 45%, var(--glow-b), transparent 70%)',
        }}
      />

      <div className="relative app-container grid items-center gap-8 lg:gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-start">
          <span className="inline-flex items-center gap-2 rounded-full glass ring-1 ring-separator px-4 py-1.5 text-[13px] md:text-[14px] text-label-2">
            <span className="status-dot" aria-hidden />
            {t('hero.available')}
          </span>

          <p className="mt-6 lg:mt-8 flex flex-col">
            <span className="text-[18px] md:text-[22px] font-semibold tracking-[-0.02em] text-label leading-tight">
              {t('hero.name')}
            </span>
            <span className="mt-1.5 text-[14px] md:text-[16px] font-medium text-label-2">{t('hero.eyebrow')}</span>
          </p>

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

        <Portrait />
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
