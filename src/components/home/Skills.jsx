import SectionTitle from '../ui/SectionTitle';
import Reveal from '../../motion/Reveal';
import { getSkillIcon, readableIconColor } from '../../utils/skillIcons';
import { getProjectsForSkill } from '../../utils/skillProjects';
import { skillPracticeMessage, skillProjectCountLabel, useContent } from '../../i18n/content';

const TECHNICAL_CATEGORIES = new Set([
  'Frontend',
  'Backend',
  'Databases',
  'Programming Languages',
  'Tools & Platforms',
  'Design & Prototyping',
  'Integrations',
  'AI & Automation',
]);

/** Popover listing the projects that used this skill. */
const SkillTip = ({ name }) => {
  const { lang } = useContent();
  const message = skillPracticeMessage(lang, name);
  const related = getProjectsForSkill(name);
  if (!message) return null;

  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-1/2 bottom-full z-30 mb-2.5 w-max max-w-[260px] -translate-x-1/2 translate-y-1 opacity-0 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100 transition-[opacity,transform,translate,scale] duration-(--dur-fast) ease-(--ease-spring) origin-bottom"
    >
      <span className="block glass ring-1 ring-separator rounded-2xl px-3.5 py-3 text-start shadow-xl">
        <span className="block text-[13px] font-semibold text-label mb-1">{name}</span>
        <span className="block text-[12px] leading-relaxed text-label-2 whitespace-normal">{message}</span>
        {related.length > 0 && (
          <span className="block text-[11px] text-accent font-medium mt-2">
            {skillProjectCountLabel(lang, related.length)}
          </span>
        )}
      </span>
    </span>
  );
};

const SkillChip = ({ name }) => {
  const { lang } = useContent();
  const skillIcon = getSkillIcon(name);
  const Icon = skillIcon?.Icon;
  const hasProjects = getProjectsForSkill(name).length > 0;

  return (
    <span
      className={`group relative chip py-1.5 transition-colors ${hasProjects ? 'cursor-help hover:bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)]' : ''}`}
      tabIndex={hasProjects ? 0 : undefined}
      aria-label={hasProjects ? `${name}. ${skillPracticeMessage(lang, name)}` : undefined}
    >
      {Icon && <Icon className="text-[15px] shrink-0" style={{ color: readableIconColor(skillIcon.color) }} aria-hidden />}
      {name}
      {hasProjects && <SkillTip name={name} />}
    </span>
  );
};

const SkillCard = ({ skill }) => (
  <div className="surface p-6 md:p-7 h-full">
    <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-label mb-4">{skill.category}</h3>
    <div className="flex flex-wrap gap-2">
      {skill.items.map((item) => (
        <SkillChip key={item} name={item} />
      ))}
    </div>
  </div>
);

const Skills = () => {
  const { t, skills } = useContent();
  const technical = skills.filter((s) => TECHNICAL_CATEGORIES.has(s.categoryKey));
  const other = skills.filter((s) => !TECHNICAL_CATEGORIES.has(s.categoryKey));

  return (
    <section className="w-full px-5 pt-28 md:pt-40" id="skills">
      <div className="app-container">
        <SectionTitle eyebrow={t('skills.eyebrow')} title={t('skills.headline')} subtitle={t('skills.core')} />

        <Reveal as="h3" className="text-[13px] font-semibold uppercase tracking-wider text-label-3 mb-4">
          {t('skills.technical')}
        </Reveal>
        <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {technical.map((skill) => (
            <SkillCard key={skill.category} skill={skill} />
          ))}
        </Reveal>

        {other.length > 0 && (
          <>
            <Reveal as="h3" className="text-[13px] font-semibold uppercase tracking-wider text-label-3 mt-12 mb-4">
              {t('skills.other')}
            </Reveal>
            <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {other.map((skill) => (
                <SkillCard key={skill.category} skill={skill} />
              ))}
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
};

export default Skills;
