import experience from '../data/experience.json';
import skills from '../data/skills.json';
import contacts from '../data/contacts.json';
import education from '../data/education.json';
import copy from '../data/cv-i18n.json';
import { withExperienceYears } from './experience';

export const CV_LANGS = ['en', 'ar'];
export const CV_THEMES = ['light', 'dark'];

export function normalizeCvLang(value) {
  return value === 'ar' ? 'ar' : 'en';
}

export function normalizeCvTheme(value) {
  return value === 'dark' ? 'dark' : 'light';
}

export function getCv(lang = 'en') {
  const locale = normalizeCvLang(lang);
  const t = copy[locale];
  const jobsCopy = t.jobs || {};

  const jobs = experience.map((job) => {
    const local = jobsCopy[job.id] || {};
    return {
      id: job.id,
      title: local.title || job.title,
      company: job.company,
      location: local.location || job.location,
      period: local.period || job.period,
      current: job.current,
      highlights: local.highlights || job.highlights,
    };
  });

  const skillGroups = skills.map((group) => ({
    category: t.skillCategories?.[group.category] || group.category,
    items: group.items,
  }));

  const contact = {
    email: contacts.find((c) => c.platform === 'Email')?.handle,
    phone: contacts.find((c) => c.platform === 'Phone')?.handle,
    github: contacts.find((c) => c.platform === 'GitHub')?.handle,
    linkedin: 'linkedin.com/in/moiezdev',
    site: 'www.moiez.dev',
  };

  return {
    lang: locale,
    dir: locale === 'ar' ? 'rtl' : 'ltr',
    name: t.name,
    headline: t.headline,
    location: t.location,
    iqama: t.iqama,
    summary: withExperienceYears(t.summary),
    labels: t.labels,
    education: locale === 'ar' ? t.education : education,
    jobs,
    skillGroups,
    contact,
  };
}
