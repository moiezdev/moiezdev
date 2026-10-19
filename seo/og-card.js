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

const titleSize = (t) => (t.length <= 12 ? 66 : t.length <= 18 ? 58 : t.length <= 26 ? 50 : 44);

// the fonts are a Latin subset without arrows, so the arrow is drawn
const ARROW_URI = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M3 10h13M11 4.5 16.5 10 11 15.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
).toString('base64')}`;

/** The call to action: a dark button saying what the link opens, then where it goes. */
const cta = (label, url) =>
  h(
    'div',
    { marginTop: 30, alignItems: 'center' },
    h(
      'div',
      { alignItems: 'center', padding: '15px 26px', borderRadius: 99, background: INK, color: '#ffffff', fontSize: 22, fontWeight: 600, boxShadow: '0 10px 22px rgba(29,29,31,0.22)' },
      label,
      img(ARROW_URI, { width: 20, height: 20, marginLeft: 12 }),
    ),
    url ? h('div', { marginLeft: 18, fontSize: 19, fontWeight: 600, color: MUTED }, url) : null,
  );

/** Left text column shared by every card. */
const textColumn = ({ eyebrow, title, sub, action, url, width = 470, size }) =>
  h(
    'div',
    { flexDirection: 'column', width, height: '100%', padding: '68px 0 64px 72px' },
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
      { marginTop: 12, fontSize: size || titleSize(title.replace(/\n/g, '')), fontWeight: 700, lineHeight: 1.04, letterSpacing: -2, color: INK, flexDirection: 'column' },
      ...title.split('\n').map((line) => h('div', {}, line)),
    ),
    sub ? h('div', { marginTop: 16, fontSize: 23, lineHeight: 1.32, color: MUTED, fontWeight: 400 }, sub) : null,
    cta(action, url),
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

/**
 * The hero portrait as a PNG data URI. It's only kept as WebP (with
 * transparency), which Satori can't read, so sharp converts it at build time.
 */
async function portrait() {
  try {
    const { default: sharp } = await import('sharp');
    const png = await sharp(join(ROOT, 'public/heroSection/hero-img.webp')).resize({ width: 800 }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null; // card still renders, just without the photo
  }
}

/** Home card: name, role and city, with the portrait on the right. */
async function homeCard() {
  const photo = await portrait();
  const BG = '#eef0f4';
  return card(
    h(
      'div',
      {
        position: 'absolute',
        right: 72,
        top: 64,
        width: 400,
        height: 502,
        borderRadius: 28,
        overflow: 'hidden',
        background: `linear-gradient(180deg, #ffffff 0%, ${BG} 100%)`,
        boxShadow: '0 18px 36px rgba(30,35,50,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
        alignItems: 'flex-end',
        justifyContent: 'center',
      },
      photo ? img(photo, { width: 400, height: 449 }) : null,
      h('div', {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 130,
        background: `linear-gradient(180deg, rgba(238,240,244,0) 0%, ${BG} 100%)`,
      }),
      h(
        'div',
        { position: 'absolute', left: 24, bottom: 24, alignItems: 'center', padding: '10px 18px', borderRadius: 99, background: '#ffffff', fontSize: 18, fontWeight: 600, color: INK, boxShadow: '0 6px 16px rgba(30,35,50,0.12), 0 0 0 1px rgba(0,0,0,0.06)' },
        h('div', { width: 11, height: 11, borderRadius: 99, background: '#22a447', marginRight: 10 }),
        'Open to AI Engineer roles',
      ),
    ),
    textColumn({
      eyebrow: 'AI Engineer · Riyadh',
      title: 'Moieez\nur Rehman',
      size: 78,
      sub: 'I build LLM features and the products around them, end to end in TypeScript.',
      action: 'See my work',
      url: 'moiez.dev',
      width: 640,
    }),
  );
}

async function buildCard(path) {
  if (path === '/') return homeCard();

  const ids = json('src/data/projects/index.json');
  const all = ids.map((id) => json(`src/data/projects/${id}.json`));
  const projects = all.filter((p) => p.listed !== false);
  const id = path.match(/^\/works\/([^/]+)$/)?.[1];
  const project = all.find((p) => p.id === id);

  if (project) {
    // `"screenshot": false` in a project's JSON means its image is a logo, not a screenshot
    const hasShot = project.screenshot !== false && Boolean(project.imageUrl);
    const [main, back] = await Promise.all([
      hasShot ? imageData(project.imageUrl) : null,
      (async () => {
        if (!hasShot) return null;
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
        action: 'Read the case study',
        url: 'moiez.dev',
      }),
    );
  }

  if (path === '/works') {
    const shots = await Promise.all(
      projects.filter((p) => p.imageUrl && p.screenshot !== false).slice(0, 4).map((p) => imageData(p.imageUrl)),
    );
    return card(
      shots.map((s, i) => frame(s, { width: 290, height: 181, right: i % 2 ? 72 : 382, top: i < 2 ? 110 : 315 })),
      textColumn({
        eyebrow: 'Selected work',
        title: 'All work.',
        sub: `${projects.length} products, platforms and sites — POS, travel, SaaS and more.`,
        action: 'Browse case studies',
        url: 'moiez.dev',
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
        ? textColumn({ eyebrow: 'Résumé', title: 'Moieez\nur Rehman', sub: `AI Engineer in Riyadh · ${years()}+ years`, action: 'Download my CV', url: 'moiez.dev' })
        : textColumn({
            eyebrow: 'Experience',
            title: `${years()}+ years\nof shipping.`,
            sub: 'Engineering roles across retail and SaaS — POS, loyalty, wallets and AI.',
            action: 'See my experience',
            url: 'moiez.dev',
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
      textColumn({ eyebrow: 'Contact', title: 'Let’s build\nsomething great.', sub: 'Open to AI engineer and full-stack roles (Riyadh, GCC, remote).', action: 'Get in touch', url: 'moiezdev@gmail.com' }),
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
      sub: 'AI Engineer in Riyadh who owns features from idea to deploy.',
      action: 'Meet Moieez',
      url: 'moiez.dev',
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
