import { useMemo, useState } from 'react';
import Card from '../components/ui/Card';
import FeaturedCard from '../components/ui/FeaturedCard';
import Reveal from '../motion/Reveal';
import PageHeader from '../components/ui/PageHeader';
import Transition from '../components/functions/Transition';
import { Chevron } from '../components/ui/SectionTitle';
import { getSkillIcon, readableIconColor } from '../utils/skillIcons';
import { useContent } from '../i18n/content';
import { isCoreTech, sortTech } from '../utils/techRank';

const ALL = '__all__';

const Group = ({ title, blurb, children }) => (
  <section className="mt-14 md:mt-16 first:mt-0">
    <Reveal className="mb-6 md:mb-8">
      <h2 className="headline-2 text-label">{title}</h2>
      {blurb && <p className="mt-2 text-[15px] text-label-2">{blurb}</p>}
    </Reveal>
    {children}
  </section>
);

const CardGrid = ({ list }) => (
  <Reveal className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {list.map((project) => (
      <div key={project.id}>
        <Card project={project} />
      </div>
    ))}
  </Reveal>
);

const Projects = () => {
  const { t, lang, projects } = useContent();
  const [filter, setFilter] = useState(ALL);
  // "13 projects" / Arabic's six plural forms ("مشروعان", "5 مشاريع", "13 مشروعًا")
  const countLabel = (n) => {
    const forms = t('projects.countForms');
    const form = n === 0 && forms.zero ? 'zero' : new Intl.PluralRules(lang).select(n);
    return (forms[form] ?? forms.other).replace('{{count}}', String(n));
  };

  // filters: core technologies plus any shared by several projects, most relevant first
  const filters = useMemo(() => {
    const counts = new Map();
    projects.forEach((p) => (p.technologies || []).forEach((tech) => counts.set(tech, (counts.get(tech) || 0) + 1)));
    const candidates = [...counts.keys()].filter((tech) => counts.get(tech) > 1 || isCoreTech(tech));
    return sortTech(candidates).slice(0, 8);
  }, [projects]);

  const finished = projects.filter((p) => p.status !== 'in-progress');
  const inProgress = projects.filter((p) => p.status === 'in-progress');
  const featured = finished.filter((p) => p.featured);
  const client = finished.filter((p) => !p.featured && p.group !== 'earlier');
  const earlier = finished.filter((p) => !p.featured && p.group === 'earlier');
  const shown = filter === ALL ? finished : finished.filter((p) => p.technologies?.includes(filter));

  const chip = (value, label, Icon, color) => (
    <button
      key={value}
      type="button"
      onClick={() => setFilter(value)}
      aria-pressed={filter === value}
      className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[14px] font-medium btn-press ${
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
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {chip(ALL, t('projects.all'))}
            {filters.map((tech) => {
              const icon = getSkillIcon(tech);
              return chip(tech, tech, icon?.Icon, icon?.color);
            })}
          </div>
          <p className="text-center text-[13px] text-label-3 mb-10 font-mono" aria-live="polite">
            {countLabel(shown.length)}
          </p>
          {filter === ALL ? (
            <>
              {featured.length > 0 && (
                <Group title={t('projects.groupFeatured')}>
                  <div className="flex flex-col gap-6">
                    {featured.map((project) => (
                      <Reveal key={project.id}>
                        <FeaturedCard project={project} />
                      </Reveal>
                    ))}
                  </div>
                </Group>
              )}

              {client.length > 0 && (
                <Group title={t('projects.groupClient')} blurb={t('projects.groupClientBlurb')}>
                  <CardGrid list={client} />
                </Group>
              )}

              {inProgress.length > 0 && (
                <Group title={t('projects.inProgress')} blurb={t('projects.inProgressBlurb')}>
                  <CardGrid list={inProgress} />
                </Group>
              )}

              {earlier.length > 0 && (
                <Reveal as="details" className="group/earlier mt-16 md:mt-20 border-t border-separator">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                    <span>
                      <span className="block text-[21px] md:text-[24px] font-semibold tracking-[-0.02em] text-label">
                        {t('projects.groupEarlier')} <span className="text-label-3 font-normal">({earlier.length})</span>
                      </span>
                      <span className="block mt-1 text-[15px] text-label-2">{t('projects.groupEarlierBlurb')}</span>
                    </span>
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-fill text-label transition-transform duration-(--dur-base) group-open/earlier:rotate-180" aria-hidden>
                      <Chevron dir="down" />
                    </span>
                  </summary>
                  <div className="pb-4">
                    <CardGrid list={earlier} />
                  </div>
                </Reveal>
              )}
            </>
          ) : (
            <CardGrid list={shown} />
          )}
        </div>
      </section>
    </Transition>
  );
};

export default Projects;
