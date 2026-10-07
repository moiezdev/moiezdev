import Card from '../ui/Card';
import FeaturedCard from '../ui/FeaturedCard';
import Reveal from '../ui/Reveal';
import SectionTitle from '../ui/SectionTitle';
import { useContent } from '../../i18n/content';

/** Home: the featured case study, then three more client projects. */
const Projects = () => {
  const { t, projects } = useContent();
  const featured = projects.find((p) => p.featured);
  const more = projects.filter((p) => !p.featured && p.status !== 'in-progress' && p.group !== 'earlier').slice(0, 3);

  return (
    <section className="w-full px-5 pt-20 md:pt-28 scroll-mt-16" id="work">
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
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {more.map((project, i) => (
            <Reveal key={project.id} delay={i * 80}>
              <Card project={project} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
