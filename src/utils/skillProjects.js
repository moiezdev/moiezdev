import { projects } from '../data';
import { chatbot } from '../data';

const LOW_PRIORITY = new Set(chatbot.lowPriorityProjectIds || []);

const normalize = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

/**
 * Projects where this skill/tech appears in technologies[].
 * Prefers featured projects first; still includes WIP if tagged.
 */
export function getProjectsForSkill(skillName) {
  const key = normalize(skillName);
  if (!key) return [];

  return projects
    .filter((project) =>
      (project.technologies || []).some((tech) => normalize(tech) === key),
    )
    .map((project) => ({
      id: project.id,
      title: project.title,
      lowPriority: LOW_PRIORITY.has(project.id),
    }))
    .sort((a, b) => Number(a.lowPriority) - Number(b.lowPriority));
}

/** Chat-style copy — no AI. */
export function getSkillExperienceMessage(skillName) {
  const list = getProjectsForSkill(skillName);
  if (!list.length) return null;

  const titles = list.map((p) => p.title);
  if (titles.length === 1) {
    return `This was practiced during ${titles[0]}.`;
  }
  if (titles.length === 2) {
    return `This was practiced during ${titles[0]} and ${titles[1]}.`;
  }

  const head = titles.slice(0, -1).join(', ');
  const last = titles[titles.length - 1];
  return `This was practiced during ${head}, and ${last}.`;
}
