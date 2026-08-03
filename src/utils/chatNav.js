import { chatbot, projects } from '../data';

/** In-site destinations the portfolio chatbot can offer as quick navigation. */
export const SITE_NAV = {
  about: { label: 'About Moiz', to: '/about' },
  contact: { label: 'Contact page', to: '/contact' },
  works: { label: 'All works', to: '/works' },
  home: { label: 'Home', to: '/' },
};

const LOW_PRIORITY_IDS = new Set(chatbot.lowPriorityProjectIds || []);
const keywordOverrides = chatbot.projectNavKeywords || {};

/** Built from data/projects + optional keyword overrides in chatbot.json */
export const PROJECT_NAV = projects.map((project) => {
  const fromId = project.id.split('-').filter(Boolean);
  const overrides = keywordOverrides[project.id] || [];
  return {
    id: project.id,
    title: project.title,
    keywords: [...new Set([project.id, project.title.toLowerCase(), ...fromId, ...overrides])],
    lowPriority: LOW_PRIORITY_IDS.has(project.id),
  };
});

const LOW_PRIORITY_PATHS = new Set(
  [...LOW_PRIORITY_IDS].map((id) => `/works/${id}`),
);

const lowPriorityNamePattern = new RegExp(
  `\\b(${[...LOW_PRIORITY_IDS].join('|') || '___none___'})\\b`,
  'i',
);

const askedForLowPriority = (question = '') => lowPriorityNamePattern.test(question);

const addUnique = (list, link) => {
  if (!link?.to || list.some((l) => l.to === link.to)) return;
  list.push(link);
};

/** Drop low-priority project links unless the user asked for them by name. */
const filterLowPriority = (links, question = '') => {
  if (askedForLowPriority(question)) return links;
  return links.filter((l) => !LOW_PRIORITY_PATHS.has(l.to));
};

/**
 * Pick up to 3 in-app nav chips from the latest Q&A.
 */
export function resolveChatNav(question = '', answer = '') {
  const q = question.toLowerCase();
  const hay = `${question} ${answer}`.toLowerCase();
  const links = [];
  const allowLow = askedForLowPriority(question);

  for (const project of PROJECT_NAV) {
    if (project.lowPriority && !allowLow) continue;
    const matchIn = project.lowPriority ? q : hay;
    if (project.keywords.some((k) => matchIn.includes(String(k).toLowerCase()))) {
      addUnique(links, {
        label: `Open ${project.title}`,
        to: `/works/${project.id}`,
      });
    }
  }

  if (/contact|email|hire|reach|linkedin|github|phone|whatsapp|get in touch/.test(hay)) {
    addUnique(links, SITE_NAV.contact);
  }

  if (/about|who is|background|experience|riyadh|bio|about me|senior|engineer/.test(hay)) {
    addUnique(links, SITE_NAV.about);
  }

  if (/skill|stack|tech|framework|product ownership|ui\/?ux|core skill|strength/.test(hay)) {
    addUnique(links, { label: 'View skills', to: '/about' });
  }

  if (
    /project|work|portfolio|built|flight|booking|highlight/.test(hay) ||
    links.some((l) => l.to.startsWith('/works/'))
  ) {
    addUnique(links, SITE_NAV.works);
  }

  if (!links.length && /^(hi|hey|hello|yo|sup)\b/.test(q.trim())) {
    addUnique(links, SITE_NAV.works);
    addUnique(links, SITE_NAV.about);
    addUnique(links, SITE_NAV.contact);
  }

  return filterLowPriority(links, question).slice(0, 3);
}

/**
 * Optional LLM markers: [[nav:/works|All works]]
 * Returns { cleanText, links }.
 */
export function extractNavMarkers(text = '') {
  const links = [];
  const cleanText = text
    .replace(/\[\[nav:(\/[^|\]]+)\|([^\]]+)\]\]/gi, (_, to, label) => {
      addUnique(links, { to: to.trim(), label: label.trim() });
      return '';
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { cleanText, links };
}

export function mergeNavLinks(question, ...groups) {
  const out = [];
  for (const group of groups) {
    for (const link of group || []) addUnique(out, link);
  }
  return filterLowPriority(out, question || '').slice(0, 3);
}
