/**
 * Page titles, descriptions and share images for every route.
 *
 * Plain ESM with no dependencies, so both the app (live tab titles) and the build
 * (static HTML per route, read by LinkedIn/WhatsApp/X/Google) use it.
 * Titles read "<page> · Moieez ur Rehman" and stay within 60 characters (X,
 * LinkedIn and Google cut longer ones); descriptions stay within 125 characters,
 * about what a mobile share preview shows, and only state facts from src/data and the CV.
 */
import { getExperienceYears } from '../utils/experience.js';

export const SITE_URL = 'https://www.moiez.dev';
export const SITE_NAME = 'Moieez ur Rehman';
/** The one role title used across the site (hero, about, footer, CV page, meta). */
export const ROLE_TITLE = 'AI Engineer | Senior Full-Stack Engineer (TypeScript, Node.js/NestJS, React/Next.js)';

const years = getExperienceYears();

/**
 * Bumped whenever the card design changes: share previews and audit tools cache
 * og:image by URL, so a new query string makes them fetch the new card.
 */
const OG_VERSION = '2';

const HOME = {
  title: `${SITE_NAME} · AI Engineer & Full-Stack Engineer`,
  description: `AI Engineer in Riyadh with ${years} years of TypeScript, NestJS and React, building LLM features, POS, payments and loyalty.`,
  image: '/og/home.jpg',
  // describes the card, including the call to action printed on it
  imageAlt: 'Moieez ur Rehman, AI Engineer in Riyadh. Hire me at moiez.dev',
};

const PAGES = {
  '/': HOME,
  '/works': {
    title: `Work · ${SITE_NAME}`,
    description:
      'Case studies of products built end to end: a POS and loyalty platform for Gulf retail, flight booking, AI chatbots and SaaS.',
    image: '/og/works.jpg',
  },
  '/experience': {
    title: `Experience · ${SITE_NAME}`,
    description: `${years} years of engineering in Saudi Arabia, Portugal and Pakistan, from POS, loyalty and wallets at TWLM to ACCIONA.`,
    image: '/og/experience.jpg',
  },
  '/about': {
    title: `About · ${SITE_NAME}`,
    description:
      'AI Engineer in Riyadh who owns features end to end: LLM search, POS, payments, Apple/Google Wallet passes and CRM.',
    image: '/og/about.jpg',
  },
  '/contact': {
    title: `Contact · ${SITE_NAME}`,
    description:
      'Hiring an AI Engineer? Get in touch with Moieez ur Rehman, open to AI and full-stack roles in Riyadh, the GCC or remote.',
    image: '/og/contact.jpg',
  },
  '/cv': {
    title: `CV · ${SITE_NAME}`,
    description: `Résumé of Moieez ur Rehman, AI Engineer in Riyadh: ${years} years of TypeScript, NestJS, React/Next.js and LLM features.`,
    image: '/og/cv.jpg',
  },
};

/**
 * Search titles and descriptions for project pages, written from the project's
 * own data (src/data/projects) and the CV. A project missing here falls back to
 * its title, subtitle and first sentence.
 */
