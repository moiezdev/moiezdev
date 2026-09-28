import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToTarget } from '../../utils/smoothScroll';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollToTarget(0, { immediate: true });
  }, [pathname]);

  return null;
}
