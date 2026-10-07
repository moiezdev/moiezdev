import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import flowbiteReact from "flowbite-react/plugin/vite";
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { NOT_FOUND, metaFor, renderSeoTags, staticRoutes } from './src/seo/meta.js'
import { renderCard } from './seo/og-card.js'

const SEO_BLOCK = /<!-- seo:start[\s\S]*?<!-- seo:end -->/

const loadProjects = () => {
  const dir = join(process.cwd(), 'src/data/projects')
  const ids = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'))
  return ids.map((id) => JSON.parse(readFileSync(join(dir, `${id}.json`), 'utf8')))
}

/**
 * Per-route <head> tags. Link previews (LinkedIn, WhatsApp, X, Slack) and
 * search engines don't run JavaScript, so every route gets its own static
 * HTML file with the right title, description and share image baked in.
 */
function routeMeta() {
  let outDir = 'dist'
  let building = false
  return {
    name: 'route-meta',
    configResolved(config) {
      outDir = config.build.outDir
      building = config.command === 'build'
    },
    configureServer(server) {
      // /og/home.jpg is the home page's card; /og-image.jpg is its old URL
      server.middlewares.use(async (req, res, next) => {
        const url = req.url.split('?')[0]
        const route = url === '/og-image.jpg' || url === '/og/home.jpg' ? '/' : url.match(/^\/og(\/.+)\.jpg$/)?.[1]
        if (!route) return next()
        res.setHeader('Content-Type', 'image/jpeg')
        res.end(await renderCard(route))
      })
    },
    transformIndexHtml(html, ctx) {
      // the build keeps the markers so writeBundle can fill the block per route
      if (building) return html
      return html.replace(SEO_BLOCK, renderSeoTags(metaFor(ctx.originalUrl?.split('?')[0] || '/', loadProjects())))
    },
    async writeBundle() {
      const template = readFileSync(join(outDir, 'index.html'), 'utf8')
      const projects = loadProjects()
      for (const route of staticRoutes(projects)) {
        const meta = metaFor(route, projects)
        // share card, drawn from site data (not stored in git)
        if (meta.image.startsWith('/og/')) {
          const jpg = join(outDir, meta.image)
          mkdirSync(dirname(jpg), { recursive: true })
          const card = await renderCard(route)
          writeFileSync(jpg, card)
          // the home card's old URL, still cached by sites that shared the link
          if (route === '/') writeFileSync(join(outDir, 'og-image.jpg'), card)
        }
        // flat files: Vercel's cleanUrls serves /works/tdm from works/tdm.html
        const file = route === '/' ? join(outDir, 'index.html') : join(outDir, `${route}.html`)
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, template.replace(SEO_BLOCK, renderSeoTags(meta)))
      }
      // Vercel serves 404.html, with a real 404 status, for any URL without a file;
      // the app then renders the branded NotFound page
      writeFileSync(join(outDir, '404.html'), template.replace(SEO_BLOCK, renderSeoTags(NOT_FOUND)))
    },
  }
}

/** Serves the Vercel functions in /api during `vite` dev and `vite preview`. */
function apiRoutes(env) {
  const routes = ['chat']
  const mount = (server, load) => {
    Object.assign(process.env, env)
    for (const name of routes) {
      server.middlewares.use(`/api/${name}`, async (req, res) => {
        try {
          const { default: handler } = await load(name)
          req.url = req.originalUrl || req.url
          await handler(req, res)
        } catch (err) {
          console.error(err)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'dev_handler_failed' }))
        }
      })
    }
  }
  return {
    name: 'local-api-routes',
    configureServer(server) {
      mount(server, (name) => server.ssrLoadModule(`/api/${name}.js`))
    },
    configurePreviewServer(server) {
      mount(server, (name) => import(`./api/${name}.js`))
    },
  }
}

// https://vite.dev/config/
// `vite build` makes the site; `vite build --ssr` makes dist-ssr/entry-server.js,
// which scripts/prerender.mjs uses to fill each route's HTML (see package.json)
export default defineConfig(({ mode, isSsrBuild }) => ({
  title: 'MoizDev',
  plugins: [
    react(),
    tailwindcss(),
    flowbiteReact(),
    ...(isSsrBuild ? [] : [routeMeta()]),
    apiRoutes(loadEnv(mode, process.cwd(), '')),
  ],
  build: isSsrBuild ? { outDir: 'dist-ssr' } : { manifest: true },
}))