const PROJECTS = {
  'twlm-pos': {
    title: 'TWLM POS & Loyalty Platform',
    description:
      'Restaurant POS for Gulf retail with tax, inventory, loyalty, gift cards and Apple/Google Wallet passes, on NestJS and React.',
  },
  'company-support-chatbot': {
    title: 'Company Support Chatbot (AI)',
    description:
      'An AI chatbot on OpenRouter (DeepSeek) that answers questions about a client’s company and services and gives live support.',
  },
  botfolio: {
    title: 'BotFolio — AI Portfolio Assistant',
    description:
      'The AI assistant on moiez.dev: OpenRouter (DeepSeek) in a Vercel function, answering from site data in English and Arabic.',
  },
  'design-dynamo': {
    title: 'Design Dynamo — Designer Portfolio',
    description:
      'A Photoshop-style portfolio for a Riyadh designer: React scroll animations, an Express and PostgreSQL API and Arabic RTL.',
  },
  'aa-tourism': {
    title: 'AATourism — Flight Booking Platform',
    description:
      'Flight booking and tour planning: Laravel backend, Nuxt web app and React Native app with live Sabre and Amadeus flight data.',
  },
  scmborba: {
    title: 'SCM Borba — Institutional Website',
    description:
      'Website for Santa Casa da Misericórdia de Borba, a Portuguese social services non-profit, on Node.js, Express and Nuxt.',
  },
  'docean-fisheries': {
    title: 'D’Ocean Fisheries — Seafood Website',
    description:
      'Responsive site for a seafood supplier with product categories and quote and contact forms, in HTML5, CSS3 and JavaScript.',
  },
  'my-portfolio': {
    title: 'Portfolio Website — moiez.dev',
    description:
      'The source of moiez.dev: a React and Tailwind CSS portfolio with case studies and an AI chatbot (OpenRouter, DeepSeek).',
  },
  'gala-travels': {
    title: 'Gala Travels — Travel Booking Platform',
    description:
      'Travel agency platform for booking flights, hotels, vacations and cruises (galatravels.com), on Vue/Nuxt and Laravel.',
  },
  'mian-travels': {
    title: 'Mian’s Travels — Flight Booking Platform',
    description:
      'Flight booking site on the Sabre API, built at Creative Inter Tech with Nuxt 2, Vue and Buefy.',
  },
  'ain-saas': {
    title: 'Ain Saiss — Website',
    description:
      'Responsive website for Ain Saiss (ain-saiss.ma) that presents its services on desktop and mobile, in HTML5, SCSS and JS.',
  },
  'city-arrivals': {
    title: 'City Arrivals — Luxury Car Booking',
    description:
      'Luxury car booking platform in Canada (cityarrivals.ca) for B2B travel operations, with responsive flows to schedule rides.',
  },
  mtlnation: {
    title: 'MTLnation — Vue.js Web Platform',
    description:
      'Vue.js website for MTLnation with reusable components, news, events and media sections, and forms to subscribe and connect.',
  },
  tdm: {
    title: 'TDM — Civil Engineering Company Website',
    description:
      'Responsive corporate website for TDM, a civil engineering and project management company, with service and project sections.',
  },
  eims: {
    title: 'EIMS — AI Learning Management System',
    description:
      'In progress: an AI learning management system that recommends courses from students’ goals, on ASP.NET and PostgreSQL.',
  },
  lms: {
    title: 'LMS — Learning Management System',
    description:
      'Learning management system in development, with quizzes, dashboards and progress tracking, on React, Node.js and MongoDB.',
  },
};

/** First plain sentence of a project's description, for meta descriptions. */
function projectBlurb(project) {
  for (const block of project.description || []) {
    const lines = Array.isArray(block) ? block : [block];
    const line = lines.find((l) => typeof l === 'string' && l.length > 40);
    if (line) return line.length > 125 ? `${line.slice(0, 122).trimEnd()}…` : line;
  }
  return project.subtitle || '';
}

/**
 * @param {string} pathname
 * @param {{ id: string, title: string, subtitle?: string, listed?: boolean, description?: unknown[] }[]} projects
 * @returns {{ title: string, description: string, image: string, url: string, path: string, noindex?: boolean, project?: object }}
 */
export function metaFor(pathname = '/', projects = []) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const id = path.match(/^\/works\/([^/]+)$/)?.[1];
  const project = id && projects.find((p) => p.id === id);
  const seo = project && PROJECTS[project.id];

  const meta = project
    ? {
        title: `${seo?.title || `${project.title} — ${project.subtitle}`} · ${SITE_NAME}`,
        description: seo?.description || projectBlurb(project),
        image: `/og/works/${project.id}.jpg`,
        project,
        // unlisted projects keep their page but stay out of search results and the sitemap
        ...(project.listed === false && { noindex: true }),
      }
    : PAGES[path];

  if (!meta) return NOT_FOUND;
  return { ...meta, path, url: `${SITE_URL}${path === '/' ? '' : path}` };
}

/** Served by the host (with a 404 status) for any URL that isn't a real page. */
export const NOT_FOUND = {
  title: `Page not found · ${SITE_NAME}`,
  description: 'This page doesn’t exist or has moved. Browse the work, experience or contact pages instead.',
  image: '/og/home.jpg',
  path: '/404',
  url: SITE_URL,
  noindex: true,
};

/** Every route that gets its own static HTML at build time. */
export const staticRoutes = (projects) => [
  ...Object.keys(PAGES),
  ...projects.map((p) => `/works/${p.id}`),
];

/** Routes search engines should index: no 404, no unlisted projects. */
export const sitemapRoutes = (projects) =>
  staticRoutes(projects.filter((p) => p.listed !== false));

