import { about, chatbot, contacts, experience, projects, skills } from '../data';
import { getExperienceYears } from '../utils/experience';

const MAX_CONTEXT_CHARS = 1800;
const LOW_PRIORITY = new Set(chatbot.lowPriorityProjectIds || []);
const KEYWORDS = chatbot.projectNavKeywords || {};

/** Pull short impact lines from project description arrays. */
function projectSummary(project, limit = 1) {
  const lines = [];
  for (const block of project.description || []) {
    if (typeof block === 'string') continue;
    if (!Array.isArray(block)) continue;
    for (const line of block) {
      if (typeof line === 'string' && line.trim()) lines.push(line.trim());
      if (lines.length >= limit) return lines;
    }
  }
  return lines;
}

/** Prefer description lines that mention measurable impact. */
function projectImpact(project) {
  const lines = projectSummary(project, 8);
  const withMetric = lines.filter((l) => /\d+\s*%|~\d+|approx/i.test(l));
  return (withMetric[0] || lines[0] || project.subtitle || '').slice(0, 160);
}

function mapProject(project) {
  return {
    id: project.id,
    name: project.title,
    path: `/works/${project.id}`,
    summary: (project.subtitle || projectSummary(project, 1)[0] || '').slice(0, 120),
    impact: projectImpact(project),
    stack: (project.technologies || []).slice(0, 6),
  };
}

/**
 * Derive highlight bullets from experience.json (metric-heavy lines first).
 */
export function extractHighlights(limit = 4) {
  const all = experience.flatMap((job) => job.highlights || []);
  const scored = all
    .map((text) => ({
      text,
      score: /\d+\s*%|~\d+|8\+|10K/i.test(text) ? 2 : 0,
    }))
    .sort((a, b) => b.score - a.score);

  const picks = [];
  for (const row of scored) {
    if (picks.length >= limit) break;
    if (!picks.includes(row.text)) picks.push(row.text);
  }
  return picks.map((t) => t.slice(0, 140));
}

/**
 * Score + filter projects for the visitor query (max 3).
 */
export function selectRelevantProjects(query = '') {
  const q = String(query).toLowerCase();
  const wantsProjects = /project|work|portfolio|built|show|highlight|pos|flight|booking|saas|hire|why|ai|loyalty/.test(
    q,
  );

  const scored = projects
    .filter((p) => !LOW_PRIORITY.has(p.id))
    .map((p) => {
      const keys = KEYWORDS[p.id] || [];
      let score = 0;
      if (q.includes(p.title.toLowerCase()) || q.includes(p.id)) score += 10;
      for (const k of keys) {
        if (q.includes(String(k).toLowerCase())) score += 5;
      }
      if (q.includes('pos') && /pos/i.test(p.title)) score += 6;
      if (q.includes('travel') && /travel|tourism|arrival/i.test(`${p.title} ${p.id}`)) score += 5;
      if (q.includes('saas') && /saas/i.test(`${p.title} ${p.id}`)) score += 5;
      return { project: p, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const chosen = scored.length
    ? scored.slice(0, 3).map((r) => r.project)
    : wantsProjects
      ? projects.filter((p) => !LOW_PRIORITY.has(p.id)).slice(0, 3)
      : projects.filter((p) => !LOW_PRIORITY.has(p.id)).slice(0, 1);

  return chosen.map(mapProject);
}

/**
 * Transform existing /src/data → compact AI context (no duplicated JSON).
 */
export function buildContext(query = '') {
  const profile = chatbot.profile || {};
  const years = getExperienceYears(
    profile.careerStart ? new Date(profile.careerStart) : undefined,
  );

  const coreSkills =
    skills.find((c) => c.category === 'Core Skills')?.items?.slice(0, 6) || [];
  const stackSkills = ['Frontend', 'Backend', 'Databases', 'AI & Automation']
    .flatMap((cat) => skills.find((c) => c.category === cat)?.items?.slice(0, 4) || []);

  const context = {
    identity: {
      name: profile.name,
      alsoKnownAs: profile.alsoKnownAs,
      title: profile.headline || about.subtitle,
      location: profile.location,
      experienceYears: years,
      summary: profile.identity || about.description?.[0]?.slice?.(0, 180),
    },
    highlights: extractHighlights(4),
    skills: [...coreSkills, ...stackSkills].slice(0, 12),
    experience: experience.slice(0, 3).map((job) => ({
      title: job.title,
      company: job.company,
      period: job.period,
      focus: (job.highlights || []).slice(0, 2),
    })),
    contact: {
      email: contacts.find((c) => c.platform === 'Email')?.handle,
      phone: contacts.find((c) => c.platform === 'Phone')?.handle,
      github: contacts.find((c) => c.platform === 'GitHub')?.handle,
      linkedin: contacts.find((c) => c.platform === 'LinkedIn')?.handle,
      portfolio: profile.portfolioUrl,
    },
    relevantProjects: selectRelevantProjects(query),
  };

  const packed = JSON.stringify(context);
  if (packed.length <= MAX_CONTEXT_CHARS) return context;

  return {
    identity: context.identity,
    highlights: context.highlights.slice(0, 3),
    relevantProjects: context.relevantProjects,
    contact: context.contact,
  };
}
