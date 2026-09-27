import { useMemo, useState } from 'react';
import Card from '../components/ui/Card';
import Reveal from '../components/ui/Reveal';
import PageHeader from '../components/ui/PageHeader';
import Transition from '../components/functions/Transition';
import { getSkillIcon, readableIconColor } from '../utils/skillIcons';
import { useContent } from '../i18n/content';

const ALL = '__all__';

const Projects = () => {
  const { t, projects } = useContent();
  const [filter, setFilter] = useState(ALL);

  // the most-used technologies become filters
  const filters = useMemo(() => {
    const counts = new Map();
    projects.forEach((p) => (p.technologies || []).forEach((tech) => counts.set(tech, (counts.get(tech) || 0) + 1)));
    return [...counts.entries()]
      .filter(([, n]) => n > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tech]) => tech);
  }, [projects]);

  const shown = filter === ALL ? projects : projects.filter((p) => p.technologies?.includes(filter));

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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((project, i) => (
              <Reveal key={project.id} delay={(i % 3) * 80}>
                <Card project={project} maxTech={3} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </Transition>
  );
};

export default Projects;
