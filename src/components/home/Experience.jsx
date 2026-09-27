import SectionTitle from '../ui/SectionTitle';
import ExperienceCards from '../experience/ExperienceCards';
import { useContent } from '../../i18n/content';

const Experience = () => {
  const { t, jobs } = useContent();

  return (
    <section className="w-full px-5 pt-28 md:pt-40" id="experience">
      <div className="app-container">
        <SectionTitle
          eyebrow={t('experience.eyebrow')}
          title={t('experience.headline')}
          buttonText={t('experience.viewAll')}
          link="/experience"
        />
        <ExperienceCards jobs={jobs.slice(0, 3)} highlightLimit={3} />
      </div>
    </section>
  );
};

export default Experience;
