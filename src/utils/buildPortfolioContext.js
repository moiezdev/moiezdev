import { about, chatbot, contacts, education, experience, projects, skills } from '../data';
import { getExperienceYears, withExperienceYears } from './experience';

const LOW_PRIORITY_IDS = new Set(chatbot.lowPriorityProjectIds || []);

/** Flatten project description blocks into plain bullet strings. */
function projectBullets(project, limit = 2) {
  const bullets = [];
  for (const block of project.description || []) {
    if (typeof block === 'string') continue;
    if (Array.isArray(block)) {
      for (const line of block) {
        if (typeof line === 'string' && line.trim()) bullets.push(line.trim());
        if (bullets.length >= limit) return bullets;
      }
    }
  }
  return bullets;
}

function formatSkills() {
  return skills
    .map((category) => `${category.category}: ${category.items.join(', ')}`)
    .join('\n');
}

function formatExperience() {
  return experience
    .map((job) => {
      const bullets = (job.highlights || [])
        .slice(0, 4)
        .map((h) => `  - ${h}`)
        .join('\n');
      return `${job.title} @ ${job.company} (${job.location}) | ${job.period}\n${bullets}`;
    })
    .join('\n\n');
}

function formatProjects() {
  const featured = [];
  const lowPriority = [];

  projects.forEach((project, index) => {
    const tech = (project.technologies || []).slice(0, 6).join(', ');
    const url = project.projectUrl ? ` ${project.projectUrl}` : '';
    const bullets = projectBullets(project, 2);
    const summary = bullets[0] || project.subtitle || '';
    const line = `${index + 1}. ${project.title} [${project.id}] — ${project.subtitle}. ${summary} Tech: ${tech}.${url}`;

    if (LOW_PRIORITY_IDS.has(project.id)) {
      lowPriority.push(
        `- ${project.title} [${project.id}] — ${project.subtitle}. Least preferred to showcase unless asked by name.`,
      );
    } else {
      featured.push(line);
    }
  });

  return { featured, lowPriority };
}

function formatContacts() {
  return contacts
    .map((c) => {
      const url = c.url || '';
      // Don't feed mailto:/tel: into the model — it echoes them as junk in replies
      if (/^mailto:/i.test(url) || /^tel:/i.test(url)) {
        return `- ${c.platform}: ${c.handle}`;
      }
      const clean = url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
      return `- ${c.platform}: ${c.handle}${clean ? ` — ${clean}` : ''}`;
    })
    .join('\n');
}

function preferredProjectIds() {
  return projects
    .filter((p) => !LOW_PRIORITY_IDS.has(p.id))
    .map((p) => p.id)
    .join(', ');
}

function resolveCareerStart() {
  const raw = chatbot.profile?.careerStart || '2019-05-01';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function getProfileExperienceYears() {
  return getExperienceYears(resolveCareerStart());
}

/**
 * Build portfolio facts for the chatbot from src/data (single source of truth).
 */
export function buildPortfolioContext() {
  const { profile } = chatbot;
  const aka = (profile.alsoKnownAs || []).join(' / ');
  const { featured, lowPriority } = formatProjects();
  const years = getProfileExperienceYears();

  return `
PROFILE
Name: ${profile.name}${aka ? ` (also known as ${aka})` : ''}
Headline: ${profile.headline || about.subtitle}
Based: ${profile.location}
Career start: ${profile.careerStart || '2019-05-01'}
Experience: ~${years} years (since May 2019)
Identity: ${profile.identity}
Iqama: ${profile.iqama || 'N/A'}
Portfolio: ${profile.portfolioUrl || ''}
Subtitle: ${about.subtitle}

ABOUT
${(about.description || []).map((p) => `- ${p}`).join('\n')}

PROFESSIONAL EXPERIENCE
${formatExperience()}

SKILLS (balanced fullstack — Core Skills + Architectures + Frontend + Backend + Databases)
${formatSkills()}

FEATURED PROJECTS (recommend these first — from data/projects)
${featured.join('\n')}

LOW-PRIORITY / WIP (do NOT recommend unless the visitor asks by name)
${lowPriority.join('\n') || '- (none)'}

EDUCATION
${education.degree} — ${education.school} (${education.period})
Languages: ${(education.languages || []).join(' | ')}

CONTACT
${formatContacts()}

IN-SITE ROUTES (for [[nav:...]] markers)
/ → home
/works → all projects
/works/{id} → project detail (prefer: ${preferredProjectIds()}. Avoid ${[...LOW_PRIORITY_IDS].join('/') || 'none'} unless asked)
/about → about + skills
/contact → contact
`.trim();
}

export const BOT_NAME = chatbot.botName || 'BotFolio';
export const BOT_HANDLE = BOT_NAME.toLowerCase();

export const SYSTEM_PROMPT = withExperienceYears(
  String(chatbot.systemPrompt || '').replaceAll('{{botName}}', BOT_NAME),
);

export const PORTFOLIO_CONTEXT = buildPortfolioContext();
