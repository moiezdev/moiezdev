import aboutRaw from './about.json';
import { withExperienceYears } from '../utils/experience';

export { default as skills } from './skills.json';
export { default as contacts } from './contacts.json';
export { default as chatbot } from './chatbot.json';
export { default as experience } from './experience.json';
export { default as education } from './education.json';
export { default as events } from './events.json';
export { projects, allProjects, getProjectById } from './projects.js';

export const about = {
  ...aboutRaw,
  description: (aboutRaw.description || []).map(withExperienceYears),
};
