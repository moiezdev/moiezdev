/**
 * Link-preview cards (1200×630) drawn from site data with Satori (layout →
 * SVG) and Resvg (SVG → PNG). The build renders one per route into dist/og/,
 * so crawlers get fast static files and nothing is stored in git.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import jpeg from 'jpeg-js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p));
const json = (p) => JSON.parse(read(p).toString('utf8'));

const FONTS = [400, 600, 700].map((weight) => ({
  name: 'Inter',
  weight,
  style: 'normal',
  data: read(`seo/fonts/inter-latin-${weight}-normal.woff`),
}));

const INK = '#1d1d1f';
const GRAPHITE = '#3d4451';
const MUTED = '#6e6e73';

const LOGO_SVG = read('public/logo.svg').toString('utf8').replace(/#3d4451/gi, GRAPHITE);
const LOGO_URI = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString('base64')}`;

/** Tiny element helper: h('div', style, ...children) */
const h = (type, style = {}, ...children) => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.flat().filter((c) => c !== null && c !== false) },
});
const img = (src, style) => ({ type: 'img', props: { src, style } });

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };

/** Satori renders PNG/JPEG/SVG but not WebP — use a raster sibling of a WebP file. */
async function imageData(path) {
  const candidates = /\.webp$/i.test(path) ? [path.replace(/\.webp$/i, '.jpg'), path.replace(/\.webp$/i, '.png')] : [path];
  for (const p of candidates) {
    const file = join(ROOT, 'public', decodeURI(p));
    const type = MIME[extname(file).toLowerCase()];
    if (type && existsSync(file)) return `data:${type};base64,${readFileSync(file).toString('base64')}`;
  }
  return null;
}

const chip = (text, dark = false) =>
  h(
    'div',
    {
      padding: '7px 15px',
      borderRadius: 99,
      fontSize: 16,
      fontWeight: 600,
      background: dark ? GRAPHITE : '#ffffff',
      color: dark ? '#ffffff' : GRAPHITE,
      boxShadow: dark ? 'none' : '0 0 0 1px rgba(0,0,0,0.08)',
      marginRight: 8,
      marginTop: 8,
    },
    text,
  );

const titleSize = (t) => (t.length <= 12 ? 66 : t.length <= 18 ? 58 : t.length <= 26 ? 50 : 44);

/** Left text column shared by every card. */
const textColumn = ({ eyebrow, title, sub, chips = [], url }) =>
  h(
    'div',
    { flexDirection: 'column', width: 470, height: '100%', padding: '68px 0 64px 72px' },
    h(
      'div',
      { alignItems: 'center', fontSize: 21, fontWeight: 700, color: INK },
      img(LOGO_URI, { width: 33, height: 20, marginRight: 11 }),
      'MoizDev',
    ),
    h('div', { flexGrow: 1 }),
    h('div', { fontSize: 15, fontWeight: 600, color: MUTED, letterSpacing: 1.2, textTransform: 'uppercase' }, eyebrow),
    h(
      'div',
      { marginTop: 12, fontSize: titleSize(title.replace(/\n/g, '')), fontWeight: 700, lineHeight: 1.04, letterSpacing: -2, color: INK, flexDirection: 'column' },
      ...title.split('\n').map((line) => h('div', {}, line)),
    ),
    sub ? h('div', { marginTop: 16, fontSize: 23, lineHeight: 1.32, color: MUTED, fontWeight: 400 }, sub) : null,
    h('div', { marginTop: 22, flexWrap: 'wrap' }, url ? chip(url, true) : null, ...chips.map((c) => chip(c))),
  );

const frame = (src, style) =>
  h(
    'div',
    {
      position: 'absolute',
      borderRadius: 22,
      overflow: 'hidden',
      background: '#e8e8ed',
      boxShadow: '0 18px 36px rgba(30,35,50,0.16), 0 0 0 1px rgba(0,0,0,0.06)',
      ...style,
    },
    src ? img(src, { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }) : null,
  );

const panel = (children, style = {}) =>
  h(
    'div',
    {
      position: 'absolute',
      right: 72,
      top: 110,
      width: 470,
      flexDirection: 'column',
      background: '#ffffff',
      borderRadius: 26,
      padding: '10px 0',
      boxShadow: '0 18px 36px rgba(30,35,50,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
      ...style,
    },
    ...children,
  );

const row = (first, left, right) =>
  h(
    'div',
    { alignItems: 'center', padding: '14px 24px', borderTop: first ? 'none' : '1px solid rgba(0,0,0,0.07)' },
    left,
    h('div', { flexDirection: 'column', marginLeft: 16, width: 330 }, ...right),
  );

const card = (right, left) =>
  h(
    'div',
    {
      width: 1200,
      height: 630,
      position: 'relative',
      background: '#fbfbfd',
      backgroundImage:
        'radial-gradient(circle at 82% 62%, rgba(130,142,165,0.2), rgba(251,251,253,0) 45%), radial-gradient(circle at 98% 0%, rgba(190,172,155,0.18), rgba(251,251,253,0) 35%)',
      fontFamily: 'Inter',
    },
    left,
    ...[right].flat(),
  );

const years = () => Math.floor((Date.now() - new Date(2019, 4, 1)) / (365.25 * 24 * 3600 * 1000));

