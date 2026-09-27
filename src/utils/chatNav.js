import { chatbot, projects } from '../data';

/** In-site destinations the portfolio chatbot can offer as quick navigation. */
export const SITE_NAV = {
  about: { label: 'About Moiz', to: '/about' },
  experience: { label: 'Experience', to: '/experience' },
  contact: { label: 'Contact page', to: '/contact' },
  works: { label: 'All works', to: '/works' },
  cv: { label: 'CV', to: '/cv' },
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

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Turn [[nav:/path|Label]] markers into visible label text + click spans.
 */
export function materializeInlineNav(text = '') {
  const spans = [];
  let result = '';
  const re = /\[\[nav:(\/[^|\]]+)\|([^\]]+)\]\]/gi;
  let lastIndex = 0;
  let m;
  const src = String(text);

  while ((m = re.exec(src))) {
    result += src.slice(lastIndex, m.index);
    const to = m[1].trim();
    const label = m[2].trim();
    const start = result.length;
    result += label;
    spans.push({ start, end: result.length, to, label });
    lastIndex = m.index + m[0].length;
  }

  result += src.slice(lastIndex);
  return { text: result, spans };
}

const overlaps = (a, b) => a.start < b.end && b.start < a.end;

/** Match titles with flexible spaces/hyphens: "TWLM - POS" ↔ "TWLM POS". */
function flexibleLabelRe(label) {
  const parts = String(label)
    .split(/[\s\-–—]+/)
    .filter(Boolean)
    .map(escapeRe);
  if (!parts.length) return null;
  return new RegExp(`\\b${parts.join('[\\s\\-–—]*')}\\b`, 'gi');
}

/**
 * Auto-link project titles (and common variants) + site phrases in the reply body.
 */
export function addEntitySpans(text = '', existing = []) {
  const spans = [...existing];
  const src = String(text);

  const candidates = [];

  for (const p of PROJECT_NAV) {
    if (p.lowPriority) continue;
    const to = `/works/${p.id}`;
    const labels = new Set([p.title]);

    // Hyphen/space variants of the title
    labels.add(p.title.replace(/\s*[-–—]\s*/g, ' '));
    labels.add(p.title.replace(/\s*[-–—]\s*/g, '-'));

    // Multi-word / distinctive keyword aliases (e.g. "twlm pos")
    for (const k of p.keywords) {
      const key = String(k).trim();
      if (key.length >= 6 || /\s/.test(key)) labels.add(key);
    }

    for (const label of labels) {
      candidates.push({ label, to });
    }
  }

  candidates.push(
    { label: 'About Moiz', to: '/about' },
    { label: 'Experience', to: '/experience' },
    { label: 'Contact page', to: '/contact' },
    { label: 'All works', to: '/works' },
    { label: 'Skills page', to: '/about' },
  );

  candidates.sort((a, b) => b.label.length - a.label.length);

  for (const { label, to } of candidates) {
    if (!label || label.length < 3) continue;
    const re = flexibleLabelRe(label);
    if (!re) continue;
    let m;
    while ((m = re.exec(src))) {
      const span = { start: m.index, end: m.index + m[0].length, to, label: m[0] };
      // Don't turn the local-part of an email (e.g. "moiezdev" in moiezdev@…) into a nav link
      if (src[span.end] === '@') continue;
      if (spans.some((s) => overlaps(s, span))) continue;
      spans.push(span);
    }
  }

  return spans.sort((a, b) => a.start - b.start);
}

/** Default label for an in-site path, e.g. "/works" → "All works". */
function labelForPath(path) {
  const site = Object.values(SITE_NAV).find((n) => n.to === path);
  if (site) return site.label;
  const id = path.match(/^\/works\/([^/]+)$/)?.[1];
  return PROJECT_NAV.find((p) => p.id === id)?.title || null;
}

/**
 * Replies cut off by the token limit can end inside a marker ("Explore [[nav:/works|").
 * Close it when the path is usable, otherwise drop the fragment so no raw markup shows.
 */
export function repairTruncatedNav(text = '') {
  const src = String(text);
  const start = src.lastIndexOf('[[');
  if (start === -1 || src.indexOf(']]', start) !== -1) return src;

  const fragment = src.slice(start);
  const m = fragment.match(/^\[\[nav:(\/[^|\]\s]*)(?:\|([^\]]*))?\]?$/i);
  const before = src.slice(0, start);
  if (!m) return before.trimEnd();

  // a label cut off mid-word is unreliable, so use the known name for the path
  const label = labelForPath(m[1]);
  if (!label) return before.trimEnd();
  return `${before}[[nav:${m[1]}|${label}]]`;
}

/**
 * Full pipeline: sanitize → repair truncated markers → materialize markers → auto-link entities.
 */
export function prepareBotReply(raw = '') {
  const sanitized = repairTruncatedNav(sanitizeBotText(raw));
  const { text, spans: navSpans } = materializeInlineNav(sanitized);
  const spans = addEntitySpans(text, navSpans);
  return { text, spans };
}

/**
 * Strip HTML / markdown junk models sometimes leak into the chat bubble.
 * Keeps [[nav:...|...]] markers for materializeInlineNav.
 */
export function sanitizeBotText(text = '') {
  let t = String(text);

  t = t.replace(/<\s*br\s*\/?\s*>/gi, '\n');
  t = t.replace(/<\/\s*(p|div|li|h[1-6]|tr)\s*>/gi, '\n');
  t = t.replace(/<\s*(p|div|li|h[1-6]|tr)[^>]*>/gi, '');
  t = t.replace(/<[^>]+>/g, '');

  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const u = String(url).trim();
    const name = String(label).trim();
    if (/^mailto:/i.test(u)) return u.replace(/^mailto:/i, '');
    if (/^tel:/i.test(u)) return u.replace(/^tel:/i, '');
    if (!name) return u.replace(/^https?:\/\//i, '');
    return name;
  });

  // markdown the model sometimes leaks: **bold**, __bold__, headings, * bullets, `code`
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1');
  t = t.replace(/^#{1,6}\s+/gm, '');
  t = t.replace(/^\s*[*-]\s+/gm, '• ');
  t = t.replace(/`([^`]+)`/g, '$1');

  t = t.replace(/\s*\(\s*mailto:[^)]+\)/gi, '');
  t = t.replace(/\s*\(\s*tel:[^)]+\)/gi, '');
  t = t.replace(/\bmailto:/gi, '');
  t = t.replace(/\btel:/gi, '');

  t = t
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");

  t = t.replace(/[\u200B-\u200D\uFEFF]/g, '');
  t = t.replace(/\u00A0/g, ' ');
  t = t.replace(/[ \t]+\n/g, '\n');
  t = t.replace(/\n{3,}/g, '\n\n');
  t = t.replace(/[ \t]{2,}/g, ' ');

  return t.trim();
}
