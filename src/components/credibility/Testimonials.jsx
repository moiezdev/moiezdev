import Reveal from '../../motion/Reveal';
import testimonialsData from '../../data/testimonials.json';
import { useContent } from '../../i18n/content';

/** A value that is either a plain string or an { en, ar } pair. */
const pick = (value, lang) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.en || '';
};

const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const QuoteMark = () => (
  <svg className="w-7 h-7 text-label-3 rtl:-scale-x-100" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
    <path d="M13 8c-4.4 1.6-7 5.2-7 10v6h8v-8h-4c0-3 1.4-5 4-6.2L13 8Zm13 0c-4.4 1.6-7 5.2-7 10v6h8v-8h-4c0-3 1.4-5 4-6.2L26 8Z" />
  </svg>
);

const Avatar = ({ name, photo }) =>
  photo ? (
    <img
      src={photo}
      alt=""
      width="44"
      height="44"
      loading="lazy"
      decoding="async"
      className="size-11 shrink-0 rounded-full object-cover grayscale-[35%]"
    />
  ) : (
    <span
      aria-hidden
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-fill text-[14px] font-semibold text-label-2"
    >
      {initials(name)}
    </span>
  );

/**
 * Short recommendations from people Moieez has worked with
 * (src/data/testimonials.json). Renders nothing at all until there are quotes.
 */
const Testimonials = ({ items = testimonialsData.items, className = 'pt-24 md:pt-32' }) => {
  const { t, lang } = useContent();
  const quotes = (items || [])
    .map((item) => ({
      id: item.id || pick(item.name, 'en'),
      name: pick(item.name, lang),
      role: pick(item.role, lang),
      company: pick(item.company, lang),
      quote: pick(item.quote, lang),
      photo: item.photo,
      linkedin: item.linkedin,
    }))
    .filter((q) => q.name && q.quote)
    .slice(0, 3);

  if (!quotes.length) return null;

  const cols = quotes.length === 1 ? 'md:max-w-2xl' : quotes.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3';

  return (
    <section className={`w-full px-5 ${className}`} aria-labelledby="testimonials-title">
      <div className="app-container">
        <Reveal className="mb-8 md:mb-10 max-w-3xl">
          <p className="eyebrow mb-3">{t('testimonials.eyebrow')}</p>
          <h2 id="testimonials-title" className="headline-2 text-label">
            {t('testimonials.title')}
          </h2>
        </Reveal>
        <ul className={`grid grid-cols-[minmax(0,1fr)] gap-4 md:gap-5 ${cols}`}>
          {quotes.map((q, i) => (
            <Reveal as="li" key={q.id} delay={i * 80} className="flex">
              <figure className="surface !rounded-[22px] p-6 md:p-7 flex flex-1 flex-col gap-5">
                <QuoteMark />
                <blockquote className="flex-1 text-[16px] md:text-[17px] leading-[1.6] text-label">
                  <p>{q.quote}</p>
                </blockquote>
                <figcaption className="flex items-center gap-3 pt-5 border-t border-separator">
                  <Avatar name={q.name} photo={q.photo} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-label truncate">{q.name}</span>
                    {(q.role || q.company) && (
                      <span className="block text-[13px] text-label-2">
                        {[q.role, q.company].filter(Boolean).join(t('testimonials.separator'))}
                      </span>
                    )}
                  </span>
                  {q.linkedin && (
                    <a
                      href={q.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('testimonials.linkedin', { name: q.name })}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-fill hover:bg-[color-mix(in_srgb,var(--color-fill)_170%,transparent)] transition-colors"
                    >
                      <img
                        src="/socialMediaIcons/Linkedin.svg"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-4 h-4 brightness-0 opacity-70 dark:invert"
                      />
                    </a>
                  )}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Testimonials;
