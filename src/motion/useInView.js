import { useEffect, useState } from 'react';

/**
 * True while `ref` is in (or near) the viewport. `once` stops watching after the
 * first hit. Always false on the server, so never gate content on it — only motion.
 */
export function useInView(ref, { rootMargin = '0px', threshold = 0, once = false } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) io.disconnect();
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, threshold, once]);
  return inView;
}
