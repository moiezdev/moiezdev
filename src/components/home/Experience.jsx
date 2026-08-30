import { Link } from 'react-router-dom';
import SectionTitle from '../ui/SectionTitle';
import ExperienceCards from '../experience/ExperienceCards';
import Button from '../ui/Button';
import { useContent } from '../../i18n/content';

const Experience = () => {
  const { t, jobs } = useContent();
  const previewJobs = jobs.slice(0, 3);

  return (
    <section className="w-full px-4 py-12 relative" id="experience">
      <div className="app-container mx-auto">
        <SectionTitle title={t('experience.section')} buttonText={t('experience.viewAll')} link="/experience" />
        <ExperienceCards jobs={previewJobs} highlightLimit={3} />
        <div className="flex justify-center mt-8">
          <Link to="/experience">
            <Button primary>{t('experience.viewAllBtn')}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Experience;
