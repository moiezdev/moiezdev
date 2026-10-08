import { lazy } from 'react';

/**
 * React.lazy with a `.preload()`. Once preloaded, the lazy component resolves
 * synchronously (a pre-resolved thenable), so a view transition can render the
 * new page inside its callback without hitting the Suspense fallback.
 */
function lazyWithPreload(factory) {
  let mod = null;
  let pending = null;
  const load = () => (pending ??= factory().then((m) => (mod = m)));
  const Component = lazy(() => (mod ? { then: (resolve) => resolve(mod) } : load()));
  Component.preload = load;
  return Component;
}

export const Home = lazyWithPreload(() => import('../pages/Index'));
export const Projects = lazyWithPreload(() => import('../pages/Projects'));
export const ProjectDetail = lazyWithPreload(() => import('../pages/ProjectsDetails'));
export const Experience = lazyWithPreload(() => import('../pages/Experience'));
export const About = lazyWithPreload(() => import('../pages/About'));
export const Contact = lazyWithPreload(() => import('../pages/Contact'));
export const NotFound = lazyWithPreload(() => import('../pages/NotFound'));
export const Cv = lazyWithPreload(() => import('../pages/Cv'));

/** Loads the page component for `pathname` (resolves immediately if already loaded). */
export function preloadRoute(pathname) {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (path === '/') return Home.preload();
  if (path === '/works') return Projects.preload();
  if (path.startsWith('/works/')) return ProjectDetail.preload();
  return ({ '/experience': Experience, '/about': About, '/contact': Contact, '/cv': Cv }[path] || NotFound).preload();
}
