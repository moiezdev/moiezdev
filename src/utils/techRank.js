/**
 * Relevance of each technology to the roles this portfolio targets
 * (senior full stack: Node.js/NestJS, React/Next.js, PostgreSQL, AI integration).
 * Cards show the top few, and the /works filter chips follow the same order.
 * Anything not listed sorts after the listed names; styling/markup basics last.
 */
const ORDER = [
  // backend & frontend core
  'NestJs',
  'Node',
  'NextJs',
  'Next.js',
  'React',
  'TypeScript',
  'PostGreSQL',
  'Redis',
  'BullMQ',
  'OpenRouter',
  'DeepSeek',
  'Prisma',
  'Fastify',
  'Express',
  'REST APIs',
  // product integrations
  'Apple Wallet',
  'Google Wallet',
  'MyFatoorah',
  'Moyasar',
  'Sabre',
  'Amadeus',
  // other stacks
  'NuxtJs',
  'Vue',
  'Flutter',
  'ASP.NET',
  'C# (C Sharp)',
  'Entity Framework',
  'Laravel',
  'MongoDB',
  'TanStack Query',
  'Zustand',
  'Redux Toolkit',
  'Vuex',
  'TailwindCSS',
  'JavaScript',
];

/** Styling and markup basics: always last. */
const LAST = ['HTML5', 'CSS3', 'Buefy', 'SCSS', 'Bootstrap', 'Jquery'];

export function techRank(name) {
  const i = ORDER.indexOf(name);
  if (i !== -1) return i;
  const j = LAST.indexOf(name);
  return j === -1 ? ORDER.length : ORDER.length + 1 + j;
}

/** True for the top-tier technologies the target roles ask for. */
export const isCoreTech = (name) => techRank(name) <= ORDER.indexOf('DeepSeek');

/** A copy of `list` ordered by relevance (stable for equal ranks). */
export const sortTech = (list = []) => [...list].sort((a, b) => techRank(a) - techRank(b));

/** The `n` most relevant technologies of a project. */
export const topTech = (list = [], n = 3) => sortTech(list).slice(0, n);
