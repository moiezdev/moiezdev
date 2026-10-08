import { useEffect, useState } from 'react';
import { useInView } from './useInView';
import { usePrefersReducedMotion } from './reducedMotion';

const usePageVisible = () => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const sync = () => setVisible(document.visibilityState !== 'hidden');
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
  return visible;
};

/**
 * Whether a looping animation inside `ref` may run: it's on screen, the tab is
 * visible and the visitor hasn't asked for reduced motion.
 */
export function usePauseWhenHidden(ref, options) {
  const inView = useInView(ref, options);
  const pageVisible = usePageVisible();
  const reduced = usePrefersReducedMotion();
  return inView && pageVisible && !reduced;
}

/** Same rule for code without a React tree (e.g. rAF loops): page visibility only. */
export const isPageHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';
