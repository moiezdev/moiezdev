import Reveal from '../ui/Reveal';
import site from '../../data/site.json';
import { useContent } from '../../i18n/content';

/**
 * "Worked with" strip of company logos, shown in monochrome so mixed logo
 * styles sit quietly in the muted palette. Off by default: it renders nothing
 * unless site.logoStrip.enabled is true and at least one logo is permitted.
 *
 * Each logo is blended against its own tile (isolate + mix-blend), so white
 * JPEG backgrounds disappear: multiply on the light tile, and invert + screen
 * on the dark one.
 */
const LogoStrip = ({ config = site.logoStrip, className = 'pt-20 md:pt-28' }) => {
  const { t } = useContent();
  const logos = config?.enabled ? (config.logos || []).filter((logo) => logo.permitted && logo.logo) : [];
  if (!logos.length) return null;

  return (
    <section className={`w-full px-5 ${className}`} aria-labelledby="logo-strip-title">
      <Reveal className="app-container flex flex-col items-center gap-6">
        <h2 id="logo-strip-title" className="text-[13px] font-semibold uppercase tracking-wider text-label-3">
          {t('logos.title')}
        </h2>
        <ul className="flex flex-wrap justify-center gap-3">
          {logos.map((logo) => (
            <li
              key={logo.name}
              className="group isolate flex h-14 items-center gap-2.5 rounded-2xl bg-surface px-4 shadow-[var(--shadow-card)]"
            >
              <img
                src={logo.logo}
                alt={logo.wide ? logo.name : ''}
                loading="lazy"
                decoding="async"
                className={`${
                  logo.wide ? 'h-7 w-auto max-w-[150px]' : 'size-8'
                } object-contain grayscale contrast-[1.1] opacity-60 mix-blend-multiply transition-opacity duration-300 group-hover:opacity-85 dark:invert dark:mix-blend-screen`}
              />
              {!logo.wide && (
                <span className="text-[14px] font-semibold tracking-[-0.01em] text-label-2 whitespace-nowrap" dir="ltr">
                  {logo.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
};

export default LogoStrip;
