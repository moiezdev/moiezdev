import Card from '../ui/Card';
import FeaturedCard from '../ui/FeaturedCard';
import Reveal from '../../motion/Reveal';
import SectionTitle from '../ui/SectionTitle';
import { useContent } from '../../i18n/content';

/** Home: the featured case study, then three more client projects. */
const Projects = () => {
  const { t, projects } = useContent();
  const featured = projects.find((p) => p.featured);
  const more = projects.filter((p) => !p.featured && p.status !== 'in-progress' && p.group !== 'earlier').slice(0, 3);

  return (
    <section className="band-tint w-full px-5 py-20 md:py-28 scroll-mt-16" id="work">
      <div className="app-container">
        <SectionTitle
          eyebrow={t('projects.eyebrow')}
          title={t('projects.headline')}
          buttonText={t('projects.viewAll')}
          link="/works"
        />
        {featured && (
          <Reveal>
            <FeaturedCard project={featured} />
          </Reveal>
        )}
        {/* two columns on tablets (the third card waits for the three-column layout) */}
        <Reveal className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {more.map((project, i) => (
            <div key={project.id} className={i === 2 ? 'sm:max-lg:hidden' : ''}>
              <Card project={project} />
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
};

export default Projects;
