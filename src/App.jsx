import { Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Suspense, lazy, useEffect, useState } from 'react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loading from './components/Loading';
import Cursor from './components/ui/Cursor';
import CommandPalette from './components/CommandPalette';
import ScrollToTop from './components/functions/ScrollToTop';
import RouteMeta from './components/functions/RouteMeta';
import { markMounted } from './utils/pageTransition';
import { BOTFOLIO_OPEN_EVENT } from './utils/botfolio';
import { useContent } from './i18n/content';

// BotFolio isn't needed for first paint: load it once the browser is idle
const ChatBot = lazy(() => import('./components/chatbot/ChatBot'));
const useIdle = (timeout = 4000) => {
  const [idle, setIdle] = useState(false);
  // a request to open the chat mounts it right away
  useEffect(() => {
    const now = () => setIdle(true);
    window.addEventListener(BOTFOLIO_OPEN_EVENT, now);
    return () => window.removeEventListener(BOTFOLIO_OPEN_EVENT, now);
  }, []);
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setIdle(true), 2000);
    return () => clearTimeout(id);
  }, [timeout]);
  return idle;
};

// pages load on demand; each can be preloaded (view transitions do, see routes/pages.js)
import { About, Contact, Cv, Experience, Home, NotFound, ProjectDetail, Projects } from './routes/pages';
import Toast from './components/ui/Toast';

function AppShell() {
  const { pathname } = useLocation();
  const isCv = pathname === '/cv';
  const idle = useIdle();
  const { t } = useContent();


  if (isCv) {
    return (
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/cv" element={<Cv />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <>
      <a href="#main" className="skip-link">
        {t('a11y.skip')}
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} data-path={pathname} className="relative overflow-x-clip outline-none">
        <Suspense fallback={<Loading />}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/works" element={<Projects />} />
            <Route path="/works/:id" element={<ProjectDetail />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      {idle && (
        <Suspense fallback={null}>
          <ChatBot />
        </Suspense>
      )}
      <CommandPalette />
      <Toast />
      <Cursor />
    </>
  );
}

/** The whole site. The router comes from the entry point: BrowserRouter in the
 *  browser (main.jsx), StaticRouter when prerendering (entry-server.jsx). */
function App() {
  useEffect(markMounted, []);
  return (
    <>
      <RouteMeta />
      <AppShell />
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default App;
