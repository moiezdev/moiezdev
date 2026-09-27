import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { projects } from '../../data';
import { SITE_URL, metaFor } from '../../seo/meta';

const setMeta = (selector, attr, value) => {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
};

/** Keeps the tab title, description and share tags in sync while navigating. */
export default function RouteMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = metaFor(pathname, projects);
    const image = `${SITE_URL}${meta.image}`;
    document.title = meta.title;
    setMeta('meta[name="description"]', 'content', meta.description);
    setMeta('link[rel="canonical"]', 'href', meta.url);
    setMeta('meta[property="og:url"]', 'content', meta.url);
    setMeta('meta[property="og:title"]', 'content', meta.title);
    setMeta('meta[property="og:description"]', 'content', meta.description);
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[name="twitter:title"]', 'content', meta.title);
    setMeta('meta[name="twitter:description"]', 'content', meta.description);
    setMeta('meta[name="twitter:image"]', 'content', image);
  }, [pathname]);

  return null;
}
