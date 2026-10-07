import { useMemo, useState } from 'react';
import Card from '../components/ui/Card';
import FeaturedCard from '../components/ui/FeaturedCard';
import Reveal from '../components/ui/Reveal';
import PageHeader from '../components/ui/PageHeader';
import Transition from '../components/functions/Transition';
import { getSkillIcon, readableIconColor } from '../utils/skillIcons';
import { useContent } from '../i18n/content';
import { isCoreTech, sortTech } from '../utils/techRank';

const ALL = '__all__';

const Projects = () => {
  const { t, projects } = useContent();
  const [filter, setFilter] = useState(ALL);

  // filters: core technologies plus any shared by several projects, most relevant first
  const filters = useMemo(() => {
    const counts = new Map();
    projects.forEach((p) => (p.technologies || []).forEach((tech) => counts.set(tech, (counts.get(tech) || 0) + 1)));
    const candidates = [...counts.keys()].filter((tech) => counts.get(tech) > 1 || isCoreTech(tech));
    return sortTech(candidates).slice(0, 8);
  }, [projects]);

  const finished = projects.filter((p) => p.status !== 'in-progress');
  const inProgress = projects.filter((p) => p.status === 'in-progress');
  const shown = filter === ALL ? finished : finished.filter((p) => p.technologies?.includes(filter));

  const chip = (value, label, Icon, color) => (
    <button
      key={value}
      type="button"
      onClick={() => setFilter(value)}
      aria-pressed={filter === value}
      className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[14px] font-medium transition-all duration-300 ${
        filter === value ? 'bg-label text-bg shadow-sm' : 'bg-fill text-label hover:bg-[color-mix(in_srgb,var(--color-fill)_170%,transparent)]'
      }`}
    >
      {Icon && <Icon className="text-[14px]" style={{ color: filter === value ? 'currentColor' : readableIconColor(color) }} aria-hidden />}
      {label}
    </button>
  );

  return (
    <Transition>
      <PageHeader eyebrow={t('projects.eyebrow')} title={t('projects.pageTitle')} subtitle={t('projects.list')} />
      <section className="w-full px-5">
        <div className="app-container">
          <Reveal className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {chip(ALL, t('projects.all'))}
            {filters.map((tech) => {
              const icon = getSkillIcon(tech);
              return chip(tech, tech, icon?.Icon, icon?.color);
            })}
          </Reveal>
          <p className="text-center text-[13px] text-label-3 mb-10 font-mono" aria-live="polite">
            {t('projects.count', { count: shown.length })}
          </p>
          {filter === ALL && finished[0] && (
            <Reveal className="mb-6">
              <FeaturedCard project={finished[0]} />
            </Reveal>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(filter === ALL ? shown.slice(1) : shown).map((project, i) => (
              <Reveal key={project.id} delay={(i % 3) * 80}>
                <Card project={project} maxTech={3} />
              </Reveal>
            ))}
          </div>

          {filter === ALL && inProgress.length > 0 && (
            <div className="mt-20 md:mt-24">
              <Reveal as="h2" className="headline-2 text-label mb-2">
                {t('projects.inProgress')}
              </Reveal>
              <Reveal as="p" className="text-[15px] text-label-2 mb-8">
                {t('projects.inProgressBlurb')}
              </Reveal>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {inProgress.map((project, i) => (
                  <Reveal key={project.id} delay={(i % 3) * 80}>
                    <Card project={project} maxTech={3} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </Transition>
  );
};

export default Projects;
