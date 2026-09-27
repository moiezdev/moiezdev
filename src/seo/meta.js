/**
 * Page titles, descriptions and share images for every route.
 *
 * Plain ESM with no imports, so both the app (live tab titles) and the build
 * (static HTML per route, read by LinkedIn/WhatsApp/X/Google) use it.
 */
export const SITE_URL = 'https://www.moiez.dev';
export const SITE_NAME = 'Moieez ur Rehman';

const HOME = {
  title: 'Moieez ur Rehman — Senior Full Stack Software Engineer',
  description:
    'Senior Full Stack Engineer in Riyadh building POS, loyalty, payments, booking and AI products end to end with React, Vue, Next.js, Node.js and NestJS.',
  image: '/og-image.jpg',
};

const PAGES = {
  '/': HOME,
  '/works': {
    title: `Work · ${SITE_NAME}`,
    description:
      'Products, platforms and sites designed and built end to end — POS and loyalty systems, travel booking, SaaS and more.',
    image: '/og/works.jpg',
  },
  '/experience': {
    title: `Experience · ${SITE_NAME}`,
    description:
      'Senior Full Stack roles leading POS, loyalty, wallet and AI products across retail and SaaS in Saudi Arabia and Europe.',
    image: '/og/experience.jpg',
  },
  '/about': {
    title: `About · ${SITE_NAME}`,
    description:
      'Product-focused full stack engineer who owns features end to end — from business needs and architecture to deployment.',
    image: '/og/about.jpg',
  },
  '/contact': {
    title: `Contact · ${SITE_NAME}`,
    description: 'Open to senior full stack roles and projects. Reach Moiz at moiezdev@gmail.com.',
    image: '/og/contact.jpg',
  },
  '/cv': {
    title: `CV · ${SITE_NAME}`,
    description: 'Résumé of Moieez ur Rehman, Senior Full Stack Software Engineer.',
    image: '/og/cv.jpg',
  },
};

/** First plain sentence of a project's description, for meta descriptions. */
function projectBlurb(project) {
  for (const block of project.description || []) {
    const lines = Array.isArray(block) ? block : [block];
    const line = lines.find((l) => typeof l === 'string' && l.length > 40);
    if (line) return line.length > 180 ? `${line.slice(0, 177).trimEnd()}…` : line;
  }
  return project.subtitle || '';
}

/**
 * @param {string} pathname
 * @param {{ id: string, title: string, subtitle?: string, description?: unknown[] }[]} projects
 * @returns {{ title: string, description: string, image: string, url: string, path: string }}
 */
export function metaFor(pathname = '/', projects = []) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const id = path.match(/^\/works\/([^/]+)$/)?.[1];
  const project = id && projects.find((p) => p.id === id);

  const meta = project
    ? {
        title: `${project.title} — ${project.subtitle} · ${SITE_NAME}`,
        description: projectBlurb(project),
        image: `/og/works/${project.id}.jpg`,
      }
    : PAGES[path] || HOME;

  return { ...meta, path, url: `${SITE_URL}${path === '/' ? '' : path}` };
}

/** Every route that gets its own static HTML at build time. */
export const staticRoutes = (projects) => [
  ...Object.keys(PAGES),
  ...projects.map((p) => `/works/${p.id}`),
];

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The <head> tags for one route (title, description, canonical, Open Graph, X). */
export function renderSeoTags(meta) {
  const image = `${SITE_URL}${meta.image}`;
  return [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${meta.url}" />`,
    `<meta property="og:type" content="${meta.path.startsWith('/works/') ? 'article' : 'website'}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:url" content="${meta.url}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:type" content="image/jpeg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(meta.title)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:image:alt" content="${esc(meta.title)}" />`,
  ].join('\n    ');
}
