import { Link } from 'react-router-dom';
import SectionTitle from '../ui/SectionTitle';
import ExperienceCards from '../experience/ExperienceCards';
import Button from '../ui/Button';
import { experience } from '../../data';

const previewJobs = experience.slice(0, 3);

const Experience = () => {
  return (
    <section className="w-full px-4 py-12 relative" id="experience">
      <div className="app-container mx-auto">
        <SectionTitle title="experience" buttonText="View all" link="/experience" />
        <ExperienceCards jobs={previewJobs} highlightLimit={3} />
        <div className="flex justify-center mt-8">
          <Link to="/experience">
            <Button primary>View all ~~{'>'}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Experience;
