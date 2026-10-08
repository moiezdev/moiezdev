import { useId } from 'react';
import { getSkillIcon, readableIconColor } from '../../utils/skillIcons';
import { getProjectsForSkill } from '../../utils/skillProjects';
import techNotes from '../../data/techNotes.json';
import { useContent } from '../../i18n/content';

/**
 * A technology chip. When there's something to say about the tech (a "Used for"
 * note from data/techNotes.json and/or the projects that use it), the chip is a
 * button with a frosted tooltip on hover, keyboard focus and tap.
 */
const TechChip = ({ name, className = '' }) => {
  const { t, lang, localize } = useContent();
  const tipId = useId();
  const skillIcon = getSkillIcon(name);
  const Icon = skillIcon?.Icon;
  const note = techNotes.notes[name]?.[lang] || techNotes.notes[name]?.en;
  const usedIn = getProjectsForSkill(name)
    .slice(0, 4)
    .map((p) => localize({ id: p.id, title: p.title }).title);

  const label = (
    <>
      {Icon && <Icon className="text-[13px] shrink-0" style={{ color: readableIconColor(skillIcon.color) }} aria-hidden />}
      {name}
    </>
  );
  if (!note && !usedIn.length) return <span className={`chip ${className}`}>{label}</span>;

  return (
    <button type="button" className={`chip tech-chip relative z-10 ${className}`} aria-describedby={tipId}>
      {label}
      <span id={tipId} role="tooltip" className="tech-tip glass ring-1 ring-separator">
        {note && (
          <span className="block">
            <span className="font-semibold text-label">{t('tech.usedFor')}: </span>
            {note}
          </span>
        )}
        {usedIn.length > 0 && (
          <span className={`block ${note ? 'mt-1' : ''}`}>
            <span className="font-semibold text-label">{t('tech.usedIn')}: </span>
            {usedIn.join(lang === 'ar' ? '، ' : ', ')}
          </span>
        )}
      </span>
    </button>
  );
};

export default TechChip;
