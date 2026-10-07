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
  const inject = (html, path) =>
    html.replace(SEO_BLOCK, renderSeoTags(metaFor(path, loadProjects())))
  return {
    name: 'route-meta',
    configResolved(config) {
      outDir = config.build.outDir
    },
    configureServer(server) {
      server.middlewares.use('/og', async (req, res, next) => {
        const route = req.url.replace(/\.jpg(\?.*)?$/, '')
        if (!/\.jpg(\?|$)/.test(req.url)) return next()
        res.setHeader('Content-Type', 'image/jpeg')
        res.end(await renderCard(route))
      })
    },
    transformIndexHtml(html, ctx) {
      return inject(html, ctx.originalUrl?.split('?')[0] || '/')
    },
    async writeBundle() {
      const template = readFileSync(join(outDir, 'index.html'), 'utf8')
      for (const route of staticRoutes(loadProjects())) {
        // share card, drawn from site data (not stored in git)
        const { image } = metaFor(route, loadProjects())
        if (image.startsWith('/og/')) {
          const png = join(outDir, image)
          mkdirSync(dirname(png), { recursive: true })
          writeFileSync(png, await renderCard(route))
        }
        // flat files: Vercel's cleanUrls serves /works/tdm from works/tdm.html
        const file = route === '/' ? join(outDir, 'index.html') : join(outDir, `${route}.html`)
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, template.replace(/<title>[\s\S]*?<meta name="twitter:image:alt"[^>]*>/, renderSeoTags(metaFor(route, loadProjects()))))
      }
      // Vercel serves 404.html, with a real 404 status, for any URL without a file;
      // the app then renders the branded NotFound page
      writeFileSync(join(outDir, '404.html'), template.replace(/<title>[\s\S]*?<meta name="twitter:image:alt"[^>]*>/, renderSeoTags(NOT_FOUND)))
    },
  }
}

/** Serves the Vercel functions in /api during `vite` dev and `vite preview`. */
function apiRoutes(env) {
  const routes = ['chat', 'og']
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
export default defineConfig(({ mode }) => ({
  title: 'MoizDev',
  plugins: [react(), tailwindcss(), flowbiteReact(), routeMeta(), apiRoutes(loadEnv(mode, process.cwd(), ''))],
}))
