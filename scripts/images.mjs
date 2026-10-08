/**
 * Responsive images: `npm run images`
 *
 * For every image the site shows (project screenshots, hero, about, events), writes
 * AVIF + WebP copies at a few widths to public/img/… and records each image's size,
 * widths and a tiny blur placeholder in src/data/images.json, which <Img> reads to
 * build srcset/sizes and width/height. Re-run after adding or replacing images;
 * unchanged images are skipped. Commit public/img and src/data/images.json.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const PUBLIC = 'public';
const OUT = join(PUBLIC, 'img');
const MANIFEST = 'src/data/images.json';
const WIDTHS = [480, 960, 1440];

// every image the UI renders, by its public URL
const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
const urls = new Set(['/heroSection/hero-img.webp', '/aboutSection/about-img.webp']);
for (const id of json('src/data/projects/index.json')) {
  const p = json(`src/data/projects/${id}.json`);
  const base = p.imageUrl.split('/').slice(0, -1).join('/');
  urls.add(p.imageUrl);
  (p.media || []).forEach((m) => urls.add(`${base}/${m}`));
  [p.walletPass?.front, p.walletPass?.back].filter(Boolean).forEach((u) => urls.add(u));
}
json('src/data/events.json').forEach((e) => e.photos.forEach((ph) => urls.add(ph.src)));

// prefer the original PNG/JPG over an already-compressed WebP
const sourceFor = (url) => {
  const stem = join(PUBLIC, url).replace(/\.\w+$/, '');
  return ['.png', '.jpg', '.jpeg', '.webp'].map((ext) => stem + ext).find(existsSync);
};

const old = existsSync(MANIFEST) ? json(MANIFEST) : {};
const manifest = {};
let made = 0;

for (const url of [...urls].sort()) {
  const src = sourceFor(url);
  if (!src) {
    console.warn('missing source for', url);
    continue;
  }
  const base = `/img${url.replace(/\.\w+$/, '')}`;
  // content hash, not mtime: a fresh clone shouldn't regenerate everything
  const hash = createHash('sha1').update(readFileSync(src)).digest('hex').slice(0, 12);
  if (old[url]?.hash === hash && existsSync(join(PUBLIC, `${base}-${old[url].widths.at(-1)}.avif`))) {
    manifest[url] = old[url];
    continue;
  }

  const image = sharp(src, { failOn: 'none' }).rotate();
  const { width, height, hasAlpha } = await image.metadata();
  const widths = WIDTHS.filter((w) => w < width).concat(Math.min(width, WIDTHS.at(-1) + 480)).filter((w, i, a) => a.indexOf(w) === i);

  mkdirSync(dirname(join(PUBLIC, base)), { recursive: true });
  for (const w of widths) {
    const resized = image.clone().resize({ width: w, withoutEnlargement: true });
    await resized.clone().avif({ quality: 50, effort: 6 }).toFile(join(PUBLIC, `${base}-${w}.avif`));
    await resized.clone().webp({ quality: 74, effort: 5 }).toFile(join(PUBLIC, `${base}-${w}.webp`));
  }
  // ~300 byte placeholder, inlined; none for cut-outs, where it would show through
  const blur = hasAlpha
    ? undefined
    : `data:image/webp;base64,${(await image.clone().resize(16).webp({ quality: 40 }).toBuffer()).toString('base64')}`;

  manifest[url] = { w: width, h: height, base, widths, ...(blur && { blur }), hash };
  made += 1;
  console.log(`${url}  ${width}×${height} → ${widths.join(', ')}`);
}

writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${made} images generated, ${Object.keys(manifest).length} in ${MANIFEST}`);
