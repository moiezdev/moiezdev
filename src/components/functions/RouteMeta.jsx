import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { allProjects as projects } from '../../data';
import { headTags, metaFor } from '../../seo/meta';

/**
 * Keeps the tab title, description, canonical, share tags and JSON-LD in sync
 * while navigating. Every static page already ships the right tags (crawlers
 * read those); this swaps the `data-seo` set for the new route's, so a page
 * reached in the app ends up with the same <head> as its static HTML.
 */
export default function RouteMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const tags = headTags(metaFor(pathname, projects));
    const head = document.head;
    head.querySelectorAll('[data-seo]').forEach((el) => el.remove());
    for (const [tag, attrs, text] of tags) {
      if (tag === 'title') {
        document.title = text;
        continue;
      }
      const el = document.createElement(tag);
      el.setAttribute('data-seo', '');
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      if (text) el.textContent = text;
      head.appendChild(el);
    }
  }, [pathname]);

  return null;
}
