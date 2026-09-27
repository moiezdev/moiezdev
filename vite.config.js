import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import flowbiteReact from "flowbite-react/plugin/vite";
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { metaFor, renderSeoTags, staticRoutes } from './src/seo/meta.js'

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
    transformIndexHtml(html, ctx) {
      return inject(html, ctx.originalUrl?.split('?')[0] || '/')
    },
    writeBundle() {
      const template = readFileSync(join(outDir, 'index.html'), 'utf8')
      for (const route of staticRoutes(loadProjects())) {
        // flat files: Vercel's cleanUrls serves /works/tdm from works/tdm.html
        const file = route === '/' ? join(outDir, 'index.html') : join(outDir, `${route}.html`)
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, template.replace(/<title>[\s\S]*?<meta name="twitter:image:alt"[^>]*>/, renderSeoTags(metaFor(route, loadProjects()))))
      }
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
