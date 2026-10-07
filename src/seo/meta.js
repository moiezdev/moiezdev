/**
 * Page titles, descriptions and share images for every route.
 *
 * Plain ESM with no dependencies, so both the app (live tab titles) and the build
 * (static HTML per route, read by LinkedIn/WhatsApp/X/Google) use it.
 * Titles read "<page> · Moieez ur Rehman"; descriptions aim for 120–160
 * characters and only state facts from src/data and the CV.
 */
import { getExperienceYears } from '../utils/experience.js';

export const SITE_URL = 'https://www.moiez.dev';
export const SITE_NAME = 'Moieez ur Rehman';

const years = getExperienceYears();

const HOME = {
  title: `${SITE_NAME} · Senior Full Stack Engineer in Riyadh`,
  description: `Senior Full Stack Engineer & Software Architect in Riyadh. ${years} years building POS, payments, loyalty and AI products with NestJS, React/Next.js and PostgreSQL.`,
  image: '/og-image.jpg',
};

const PAGES = {
  '/': HOME,
  '/works': {
    title: `Work · ${SITE_NAME}`,
    description:
      'Case studies of products built end to end: a restaurant POS and loyalty platform for Gulf retail, flight booking on Sabre and Amadeus, SaaS and websites.',
    image: '/og/works.jpg',
  },
  '/experience': {
    title: `Experience · ${SITE_NAME}`,
    description: `${years} years of engineering roles in Saudi Arabia, Portugal and Pakistan, from restaurant POS, loyalty and wallets at TWLM to internal dashboards at ACCIONA.`,
    image: '/og/experience.jpg',
  },
  '/about': {
    title: `About · ${SITE_NAME}`,
    description:
      'Full stack engineer and software architect in Riyadh who owns features end to end: POS, payments (MyFatoorah, Moyasar), Apple/Google Wallet, CRM and AI search.',
    image: '/og/about.jpg',
  },
  '/contact': {
    title: `Contact · ${SITE_NAME}`,
    description:
      'Get in touch with Moieez ur Rehman, Senior Full Stack Engineer in Riyadh, open to senior full stack roles and projects. Email moiezdev@gmail.com or LinkedIn.',
    image: '/og/contact.jpg',
  },
  '/cv': {
    title: `CV · ${SITE_NAME}`,
    description: `Résumé of Moieez ur Rehman, Senior Full Stack Engineer in Riyadh: ${years} years of TypeScript, Node.js/NestJS, React/Next.js and PostgreSQL. View or download the PDF.`,
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
      'Restaurant POS and CMS platform for Gulf retail: POS, Gulf tax, inventory, loyalty, gift cards and Apple/Google Wallet passes, built with NestJS and React.',
  },
  'aa-tourism': {
    title: 'AA Travel & Tourism — Flight Booking Platform',
    description:
      'Flight booking and tour-planning platform with real-time flight data from Sabre and Amadeus and IATA codes, with a Nuxt, Vuex and Buefy frontend.',
  },
  scmborba: {
    title: 'SCM Borba — Institutional Website',
    description:
      'Full stack website for Santa Casa da Misericórdia de Borba, a Portuguese social services non-profit, built with Node.js, Express and Vue/Nuxt.',
  },
  'docean-fisheries': {
    title: 'D’Ocean Fisheries — Seafood Supplier Website',
    description:
      'Responsive site for a seafood supplier: live, frozen and fillet categories, product sections and quote and contact forms, built with HTML5, CSS3 and JavaScript.',
  },
  'my-portfolio': {
    title: 'Portfolio Website — moiez.dev',
    description:
      'The source of moiez.dev: a React and Tailwind CSS portfolio with project case studies, an AI chatbot (OpenRouter, DeepSeek) and fast, responsive pages.',
  },
  'gala-travels': {
    title: 'Gala Travels — Travel Booking Platform',
    description:
      'Travel agency platform for booking flights, hotels, vacations and cruises (galatravels.com), with a Vue/Nuxt frontend and a Laravel backend for bookings.',
  },
  'mian-travels': {
    title: 'Mian’s Travels — Flight Booking Platform',
    description:
      'Flight booking site built at Creative Inter Tech on the Sabre API, with a Nuxt 2, Vue and Buefy frontend for simple flight search, listings and booking forms.',
  },
  'ain-saas': {
    title: 'Ain Saiss — Website',
    description:
      'Responsive website for Ain Saiss (ain-saiss.ma) that presents its services and information clearly on desktop and mobile. Built with HTML5, SCSS and JavaScript.',
  },
  'city-arrivals': {
    title: 'City Arrivals — Luxury Car Booking Platform',
    description:
      'Luxury car booking platform in Canada (cityarrivals.ca), built for B2B travel operations alongside AA Travel & Tourism, with responsive flows to schedule rides.',
  },
  mtlnation: {
    title: 'MTLnation — Vue.js Web Platform',
    description:
      'Vue.js website for MTLnation with reusable components, dynamic news, events and media sections, and forms to subscribe and connect, built with Vue and SCSS.',
  },
  tdm: {
    title: 'TDM — Civil Engineering Company Website',
    description:
      'Responsive corporate website for TDM, a civil engineering and project management company, with clear service, project and contact sections.',
  },
  eims: {
    title: 'EIMS — AI-Powered Learning Management System',
    description:
      'In progress: an AI-powered learning management system that recommends courses from students’ interests and goals, on ASP.NET, Entity Framework and PostgreSQL.',
  },
  lms: {
    title: 'LMS — Learning Management System',
    description:
      'Learning management system in development, with quizzes, dashboards and progress tracking. Built with React, Redux Toolkit, Node.js, Express and MongoDB.',
  },
};

/** First plain sentence of a project's description, for meta descriptions. */
function projectBlurb(project) {
  for (const block of project.description || []) {
    const lines = Array.isArray(block) ? block : [block];
    const line = lines.find((l) => typeof l === 'string' && l.length > 40);
    if (line) return line.length > 160 ? `${line.slice(0, 157).trimEnd()}…` : line;
  }
  return project.subtitle || '';
}

/**
 * @param {string} pathname
 * @param {{ id: string, title: string, subtitle?: string, listed?: boolean, description?: unknown[] }[]} projects
 * @returns {{ title: string, description: string, image: string, url: string, path: string, noindex?: boolean }}
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
  image: '/og-image.jpg',
  path: '/404',
  url: SITE_URL,
  noindex: true,
};

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
    meta.noindex ? `<meta name="robots" content="noindex" />` : `<link rel="canonical" href="${meta.url}" />`,
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
