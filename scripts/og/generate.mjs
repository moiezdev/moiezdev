/**
 * Generates the 1200×630 link-preview images in public/og/ from site data:
 *   node scripts/og/generate.mjs
 *
 * Needs Playwright with a Chromium build (not a project dependency):
 *   npx playwright install chromium   # or point PLAYWRIGHT_MODULE at an existing install
 * Re-run after adding or renaming a project.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const pub = join(root, 'public');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const file = (p) => pathToFileURL(join(pub, p)).href;

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');

const ids = read('src/data/projects/index.json');
const projects = ids.map((id) => read(`src/data/projects/${id}.json`));
const jobs = read('src/data/experience.json');
const years = Math.floor((Date.now() - new Date(2019, 4, 1)) / (365.25 * 24 * 3600 * 1000));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const LOGO = readFileSync(join(pub, 'logo.svg'), 'utf8')
  .replace(/fill="#FFFF00"/gi, 'fill="currentColor"')
  .replace(/width="115" height="59"/, 'width="34" height="18"');

const css = `
@font-face { font-family: Inter; src: url('${pathToFileURL(join(root, 'scripts/og/inter.woff2')).href}') format('woff2'); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; }
body { font-family: Inter, system-ui, sans-serif; background: #fbfbfd; color: #1d1d1f; -webkit-font-smoothing: antialiased;
  overflow: hidden; position: relative; letter-spacing: -0.02em; }
.bg { position: absolute; inset: 0; background:
  radial-gradient(45% 65% at 82% 60%, rgba(130,142,165,.18), transparent 70%),
  radial-gradient(30% 40% at 96% 4%, rgba(190,172,155,.16), transparent 70%); }
.left { position: absolute; left: 72px; top: 68px; bottom: 64px; width: 450px; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 11px; font-size: 21px; font-weight: 650; color: #3d4451; }
.brand span { color: #1d1d1f; }
.eye { margin-top: auto; font-size: 15px; font-weight: 650; color: #6e6e73; text-transform: uppercase; letter-spacing: .06em; }
h1 { margin-top: 12px; font-size: 64px; line-height: 1.02; font-weight: 750; letter-spacing: -.045em; }
.sub { margin-top: 16px; font-size: 24px; line-height: 1.3; color: #6e6e73; font-weight: 500; }
.chips { margin-top: 30px; display: flex; flex-wrap: wrap; gap: 8px; }
.chip { padding: 7px 14px; border-radius: 99px; background: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05);
  font-size: 15px; font-weight: 600; color: #3d4451; }
.chip.dark { background: #3d4451; color: #fff; box-shadow: none; }
.frame { position: absolute; border-radius: 22px; overflow: hidden; background: #e8e8ed;
  box-shadow: 0 30px 70px rgba(30,35,50,.18), 0 0 0 1px rgba(0,0,0,.06); }
.frame img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
.portrait { position: absolute; right: 72px; top: 64px; width: 420px; height: 502px; border-radius: 40px; overflow: hidden;
  background: linear-gradient(180deg, #f5f5f7, #e8e8ed); box-shadow: 0 30px 60px rgba(0,0,0,.1); }
.portrait::before { content: ''; position: absolute; inset: 0; background: radial-gradient(70% 60% at 50% 100%, rgba(130,142,165,.35), transparent 70%); }
.portrait img { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); height: 92%;
  -webkit-mask-image: linear-gradient(to bottom, #000 70%, transparent 100%); }
.list { position: absolute; right: 72px; top: 92px; width: 480px; background: #fff; border-radius: 26px; padding: 8px 0;
  box-shadow: 0 30px 70px rgba(30,35,50,.14), 0 0 0 1px rgba(0,0,0,.05); }
.row { display: flex; align-items: center; gap: 16px; padding: 14px 24px; }
.row + .row { border-top: 1px solid rgba(0,0,0,.07); }
.logo { width: 44px; height: 44px; border-radius: 12px; background: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.08);
  display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.logo img { max-width: 34px; max-height: 34px; }
.row b { display: block; font-size: 17px; font-weight: 650; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 360px; }
.row span { font-size: 14px; color: #6e6e73; }
`;

const page = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
<body><div class="bg"></div>${body}
<script>
  // shrink long titles until they fit in two lines
  const h = document.querySelector('h1');
  if (h) { let s = 64; while (h.scrollHeight > 140 && s > 40) { s -= 2; h.style.fontSize = s + 'px'; } }
</script></body></html>`;

const left = ({ eye, title, sub, chips = [], url }) => `
<div class="left">
  <div class="brand">${LOGO}<span>MoizDev</span></div>
  <div class="eye">${esc(eye)}</div>
  <h1>${title}</h1>
  <div class="sub">${esc(sub)}</div>
  <div class="chips">${url ? `<span class="chip dark">${esc(url)}</span>` : ''}${chips.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>
</div>`;

const shot = (src, style) => `<div class="frame" style="${style}"><img src="${file(src)}"></div>`;
const media = (p) => (p.media || []).map((m) => `${p.imageUrl.split('/').slice(0, -1).join('/')}/${m}`);
const portrait = (src) => `<div class="portrait"><img src="${file(src)}"></div>`;

// projects whose only image is a logo, not a screenshot
const NO_SCREENSHOT = new Set(['eims']);

const stackPanel = (p) => `
<div class="list" style="top:170px;padding:22px 26px;font-family:ui-monospace,Menlo,monospace;font-size:17px;line-height:1.9;letter-spacing:0">
  <div style="color:#9a9aa2">// ${esc(p.title)} stack</div>
  ${(p.technologies || [])
    .slice(0, 8)
    .map((t, i) => `<div><span style="color:#b4b4b9;display:inline-block;width:28px">${i + 1}</span><span style="color:#4c6b68">${esc(t)}</span></div>`)
    .join('')}
</div>`;

const cards = [];

for (const p of projects) {
  const imgs = media(p);
  const back = imgs.find((m) => !m.endsWith(p.imageUrl.split('/').pop()));
  cards.push({
    out: `og/works/${p.id}.jpg`,
    html: page(
      left({
        eye: 'Case study',
        title: esc(p.title),
        sub: p.subtitle,
        chips: (p.technologies || []).slice(0, 2),
        url: `moiez.dev/works/${p.id}`,
      }) +
        (NO_SCREENSHOT.has(p.id)
          ? stackPanel(p)
          : (back ? shot(back.slice(1), 'right:28px;top:44px;width:400px;height:250px;opacity:.9;transform:rotate(3deg)') : '') +
            shot(p.imageUrl.slice(1), 'right:64px;top:196px;width:520px;height:325px')),
    ),
  });
}

const featured = projects.slice(0, 4);
cards.push({
  out: 'og/works.jpg',
  html: page(
    left({ eye: 'Selected work', title: 'All work.', sub: `${projects.length} products, platforms and sites — POS, travel, SaaS and more.`, url: 'moiez.dev/works' }) +
      featured
        .map((p, i) =>
          shot(p.imageUrl.slice(1), `width:290px;height:181px;right:${i % 2 ? 72 : 382}px;top:${i < 2 ? 110 : 315}px`),
        )
        .join(''),
  ),
});

cards.push({
  out: 'og/experience.jpg',
  html: page(
    left({ eye: 'Experience', title: `${years}+ years<br>of shipping.`, sub: 'Senior Full Stack roles across retail and SaaS — POS, loyalty, wallets and AI.', url: 'moiez.dev/experience' }) +
      `<div class="list">${jobs
        .slice(0, 5)
        .map(
          (j) =>
            `<div class="row"><div class="logo"><img src="${file(j.logo.slice(1))}"></div><div><b>${esc(j.company)}</b><span>${esc(j.title)} · ${esc(j.period)}</span></div></div>`,
        )
        .join('')}</div>`,
  ),
});

cards.push({
  out: 'og/about.jpg',
  html: page(
    left({ eye: 'About', title: 'The person<br>behind the work.', sub: 'Product-focused engineer who owns features end to end.', url: 'moiez.dev/about' }) +
      portrait('aboutSection/about-img.webp'),
  ),
});

cards.push({
  out: 'og/contact.jpg',
  html: page(
    left({ eye: 'Contact', title: 'Let’s build<br>something great.', sub: 'Open to senior full stack roles and projects.', url: 'moiezdev@gmail.com' }) +
      portrait('heroSection/hero-img.webp'),
  ),
});

cards.push({
  out: 'og/cv.jpg',
  html: page(
    left({ eye: 'Résumé', title: 'Moieez<br>ur Rehman', sub: `Senior Full Stack Software Engineer · ${years}+ years`, url: 'moiez.dev/cv' }) +
      portrait('heroSection/hero-img.webp'),
  ),
});

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
const tmp = mkdtempSync(join(tmpdir(), 'og-'));
for (const card of cards) {
  const html = join(tmp, 'card.html');
  writeFileSync(html, card.html);
  await tab.goto(pathToFileURL(html).href, { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  const out = join(pub, card.out);
  mkdirSync(dirname(out), { recursive: true });
  await tab.screenshot({ path: out, type: 'jpeg', quality: 86, scale: 'css' });
  console.log('wrote', card.out);
}
await browser.close();
rmSync(tmp, { recursive: true, force: true });
