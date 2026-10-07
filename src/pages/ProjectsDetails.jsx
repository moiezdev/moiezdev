import { Link, useParams } from 'react-router-dom';
import Transition from '../components/functions/Transition';
import ImageSlider from '../components/ui/ImageSlider';
import Img from '../components/ui/Img';
import Button from '../components/ui/Button';
import Reveal from '../components/ui/Reveal';
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
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const [headline, ...body] = project.description;
  const facts = [
    {
      label: t('projects.status'),
      value: project.projectUrl ? t('projects.statusLive') : project.githubUrl ? t('projects.statusOpen') : t('projects.statusPrivate'),
      live: !!project.projectUrl,
    },
    { label: t('projects.stack'), value: t('projects.techCount', { count: project.technologies.length }) },
    { label: t('projects.index'), value: `${String(index + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}` },
  ];
  let n = 0;

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
          <ImageSlider images={images} title={project.title} />
        </Reveal>

        {project.metrics?.length > 0 && (
          <div className="app-container mt-10 md:mt-14 grid grid-cols-3 gap-2 sm:gap-3">
            {project.metrics.map((m, i) => (
              <Reveal key={m.label} delay={i * 80} className="surface min-w-0 p-4 sm:p-6 md:p-7">
                <p className="text-[26px] sm:text-[40px] md:text-[48px] font-bold tracking-[-0.04em] leading-none text-gradient">
                  <span dir="ltr" className="inline-block px-[0.06em]">{m.value}</span>
                </p>
                <p className="mt-2 sm:mt-3 text-[12px] sm:text-[15px] leading-snug text-label-2">{m.label}</p>
              </Reveal>
            ))}
          </div>
        )}

        <div className="app-container mt-14 md:mt-20 grid grid-cols-[minmax(0,1fr)] gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16 items-start">
          <Reveal className="md:sticky md:top-24 flex flex-col gap-6">
            <dl className="surface divide-y divide-separator overflow-hidden !rounded-[20px]">
              {facts.map((f) => (
                <div key={f.label} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <dt className="text-[14px] text-label-3">{f.label}</dt>
                  <dd className="inline-flex items-center gap-2 text-[14px] font-medium text-label">
                    {f.live && <span className="size-1.5 rounded-full bg-green" aria-hidden />}
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-wider text-label-3 mb-3">
                {t('projects.builtWith')}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <TechChip key={tech} name={tech} />
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={80} className="min-w-0 max-w-3xl flex flex-col gap-6">
            {typeof headline === 'string' && (
              <p className="headline-2 !text-[26px] md:!text-[32px] text-label">{headline}</p>
            )}
            {(typeof headline === 'string' ? body : project.description).map((line, i) =>
              Array.isArray(line) ? (
                <ol key={i} className="flex flex-col">
                  {line.map((item) => {
                    n += 1;
                    return (
                      <li key={item} className="flex gap-5 border-t border-separator py-5 first:border-t-0 first:pt-0">
                        <span className="font-mono text-[12px] text-label-3 pt-[5px] w-6 shrink-0" aria-hidden>
                          {String(n).padStart(2, '0')}
                        </span>
                        <span className="text-[17px] leading-relaxed text-label-2">{item}</span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p key={i} className="text-[19px] leading-relaxed text-label">
                  {line}
                </p>
              ),
            )}
          </Reveal>
        </div>

        {projects.length > 1 && (
          <nav aria-label={t('projects.more')} className="app-container mt-24 md:mt-32 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
            {[
              { p: prev, label: t('projects.previous'), dir: 'back' },
              { p: next, label: t('projects.next'), dir: 'forward' },
            ].map(({ p, label, dir }, i) => (
              <Reveal key={dir} delay={i * 80} className="min-w-0">
                <Link
                  to={`/works/${p.id}`}
                  data-cursor-label={t('projects.view')}
                  className={`group surface surface-hover flex items-center gap-4 p-4 md:p-5 h-full ${dir === 'forward' ? 'sm:flex-row-reverse sm:text-end' : ''}`}
                >
                  <span className="relative size-16 md:size-20 shrink-0 overflow-hidden rounded-[14px] bg-surface-2 ring-1 ring-separator">
                    {p.screenshot === false ? (
                      <span className="blueprint absolute inset-0 flex items-center justify-center text-[15px] font-bold text-label">{p.title}</span>
                    ) : (
                      <Img src={p.imageUrl} sizes="80px" className="size-full object-cover transition-transform duration-700 ease-[var(--ease-apple)] group-hover:scale-[1.08]" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`flex items-center gap-1 text-[13px] text-label-3 ${dir === 'forward' ? 'sm:justify-end' : ''}`}>
                      {dir === 'back' && <Chevron dir="back" />}
                      {label}
                      {dir === 'forward' && <Chevron />}
                    </span>
                    <span className="block mt-1 text-[19px] font-semibold tracking-[-0.02em] text-label truncate">{p.title}</span>
                    <span className="block text-[14px] text-label-2 truncate">{p.subtitle}</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </nav>
        )}
      </section>
    </Transition>
  );
}
