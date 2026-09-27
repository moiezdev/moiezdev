import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './ui/Logo';
import { usePreferences } from '../context/Preferences';
import { useContent } from '../i18n/content';
import { isMac, openCommandPalette } from '../utils/commandPalette';

const NAV = [
  { id: 'home', key: 'nav.home', link: '/' },
  { id: 'works', key: 'nav.works', link: '/works' },
  { id: 'experience', key: 'nav.experience', link: '/experience' },
  { id: 'about', key: 'nav.about', link: '/about' },
  { id: 'contact', key: 'nav.contact', link: '/contact' },
];

const iconBtn =
  'inline-flex items-center justify-center size-8 rounded-full text-label-2 hover:text-label hover:bg-fill transition-colors cursor-pointer';

const PrefsToggles = () => {
  const { lang, theme, toggleLang, toggleTheme } = usePreferences();

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={toggleLang}
        className={`${iconBtn} text-[13px] font-semibold`}
        aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      >
        {lang === 'ar' ? 'EN' : 'ع'}
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className={iconBtn}
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {theme === 'dark' ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M21 14.3A8.5 8.5 0 0 1 9.7 3 7 7 0 1 0 21 14.3Z" />
          </svg>
        )}
      </button>
    </div>
  );
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { t } = useContent();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const linkClass = ({ isActive }) =>
    `text-[13px] tracking-[-0.01em] transition-colors ${
      isActive ? 'text-label font-medium' : 'text-label-2 hover:text-label'
    }`;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-[background-color,border-color] duration-500 border-b ${
        scrolled || open ? 'glass border-separator' : 'bg-transparent border-transparent'
      }`}
    >
      <nav className="app-container px-5 h-[52px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-label font-semibold tracking-[-0.02em]" aria-label="MoizDev home">
          <Logo size={26} staticLogo={true} />
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

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openCommandPalette}
            className="hidden lg:inline-flex items-center gap-2 h-8 ps-3 pe-1.5 me-1 rounded-full bg-fill text-[13px] text-label-2 hover:text-label transition-colors"
            aria-label={t('cmd.placeholder')}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="9" cy="9" r="6" />
              <path d="m13.5 13.5 4 4" />
            </svg>
            {t('cmd.search')}
            <kbd className="text-[11px] font-medium rounded-full bg-surface px-2 py-0.5 ring-1 ring-separator">
              {isMac() ? '⌘K' : 'Ctrl K'}
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
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
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
