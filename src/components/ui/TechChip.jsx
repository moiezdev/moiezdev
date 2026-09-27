import { getSkillIcon, readableIconColor } from '../../utils/skillIcons';

const TechChip = ({ name, className = '' }) => {
  const skillIcon = getSkillIcon(name);
  const Icon = skillIcon?.Icon;
  return (
    <span className={`chip ${className}`} title={name}>
      {Icon && <Icon className="text-[13px] shrink-0" style={{ color: readableIconColor(skillIcon.color) }} aria-hidden />}
      {name}
    </span>
  );
};

export default TechChip;
