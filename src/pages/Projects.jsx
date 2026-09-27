import Card from '../components/ui/Card';
import Reveal from '../components/ui/Reveal';
import PageHeader from '../components/ui/PageHeader';
import Transition from '../components/functions/Transition';
import { useContent } from '../i18n/content';

const Projects = () => {
  const { t, projects } = useContent();

  return (
    <Transition>
      <PageHeader eyebrow={t('projects.eyebrow')} title={t('projects.pageTitle')} subtitle={t('projects.list')} />
      <section className="w-full px-5">
        <div className="app-container grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <Reveal key={project.id} delay={(i % 3) * 80}>
              <Card project={project} maxTech={3} />
            </Reveal>
          ))}
        </div>
      </section>
    </Transition>
  );
};

export default Projects;