/* ---------- structured data (JSON-LD) ---------- */

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/** Facts from src/data (contacts, experience, education, skills) and the CV. */
const PERSON = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: SITE_NAME,
  jobTitle: ROLE_TITLE,
  description:
    'AI Engineer and Senior Full-Stack Engineer in Riyadh, building LLM features, POS, payments and loyalty products for retail and SaaS.',
  url: SITE_URL,
  image: `${SITE_URL}/img/heroSection/hero-img-960.webp`,
  email: 'mailto:moiezdev@gmail.com',
  address: { '@type': 'PostalAddress', addressLocality: 'Riyadh', addressCountry: 'SA' },
  sameAs: ['https://www.linkedin.com/in/moiezdev', 'https://github.com/moiezdev'],
  worksFor: { '@type': 'Organization', name: 'TWLM', url: 'https://twlm.solutions/' },
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'National College of Business Administration & Economics' },
  knowsLanguage: ['English', 'Urdu', 'Hindi'],
  knowsAbout: [
    'AI engineering',
    'Full stack development',
    'Software architecture',
    'TypeScript',
    'Node.js',
    'NestJS',
    'React',
    'Next.js',
    'PostgreSQL',
    'Prisma',
    'Redis',
    'Event-driven architecture',
    'LLM integration',
    'Point of sale (POS) systems',
    'Payment gateway integration',
    'Loyalty programs',
    'Apple Wallet and Google Wallet passes',
    'OAuth2 and SSO',
  ],
};

const ref = (id) => ({ '@id': id });

/** Schema.org graph for one page: the person everywhere, plus what the page is about. */
export function jsonLdFor(meta) {
  if (meta === NOT_FOUND) return null;
  const graph = [PERSON];
  const page = { '@id': `${meta.url}#webpage`, url: meta.url, name: meta.title, isPartOf: ref(WEBSITE_ID), inLanguage: 'en' };

  if (meta.path === '/') {
    graph.push(
      { '@type': 'WebSite', '@id': WEBSITE_ID, url: SITE_URL, name: SITE_NAME, description: meta.description, inLanguage: 'en', publisher: ref(PERSON_ID) },
      { '@type': 'ProfilePage', ...page, mainEntity: ref(PERSON_ID) },
    );
  } else if (meta.path === '/about') {
    graph.push({ '@type': 'ProfilePage', ...page, mainEntity: ref(PERSON_ID) });
  } else if (meta.project) {
    const p = meta.project;
    graph.push({
      '@type': 'CreativeWork',
      '@id': `${meta.url}#work`,
      name: p.title,
      headline: meta.title.replace(` · ${SITE_NAME}`, ''),
      description: meta.description,
      url: meta.url,
      image: `${SITE_URL}${meta.image}`,
      creator: ref(PERSON_ID),
      inLanguage: 'en',
      ...(p.technologies?.length && { keywords: p.technologies.join(', ') }),
      // the live product, when there is one
      ...(p.projectUrl && { sameAs: p.projectUrl }),
      ...(p.status === 'in-progress' && { creativeWorkStatus: 'In progress' }),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

/* ---------- <head> tags ---------- */

/**
 * The <head> tags for one route as [tag, attributes, text] — title, description,
 * canonical, Open Graph, X and JSON-LD. The build renders them to HTML
 * (renderSeoTags) and RouteMeta swaps them in on client-side navigation, both
 * marked `data-seo` so they can be found again.
 */
export function headTags(meta) {
  const image = `${SITE_URL}${meta.image}?v=${OG_VERSION}`;
  const imageAlt = meta.imageAlt || meta.title;
  const ld = jsonLdFor(meta);
  const m = (key, name, content) => ['meta', { [key]: name, content }];
  return [
    ['title', {}, meta.title],
    m('name', 'description', meta.description),
    meta.noindex ? m('name', 'robots', 'noindex') : ['link', { rel: 'canonical', href: meta.url }],
    m('property', 'og:type', meta.project ? 'article' : 'website'),
    m('property', 'og:site_name', SITE_NAME),
    m('property', 'og:url', meta.url),
    m('property', 'og:title', meta.title),
    m('property', 'og:description', meta.description),
    m('property', 'og:image', image),
    m('property', 'og:image:type', 'image/jpeg'),
    m('property', 'og:image:width', '1200'),
    m('property', 'og:image:height', '630'),
    m('property', 'og:image:alt', imageAlt),
    m('name', 'twitter:card', 'summary_large_image'),
    m('name', 'twitter:title', meta.title),
    m('name', 'twitter:description', meta.description),
    m('name', 'twitter:image', image),
    m('name', 'twitter:image:alt', imageAlt),
    ...(ld ? [['script', { type: 'application/ld+json' }, JSON.stringify(ld)]] : []),
  ];
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** headTags() as HTML for the static page of one route. */
export function renderSeoTags(meta) {
  return headTags(meta)
    .map(([tag, attrs, text]) => {
      const open = `<${tag}${tag === 'title' ? '' : ' data-seo'}${Object.entries(attrs)
        .map(([k, v]) => ` ${k}="${esc(v)}"`)
        .join('')}`;
      if (tag === 'title') return `${open}>${esc(text)}</title>`;
      // `<` can't close the script early once escaped; JSON.parse reads \u003c as `<`
      if (tag === 'script') return `${open}>${text.replace(/</g, '\\u003c')}</script>`;
      return `${open} />`;
    })
    .join('\n    ');
}
