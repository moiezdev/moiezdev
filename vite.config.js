import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import flowbiteReact from "flowbite-react/plugin/vite";

/** Serves the Vercel function in /api/chat.js during `vite` dev and `vite preview`. */
function apiRoutes(env) {
  const mount = (server, load) => {
    Object.assign(process.env, env);
    server.middlewares.use('/api/chat', async (req, res) => {
      try {
        const { default: handler } = await load();
        await handler(req, res);
      } catch (err) {
        console.error(err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'dev_handler_failed' }));
      }
    });
  };
  return {
    name: 'local-api-routes',
    configureServer(server) {
      mount(server, () => server.ssrLoadModule('/api/chat.js'));
    },
    configurePreviewServer(server) {
      mount(server, () => import('./api/chat.js'));
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  title: 'MoizDev',
  plugins: [react(), tailwindcss(), flowbiteReact(), apiRoutes(loadEnv(mode, process.cwd(), ''))],
}))
