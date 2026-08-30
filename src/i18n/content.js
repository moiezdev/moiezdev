import ui from './ui.json';
import projectsAr from './projects-ar.json';
import cvCopy from '../data/cv-i18n.json';
import { education, experience, projects, skills } from '../data';
import { getExperienceYears } from '../utils/experience';
import { getProjectsForSkill } from '../utils/skillProjects';
import { useMemo } from 'react';
import { usePreferences } from '../context/Preferences';

function fill(str, vars) {
  return String(str).replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key === 'experienceYears') return String(getExperienceYears());
    return vars[key] ?? '';
  });
}

export function t(lang, path, vars = {}) {
  const locale = lang === 'ar' ? 'ar' : 'en';
  const keys = path.split('.');
  let node = ui[locale];
  let fallback = ui.en;
  for (const key of keys) {
    node = node?.[key];
    fallback = fallback?.[key];
  }
  const value = node ?? fallback;
  if (typeof value === 'string') return fill(value, vars);
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'string' ? fill(item, vars) : item));
  }
  return value;
}

export function localizeProject(project, lang) {
  if (!project || lang !== 'ar') return project;
  const ar = projectsAr[project.id];
  if (!ar) return project;
  return { ...project, ...ar };
}

export function localizeProjects(lang) {
  return projects.map((project) => localizeProject(project, lang));
}

export function localizeJobs(lang) {
  const jobsCopy = cvCopy[lang === 'ar' ? 'ar' : 'en']?.jobs || {};
  return experience.map((job) => {
    const local = jobsCopy[job.id] || {};
    return {
      ...job,
      title: local.title || job.title,
      location: local.location || job.location,
      period: local.period || job.period,
      highlights: local.highlights || job.highlights,
      summary: local.summary || job.summary,
    };
  });
}

export function localizeEducation(lang) {
  if (lang !== 'ar') return education;
  return { ...education, ...cvCopy.ar.education };
}

export function localizeSkills(lang) {
  const cats = cvCopy[lang === 'ar' ? 'ar' : 'en']?.skillCategories || {};
  return skills.map((group) => ({
    ...group,
    categoryKey: group.category,
    category: cats[group.category] || group.category,
  }));
}

export function skillPracticeMessage(lang, skillName) {
  const list = getProjectsForSkill(skillName);
  if (!list.length) return null;

  const titles = list.map((item) => localizeProject({ id: item.id, title: item.title }, lang).title);
  if (titles.length === 1) return t(lang, 'skills.practicedOne', { name: titles[0] });
  if (titles.length === 2) return t(lang, 'skills.practicedTwo', { a: titles[0], b: titles[1] });

  const joiner = lang === 'ar' ? '، ' : ', ';
  return t(lang, 'skills.practicedMany', {
    head: titles.slice(0, -1).join(joiner),
    last: titles[titles.length - 1],
  });
}

export function skillProjectCountLabel(lang, count) {
  return t(lang, count === 1 ? 'skills.projectCount' : 'skills.projectCountPlural', { count });
}

export function useContent() {
  const { lang } = usePreferences();
  return useMemo(
    () => ({
      lang,
      t: (path, vars) => t(lang, path, vars),
      jobs: localizeJobs(lang),
      education: localizeEducation(lang),
      skills: localizeSkills(lang),
      projects: localizeProjects(lang),
      localize: (project) => localizeProject(project, lang),
    }),
    [lang],
  );
}