async function buildCard(path) {
  const ids = json('src/data/projects/index.json');
  const projects = ids.map((id) => json(`src/data/projects/${id}.json`));
  const id = path.match(/^\/works\/([^/]+)$/)?.[1];
  const project = projects.find((p) => p.id === id);

  if (project) {
    // `"screenshot": false` in a project's JSON means its image is a logo, not a screenshot
    const hasShot = project.screenshot !== false;
    const [main, back] = await Promise.all([
      hasShot ? imageData(project.imageUrl) : null,
      (async () => {
        const dir = project.imageUrl.split('/').slice(0, -1).join('/');
        const other = hasShot && (project.media || []).find((m) => !project.imageUrl.endsWith(m));
        return other ? imageData(`${dir}/${other}`) : null;
      })(),
    ]);
    const visual = main
      ? [
          back ? frame(back, { right: 28, top: 44, width: 400, height: 250, opacity: 0.9, transform: 'rotate(3deg)' }) : null,
          frame(main, { right: 64, top: 196, width: 520, height: 325 }),
        ].filter(Boolean)
      : panel(
          [
            h('div', { padding: '8px 26px', fontSize: 16, color: '#9a9aa2' }, `${project.title} stack`),
            ...(project.technologies || []).slice(0, 7).map((t, i) =>
              h('div', { padding: '6px 26px', fontSize: 19, color: GRAPHITE }, `${i + 1}   ${t}`),
            ),
          ],
          { top: 150 },
        );
    return card(
      visual,
      textColumn({
        eyebrow: 'Case study',
        title: project.title,
        sub: project.subtitle,
        chips: (project.technologies || []).slice(0, 2),
        url: `moiez.dev/works/${project.id}`,
      }),
    );
  }

  if (path === '/works') {
    const shots = await Promise.all(projects.slice(0, 4).map((p) => imageData(p.imageUrl)));
    return card(
      shots.map((s, i) => frame(s, { width: 290, height: 181, right: i % 2 ? 72 : 382, top: i < 2 ? 110 : 315 })),
      textColumn({
        eyebrow: 'Selected work',
        title: 'All work.',
        sub: `${projects.length} products, platforms and sites — POS, travel, SaaS and more.`,
        url: 'moiez.dev/works',
      }),
    );
  }

  const jobs = json('src/data/experience.json');

  if (path === '/experience' || path === '/cv') {
    const logos = await Promise.all(jobs.slice(0, 5).map((j) => (j.logo ? imageData(j.logo) : null)));
    const list = panel(
      jobs.slice(0, 5).map((j, i) =>
        row(
          i === 0,
          h(
            'div',
            { width: 44, height: 44, borderRadius: 12, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
            logos[i] ? img(logos[i], { width: 34, height: 34, objectFit: 'contain' }) : null,
          ),
          [
            h('div', { fontSize: 17, fontWeight: 600, color: INK }, j.company.length > 34 ? `${j.company.slice(0, 33)}…` : j.company),
            h('div', { fontSize: 14, color: MUTED, marginTop: 2 }, `${j.title} · ${j.period}`),
          ],
        ),
      ),
      { top: 92 },
    );
    return card(
      list,
      path === '/cv'
        ? textColumn({ eyebrow: 'Résumé', title: 'Moieez\nur Rehman', sub: `Senior Full Stack Engineer & Software Architect · ${years()}+ years`, url: 'moiez.dev/cv' })
        : textColumn({
            eyebrow: 'Experience',
            title: `${years()}+ years\nof shipping.`,
            sub: 'Engineering and architecture roles across retail and SaaS — POS, loyalty, wallets and AI.',
            url: 'moiez.dev/experience',
          }),
    );
  }

  if (path === '/contact') {
    const contacts = json('src/data/contacts.json').filter((c) => c.categories.includes('contact'));
    return card(
      panel(
        contacts.map((c, i) =>
          row(
            i === 0,
            h('div', { width: 44, height: 44, borderRadius: 12, background: '#f2f2f5', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: GRAPHITE }, c.platform[0]),
            [h('div', { fontSize: 17, fontWeight: 600, color: INK }, c.platform), h('div', { fontSize: 15, color: MUTED, marginTop: 2 }, c.handle)],
          ),
        ),
      ),
      textColumn({ eyebrow: 'Contact', title: 'Let’s build\nsomething great.', sub: 'Open to senior full stack roles and projects.', url: 'moiezdev@gmail.com' }),
    );
  }

  // /about and anything else
  const stat = (value, label, first) =>
    row(first, h('div', { width: 118, fontSize: 38, fontWeight: 700, letterSpacing: -1.5, color: INK }, value), [
      h('div', { fontSize: 18, color: MUTED }, label),
    ]);
  return card(
    panel([
      stat(`${years()}+`, 'years building production software', true),
      stat(`${projects.length}+`, 'products and platforms shipped'),
      stat(`${jobs.length}`, 'companies across retail and SaaS'),
      stat('E2E', 'owns features from idea to deploy'),
    ]),
    textColumn({
      eyebrow: 'About',
      title: 'The person\nbehind the work.',
      sub: 'Full stack engineer and software architect in Riyadh.',
      url: 'moiez.dev/about',
    }),
  );
}

/**
 * Render the preview card for a route (e.g. '/works/tdm') to a JPEG buffer.
 * JPEG keeps cards around 100 KB — WhatsApp skips preview images much above ~300 KB.
 */
export async function renderCard(path) {
  const svg = await satori(await buildCard(path), { width: 1200, height: 630, fonts: FONTS });
  const image = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render();
  return jpeg.encode({ data: image.pixels, width: image.width, height: image.height }, 84).data;
}
