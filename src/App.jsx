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
import { startSmoothScroll } from './utils/smoothScroll';
import RouteMeta from './components/functions/RouteMeta';
import { markMounted } from './utils/pageTransition';

// BotFolio isn't needed for first paint: load it once the browser is idle
const ChatBot = lazy(() => import('./components/chatbot/ChatBot'));
const useIdle = (timeout = 4000) => {
  const [idle, setIdle] = useState(false);
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

const Home = lazy(() => import('./pages/Index'));
const Projects = lazy(() => import('./pages/Projects'));
const Experience = lazy(() => import('./pages/Experience'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ProjectDetail = lazy(() => import('./pages/ProjectsDetails'));
const Cv = lazy(() => import('./pages/Cv'));

function AppShell() {
  const { pathname } = useLocation();
  const isCv = pathname === '/cv';
  const idle = useIdle();

  // the printable CV keeps plain native scrolling
  useEffect(() => (isCv ? undefined : startSmoothScroll()), [isCv]);

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
      <Navbar />
      <main className="relative overflow-x-clip">
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
