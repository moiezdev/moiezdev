import Transition from '../components/functions/Transition';
import PageHeader from '../components/ui/PageHeader';
import Skills from '../components/home/Skills';
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
      <Skills />
    </Transition>
  );
};

export default About;
