import { about, chatbot, contacts, education, events, experience, projects, skills } from '../data';
import { getExperienceYears } from '../utils/experience';

const LOW_PRIORITY = new Set(chatbot.lowPriorityProjectIds || []);
const KEYWORDS = chatbot.projectNavKeywords || {};

const PAGE_NAMES = {
  '/': 'Home',
  '/works': 'All works',
  '/experience': 'Experience',
  '/about': 'About',
  '/contact': 'Contact',
  '/cv': 'CV',
};

/** Flatten a project's description blocks into plain lines. */
function projectLines(project, limit = 12) {
  const lines = [];
  for (const block of project.description || []) {
    const items = Array.isArray(block) ? block : [block];
    for (const line of items) {
      if (typeof line === 'string' && line.trim()) lines.push(line.trim());
      if (lines.length >= limit) return lines;
    }
  }
  return lines;
}

/** Compact one-liner for every project, so the bot can link any of them. */
const projectIndex = (project) => ({
  name: project.title,
  path: `/works/${project.id}`,
  what: project.subtitle,
  stack: (project.technologies || []).slice(0, 5),
  ...(LOW_PRIORITY.has(project.id) ? { note: 'in progress / only mention if asked' } : {}),
});

/** Full detail for projects the visitor is asking about or looking at. */
const projectDetail = (project) => ({
  name: project.title,
  path: `/works/${project.id}`,
  what: project.subtitle,
  details: projectLines(project, 10).map((l) => l.slice(0, 220)),
  stack: project.technologies || [],
  live: project.projectUrl || undefined,
  github: project.githubUrl || undefined,
});

/** Score projects against the question (plus the previous one, for follow-ups). */
export function selectRelevantProjects(query = '', { exclude } = {}) {
  const q = String(query).toLowerCase();
  const scored = projects
    .filter((p) => p.id !== exclude)
    .map((p) => {
      let score = 0;
      if (q.includes(p.title.toLowerCase()) || q.includes(p.id)) score += 10;
      for (const k of KEYWORDS[p.id] || []) {
        if (String(k).length > 2 && q.includes(String(k).toLowerCase())) score += 5;
      }
      for (const tech of p.technologies || []) {
        if (tech.length > 2 && q.includes(tech.toLowerCase())) score += 2;
      }
      if (/travel|flight|booking|tour/.test(q) && /travel|tourism|arrival/i.test(`${p.title} ${p.id}`)) score += 4;
      if (LOW_PRIORITY.has(p.id)) score -= 3;
      return { project: p, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((r) => r.project);
}

/**
 * Build the fact sheet the model answers from.
 * @param {string} question
 * @param {{ path?: string, previousQuestion?: string }} [options]
 */
export function buildContext(question = '', { path = '/', previousQuestion = '' } = {}) {
  const profile = chatbot.profile || {};
  const years = getExperienceYears(profile.careerStart ? new Date(profile.careerStart) : undefined);

  const viewingId = path.match(/^\/works\/([^/]+)/)?.[1];
  const viewing = viewingId ? projects.find((p) => p.id === viewingId) : null;

  let relevant = selectRelevantProjects(question, { exclude: viewing?.id });
  if (!relevant.length && previousQuestion) {
    relevant = selectRelevantProjects(previousQuestion, { exclude: viewing?.id });
  }

  const event = events?.[0];

  return {
    visitor: {
      currentPage: PAGE_NAMES[path] || (viewing ? `Project page: ${viewing.title}` : path),
      ...(viewing ? { viewingProject: projectDetail(viewing) } : {}),
    },
    identity: {
      name: profile.name,
      alsoKnownAs: profile.alsoKnownAs,
      title: profile.headline || about.subtitle,
      location: profile.location,
      experienceYears: years,
      summary: profile.identity,
      availability: 'Open to senior full stack engineering and software architect roles, and to freelance/contract projects',
      workAuthorization: profile.iqama,
    },
    // what each kind of visitor needs: recruiters get the pitch, clients get scope + how to start
    forRecruiters: chatbot.audiences?.recruiters,
    forClients: chatbot.audiences?.clients,
    experience: experience.map((job) => ({
      title: job.title,
      company: job.company,
      period: job.period,
      location: job.location,
      current: Boolean(job.current),
      summary: job.summary,
      highlights: (job.highlights || []).slice(0, 4).map((h) => h.slice(0, 180)),
      stack: (job.stack || []).slice(0, 8),
    })),
    relevantProjects: relevant.map(projectDetail),
    allProjects: projects.map(projectIndex),
    skills: Object.fromEntries(skills.map((c) => [c.category, c.items])),
    education: {
      degree: education.degree,
      school: education.school,
      period: education.period,
      languages: education.languages,
    },
    ...(event
      ? {
          events: [
            {
              name: event.name,
              place: event.place?.en,
              note: event.summary?.en,
              seen: event.photos.map((p) => p.caption?.en),
            },
          ],
        }
      : {}),
    contact: {
      email: contacts.find((c) => c.platform === 'Email')?.handle,
      phone: contacts.find((c) => c.platform === 'Phone')?.handle,
      whatsapp: contacts.find((c) => c.platform === 'WhatsApp')?.handle,
      github: contacts.find((c) => c.platform === 'GitHub')?.handle,
      linkedin: contacts.find((c) => c.platform === 'LinkedIn')?.handle,
      portfolio: profile.portfolioUrl,
      cvPage: '/cv',
    },
  };
}
