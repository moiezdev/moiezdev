import Img from '../ui/Img';
import Button from '../ui/Button';
import Reveal from '../ui/Reveal';
import { useContent } from '../../i18n/content';

/** Portrait + story block on the About page (`full`), or a two-paragraph teaser. */
export const AboutStory = ({ full = false }) => {
  const { t } = useContent();
  const paragraphs = t('about.paragraphs');
  const shown = full ? paragraphs : paragraphs.slice(0, 2);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 md:gap-12 lg:gap-16 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center">
      <Reveal>
        <div className="relative overflow-hidden rounded-[36px] aspect-[4/5] bg-surface-2">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(70% 60% at 50% 100%, var(--glow-b), transparent 70%), radial-gradient(50% 50% at 20% 15%, var(--glow-a), transparent 70%)',
            }}
          />
          <Img
            src="/aboutSection/about-img.webp"
            alt="Moieez ur Rehman"
            sizes="(min-width: 768px) 520px, 90vw"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[94%] w-auto max-w-none object-contain rtl:-scale-x-100"
          />
        </div>
      </Reveal>
      <div className="min-w-0">
        <Reveal as="h2" className="headline-2 text-label">
          {t('about.title')}
        </Reveal>
        {shown.map((p, idx) => (
          <Reveal as="p" delay={80 + idx * 60} key={idx} className="mt-5 text-[17px] leading-[1.6] text-label-2">
            {p}
          </Reveal>
        ))}
        <Reveal delay={240} className="mt-8 flex flex-wrap gap-3">
          {full ? (
            <Button to="/experience" primary>
              {t('about.viewExperience')}
            </Button>
          ) : (
            <Button to="/about" primary>
              {t('about.more')}
            </Button>
          )}
          <Button to="/contact" variant="outline">
            {t('hero.contact')}
          </Button>
        </Reveal>
      </div>
    </div>
  );
};
