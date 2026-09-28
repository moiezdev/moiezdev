import Transition from '../components/functions/Transition';
import PageHeader from '../components/ui/PageHeader';
import Skills from '../components/home/Skills';
import CodeWindow from '../components/ui/CodeWindow';
import Reveal from '../components/ui/Reveal';
import Moments from '../components/home/Moments';
import { AboutStory } from '../components/home/About';
import { useContent } from '../i18n/content';

const About = () => {
  const { t } = useContent();

  return (
    <Transition>
      <PageHeader eyebrow={t('about.eyebrow')} title={t('about.pageTitle')} subtitle={t('about.blurb')} />
      <section className="w-full px-5">
        <div className="app-container">
          <AboutStory full />
        </div>
      </section>
      <section className="w-full px-5 pt-28 md:pt-40">
        <div className="app-container grid grid-cols-[minmax(0,1fr)] gap-10 lg:gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center">
          <div>
            <Reveal as="p" className="eyebrow mb-3">
              {t('about.codeEyebrow')}
            </Reveal>
            <Reveal as="h2" delay={60} className="headline-1 text-label">
              {t('about.codeTitle')}
            </Reveal>
            <Reveal as="p" delay={120} className="lead mt-5">
              {t('about.codeBody')}
            </Reveal>
          </div>
          <Reveal delay={120} className="min-w-0">
            <CodeWindow />
          </Reveal>
        </div>
      </section>
      <Moments />
      <Skills />
    </Transition>
  );
};

export default About;
