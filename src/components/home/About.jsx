import Button from '../ui/Button';
import Reveal from '../ui/Reveal';
import { useContent } from '../../i18n/content';

/** Portrait + story block, shared by the home page and the About page. */
export const AboutStory = ({ full = false }) => {
  const { t } = useContent();
  const paragraphs = t('about.paragraphs');
  const shown = full ? paragraphs : paragraphs.slice(0, 2);

  return (
    <div className="grid gap-10 md:gap-16 md:grid-cols-12 items-center">
      <Reveal className="md:col-span-5">
        <div className="relative overflow-hidden rounded-[36px] aspect-[4/5] bg-surface-2">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(70% 60% at 50% 100%, rgba(162,89,255,0.25), transparent 70%), radial-gradient(50% 50% at 20% 15%, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 70%)',
            }}
          />
          <img
            src="/aboutSection/about-img.webp"
            alt="Moieez ur Rehman"
            loading="lazy"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[94%] w-auto max-w-none object-contain rtl:-scale-x-100"
          />
        </div>
      </Reveal>
      <div className="md:col-span-7">
        <Reveal as="h3" className="headline-2 text-label">
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

const About = () => {
  const { t } = useContent();
  return (
    <section className="w-full px-5 pt-28 md:pt-40" id="about">
      <div className="app-container">
        <Reveal as="p" className="eyebrow mb-6">
          {t('about.eyebrow')}
        </Reveal>
        <AboutStory />
      </div>
    </section>
  );
};

export default About;
