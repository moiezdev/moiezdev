import { Link, useNavigate } from 'react-router-dom';
import { navigateWithTransition } from '../../motion/viewTransition';
import { preloadRoute } from '../../routes/pages';

/**
 * <Link> that navigates inside a view transition (instant where unsupported or
 * with reduced motion). `shared` = { from, to }: the element (or selector) on
 * this page that morphs into the selector `to` on the next page.
 * Modified clicks (new tab, etc.) keep the browser's default behaviour.
 */
export default function TransitionLink({ to, shared, onClick, ...rest }) {
  const navigate = useNavigate();
  const handleClick = (e) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (typeof document.startViewTransition !== 'function') return; // plain <Link>
    e.preventDefault();
    const from = typeof shared?.from === 'function' ? shared.from(e.currentTarget) : shared?.from;
    navigateWithTransition(navigate, to, { preload: () => preloadRoute(to), from, toSelector: shared?.to });
  };
  return <Link to={to} onClick={handleClick} {...rest} />;
}
