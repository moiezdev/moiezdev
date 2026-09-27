import { Link, useParams } from 'react-router-dom';
import Transition from '../components/functions/Transition';
import ImageSlider from '../components/ui/ImageSlider';
import Button from '../components/ui/Button';
import Reveal from '../components/ui/Reveal';
import Card from '../components/ui/Card';
import TechChip from '../components/ui/TechChip';
import PageHeader from '../components/ui/PageHeader';
import { Chevron } from '../components/ui/SectionTitle';
import { getProjectById } from '../data';
import { useContent } from '../i18n/content';
import NotFound from './NotFound';

export default function ProjectDetail() {
  const { id } = useParams();
  const { t, localize, projects } = useContent();
  const project = localize(getProjectById(id));
  if (!project) return <NotFound />;

  const base = project.imageUrl.split('/').slice(0, -1).join('/');
  const images = (project.media?.length ? project.media : [project.imageUrl.split('/').pop()]).map(
    (img) => `${base}/${img}`,
  );
  const index = projects.findIndex((p) => p.id === project.id);
  const next = projects.filter((p) => p.id !== project.id).slice(index, index + 2);
  const more = next.length === 2 ? next : projects.filter((p) => p.id !== project.id).slice(0, 2);

  return (
    <Transition>
      <PageHeader
        eyebrow={
          <Link to="/works" className="inline-flex items-center gap-1 hover:underline underline-offset-4">
            <Chevron dir="back" />
            {t('projects.back')}
          </Link>
        }
        title={project.title}
        subtitle={project.subtitle}
      >
        <div className="flex flex-wrap justify-center gap-3">
          {project.projectUrl && (
            <Button href={project.projectUrl} primary>
              {t('projects.visit')}
            </Button>
          )}
          {project.githubUrl && (
            <Button href={project.githubUrl} variant="outline">
              {t('projects.github')}
            </Button>
          )}
          {project.githubBackendUrl && (
            <Button href={project.githubBackendUrl} variant="outline">
              {t('projects.backend')}
            </Button>
          )}
        </div>
      </PageHeader>

      <section className="px-5 -mt-4">
        <Reveal className="app-container">
          <ImageSlider images={images} />
        </Reveal>

        <div className="app-container mt-14 md:mt-20 grid gap-10 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-label-3 mb-4">
              {t('projects.builtWith')}
            </p>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <TechChip key={tech} name={tech} />
              ))}
            </div>
          </Reveal>
          <Reveal delay={80} className="md:col-span-8 flex flex-col gap-5">
            {project.description.map((line, i) =>
              Array.isArray(line) ? (
                <ul key={i} className="flex flex-col gap-3">
                  {line.map((item, j) => (
                    <li key={j} className="flex gap-3 text-[17px] leading-relaxed text-label-2">
                      <span className="mt-[11px] size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p key={i} className="headline-2 !text-[24px] md:!text-[28px] text-label">
                  {line}
                </p>
              ),
            )}
          </Reveal>
        </div>

        {more.length > 0 && (
          <div className="app-container mt-24 md:mt-32">
            <Reveal as="h2" className="headline-2 text-label mb-8">
              {t('projects.more')}
            </Reveal>
            <div className="grid gap-6 md:grid-cols-2">
              {more.map((p, i) => (
                <Reveal key={p.id} delay={i * 80}>
                  <Card project={p} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </section>
    </Transition>
  );
}
