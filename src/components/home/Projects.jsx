import Card from '../ui/Card';
import Reveal from '../ui/Reveal';
import SectionTitle from '../ui/SectionTitle';
import { useContent } from '../../i18n/content';

const Projects = () => {
  const { t, projects } = useContent();
  const [featured, ...rest] = projects.slice(0, 5);

  return (
    <section className="w-full px-5 pt-28 md:pt-40 scroll-mt-16" id="work">
      <div className="app-container">
        <SectionTitle
          eyebrow={t('projects.eyebrow')}
          title={t('projects.headline')}
          buttonText={t('projects.viewAll')}
          link="/works"
        />
        {featured && (
          <Reveal className="mb-6">
            <Card project={featured} featured />
          </Reveal>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          {rest.map((project, i) => (
            <Reveal key={project.id} delay={(i % 2) * 100}>
              <Card project={project} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
