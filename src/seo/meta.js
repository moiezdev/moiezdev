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
  image: '/og/home.jpg',
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
      'Restaurant POS and CMS platform for Gulf retail with Gulf tax, inventory, loyalty, gift cards and Apple/Google Wallet passes, built with NestJS and React.',
  },
  'design-dynamo': {
    title: 'Design Dynamo — Interactive Designer Portfolio',
    description:
      'A Photoshop-style portfolio for a Riyadh graphic and web designer: React with advanced scroll animations, an Express and PostgreSQL reviews API, EmailJS enquiries and a full Arabic RTL layout.',
  },
  'aa-tourism': {
    title: 'AA Travel & Tourism — Full-Stack Flight Booking Platform',
    description:
      'Full-stack flight booking and tour-planning system: Laravel backend, Nuxt 2 web app and React Native mobile app with real-time Sabre and Amadeus flight data.',
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
  jobTitle: 'Senior Full Stack Engineer',
  description:
    'Senior Full Stack Engineer and Software Architect in Riyadh, building POS, payments, loyalty and AI products for retail and SaaS.',
  url: SITE_URL,
  image: `${SITE_URL}/img/heroSection/hero-img-960.webp`,
  email: 'mailto:moiezdev@gmail.com',
  address: { '@type': 'PostalAddress', addressLocality: 'Riyadh', addressCountry: 'SA' },
  sameAs: ['https://www.linkedin.com/in/moiezdev', 'https://github.com/moiezdev'],
  worksFor: { '@type': 'Organization', name: 'TWLM', url: 'https://twlm.solutions/' },
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'National College of Business Administration & Economics' },
  knowsLanguage: ['English', 'Urdu', 'Hindi'],
  knowsAbout: [
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
  const image = `${SITE_URL}${meta.image}`;
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
    m('property', 'og:image:alt', meta.title),
    m('name', 'twitter:card', 'summary_large_image'),
    m('name', 'twitter:title', meta.title),
    m('name', 'twitter:description', meta.description),
    m('name', 'twitter:image', image),
    m('name', 'twitter:image:alt', meta.title),
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
