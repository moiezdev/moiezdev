/**
 * Fills every route's HTML in dist/ with the page's prerendered markup, so the
 * hero and page content paint before any JavaScript runs. Runs after
 * `vite build` (site + per-route HTML) and `vite build --ssr` (dist-ssr/).
 * The browser then hydrates this HTML instead of building the page itself.
 */
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const DIST = 'dist';
const { render } = await import(pathToFileURL(join('dist-ssr', 'entry-server.js')).href);
const manifest = JSON.parse(readFileSync(join(DIST, '.vite', 'manifest.json'), 'utf8'));
// No image preload: the home page's largest paint is the hero headline (text);
// the only hero image is a small avatar, loaded eagerly by <Img priority>.

// the lazy page module behind each route, so its code and CSS can be preloaded
const pageFor = (route) =>
  route === '/'
    ? 'src/pages/Index.jsx'
    : route.startsWith('/works/')
      ? 'src/pages/ProjectsDetails.jsx'
      : {
          '/works': 'src/pages/Projects.jsx',
          '/experience': 'src/pages/Experience.jsx',
          '/about': 'src/pages/About.jsx',
          '/contact': 'src/pages/Contact.jsx',
          '/cv': 'src/pages/Cv.jsx',
        }[route] || 'src/pages/NotFound.jsx';

const entryFiles = new Set(
  Object.values(manifest)
    .filter((c) => c.isEntry)
    .flatMap((c) => [c.file, ...(c.css || [])]),
);

function assetsFor(key, out = { js: new Set(), css: new Set() }) {
  const chunk = manifest[key];
  if (!chunk) return out;
  if (!entryFiles.has(chunk.file)) out.js.add(chunk.file);
  (chunk.css || []).forEach((f) => entryFiles.has(f) || out.css.add(f));
  (chunk.imports || []).forEach((k) => assetsFor(k, out));
  return out;
}

const htmlFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? htmlFiles(join(dir, d.name)) : d.name.endsWith('.html') ? [join(dir, d.name)] : [],
  );

let count = 0;
for (const file of htmlFiles(DIST)) {
  const rel = relative(DIST, file).split(sep).join('/').replace(/\.html$/, '');
  const route = rel === 'index' ? '/' : rel === '404' ? '/404' : `/${rel}`;
  const html = readFileSync(file, 'utf8');
  if (!html.includes('<div id="root"></div>')) throw new Error(`${file}: no empty #root to fill`);

  const markup = await render(route);
  const { css } = assetsFor(pageFor(route));
  const preload = [
    // page CSS only: preloading page JS would compete with the first paint for
    // bandwidth, and the prerendered page doesn't need it to paint
    ...[...css].map((f) => `<link rel="stylesheet" href="/${f}" />`),
  ].join('\n    ');

  writeFileSync(
    file,
    html.replace('</head>', `  ${preload}\n  </head>`).replace('<div id="root"></div>', `<div id="root">${markup}</div>`),
  );
  count += 1;
}

rmSync(join(DIST, '.vite'), { recursive: true, force: true }); // build metadata, not for deploy
console.log(`prerendered ${count} pages`);
