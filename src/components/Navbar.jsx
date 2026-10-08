import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './ui/Logo';
import { usePreferences } from '../context/Preferences';
import { useContent } from '../i18n/content';
import { isMac, openCommandPalette } from '../utils/commandPalette';
import { transitionLang, transitionTheme } from '../motion/prefsTransitions';

const NAV = [
  { id: 'home', key: 'nav.home', link: '/' },
  { id: 'works', key: 'nav.works', link: '/works' },
  { id: 'experience', key: 'nav.experience', link: '/experience' },
  { id: 'about', key: 'nav.about', link: '/about' },
  { id: 'contact', key: 'nav.contact', link: '/contact' },
];

// 32px visually, but the ::after layer grows the tap area to 44px (WCAG 2.5.5)
const iconBtn =
  "relative inline-flex items-center justify-center size-8 rounded-full text-label-2 hover:text-label hover:bg-fill transition-colors cursor-pointer after:absolute after:-inset-1.5 after:content-['']";

// a small label under a header control, shown on hover and keyboard focus;
// it also gives the control its accessible name
const tipClass =
  'pointer-events-none absolute top-full end-0 z-10 mt-2.5 whitespace-nowrap rounded-lg bg-label px-2.5 py-1 text-[12px] font-medium tracking-normal text-bg opacity-0 shadow-[0_4px_16px_rgba(0,0,0,0.16)] -translate-y-0.5 transition-[opacity,translate] duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0';

const PrefsToggles = () => {
  const { lang, toggleLang, toggleTheme } = usePreferences();
  const { t } = useContent();
  const other = lang === 'ar' ? 'en' : 'ar';

  return (
    <div className="flex items-center gap-3">
      {/* names the language it switches to, in that language: "عربي" / "EN" */}
      <button
        type="button"
        onClick={() => transitionLang(toggleLang)}
        className="relative inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-[13px] font-semibold text-label-2 ring-1 ring-inset ring-separator hover:text-label hover:bg-fill transition-colors cursor-pointer after:absolute after:-inset-1.5 after:content-['']"
      >
        <span lang={other} className={other === 'ar' ? 'leading-none' : 'tracking-[0.02em]'}>
          {t('a11y.langLabel')}
        </span>
        <span className="sr-only">{t('a11y.switchLang')}</span>
      </button>
      <button type="button" onClick={(e) => transitionTheme(toggleTheme, e.currentTarget)} className={`${iconBtn} group`}>
        {/* both icons and both labels render; CSS picks one, so prerendered HTML matches any theme */}
        <svg className="w-4 h-4 hidden dark:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </svg>
        <svg className="w-4 h-4 dark:hidden" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M21 14.3A8.5 8.5 0 0 1 9.7 3 7 7 0 1 0 21 14.3Z" />
        </svg>
        <span className={tipClass}>
          <span className="hidden dark:inline">{t('a11y.themeToLight')}</span>
          <span className="dark:hidden">{t('a11y.themeToDark')}</span>
        </span>
      </button>
    </div>
  );
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { t } = useContent();
  // OS-specific shortcut label, set after mount so prerendered HTML matches
  const [mac, setMac] = useState(false);

  useEffect(() => setMac(isMac()), []);
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    document.documentElement.classList.toggle('menu-open', open);
    return () => {
      document.body.style.overflow = '';
      document.documentElement.classList.remove('menu-open');
    };
  }, [open]);

  const linkClass = ({ isActive }) =>
    `text-[13px] tracking-[-0.01em] transition-colors ${
      isActive ? 'text-label font-medium' : 'text-label-2 hover:text-label'
    }`;

  return (
    <header data-site-header
      className={`fixed top-0 inset-x-0 z-40 transition-[background-color,border-color] duration-500 border-b ${
        scrolled || open ? 'glass border-separator' : 'bg-transparent border-transparent'
      }`}
    >
      <nav aria-label={t('a11y.mainNav')} className="app-container px-5 h-[52px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-label font-semibold tracking-[-0.02em]" aria-label={t('a11y.home')}>
          <Logo size={28} />
          <span className="text-[17px]">MoizDev</span>
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {NAV.map((item) => (
            <li key={item.id}>
              <NavLink to={item.link} end={item.link === '/'} className={linkClass}>
                {t(item.key)}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCommandPalette}
            className="hidden lg:inline-flex items-center gap-2 h-8 ps-3 pe-1.5 me-1 rounded-full bg-fill text-[13px] text-label-2 hover:text-label transition-colors"
            // named by its visible text ("Search"); the shortcut hint is decoration
            aria-haspopup="dialog"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="9" cy="9" r="6" />
              <path d="m13.5 13.5 4 4" />
            </svg>
            {t('cmd.search')}
            <kbd aria-hidden className="text-[11px] font-medium rounded-full bg-surface px-2 py-0.5 ring-1 ring-separator">
              {mac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </button>
          <button
            type="button"
            onClick={openCommandPalette}
            className={`${iconBtn} lg:hidden`}
            aria-label={t('cmd.placeholder')}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <circle cx="9" cy="9" r="6" />
              <path d="m13.5 13.5 4 4" />
            </svg>
          </button>
          <PrefsToggles />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`${iconBtn} md:hidden`}
            aria-label={open ? t('a11y.closeMenu') : t('a11y.openMenu')}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <svg className="w-4 h-4" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
              <path
                className="transition-all duration-300"
                d={open ? 'M4 4l10 10' : 'M2.5 6h13'}
              />
              <path
                className="transition-all duration-300"
                d={open ? 'M4 14 14 4' : 'M2.5 12h13'}
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      <div
        id="mobile-menu"
        // closed: keep its links out of the tab order and the accessibility tree
        inert={!open}
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-500 ease-[var(--ease-apple)] ${
          open ? 'max-h-[100dvh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <ul className="px-8 pt-4 pb-10 flex flex-col gap-1 h-[calc(100dvh-52px)]">
          {NAV.map((item, i) => (
            <li
              key={item.id}
              className="transition-all duration-500"
              style={{
                transitionDelay: open ? `${80 + i * 40}ms` : '0ms',
                opacity: open ? 1 : 0,
                transform: open ? 'none' : 'translateY(-8px)',
              }}
            >
              <NavLink
                to={item.link}
                end={item.link === '/'}
                className={({ isActive }) =>
                  `block py-2 text-[28px] font-semibold tracking-[-0.02em] ${
                    isActive ? 'text-label' : 'text-label-2 hover:text-label'
                  }`
                }
              >
                {t(item.key)}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
};

export default Navbar;
