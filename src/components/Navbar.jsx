import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import SideLinks from './ui/SideLinks';
import Logo from './ui/Logo';
import Button from './ui/Button';
import { usePreferences } from '../context/Preferences';
import { useContent } from '../i18n/content';

const NAV = [
  { id: 'home', key: 'nav.home', link: '/' },
  { id: 'works', key: 'nav.works', link: '/works' },
  { id: 'experience', key: 'nav.experience', link: '/experience' },
  { id: 'about', key: 'nav.about', link: '/about' },
  { id: 'contact', key: 'nav.contact', link: '/contact' },
];

const PrefsToggles = ({ className = '' }) => {
  const { lang, theme, toggleLang, toggleTheme } = usePreferences();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        onClick={toggleLang}
        className="!p-0 size-8 text-xs"
        aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      >
        {lang === 'ar' ? 'EN' : 'ع'}
      </Button>
      <Button
        onClick={toggleTheme}
        className="!p-0 size-8 text-xs"
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {theme === 'dark' ? (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1Zm0 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.5-2.5a1 1 0 1 1 0-2H21a1 1 0 1 1 0 2h-1.5ZM3 13a1 1 0 1 1 0-2h1.5a1 1 0 1 1 0 2H3Zm14.36 5.36a1 1 0 0 1 0-1.41l1.06-1.06a1 1 0 1 1 1.41 1.41l-1.06 1.06a1 1 0 0 1-1.41 0ZM5.58 7.05a1 1 0 0 1 0-1.41L6.64 4.58A1 1 0 0 1 8.05 6L7 7.05a1 1 0 0 1-1.41 0Zm12.37-2.47 1.06 1.06A1 1 0 1 1 17.6 7.05l-1.06-1.06a1 1 0 0 1 1.41-1.41ZM6.64 17.95l-1.06 1.06a1 1 0 1 1-1.41-1.41l1.06-1.06a1 1 0 0 1 1.41 1.41ZM12 17a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V18a1 1 0 0 1 1-1Z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M21 14.3A8.5 8.5 0 0 1 9.7 3 7 7 0 1 0 21 14.3Z" />
          </svg>
        )}
      </Button>
    </div>
  );
};

const Navbar = () => {
  const [navOpen, setNavOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const { lang } = usePreferences();
  const { t } = useContent();

  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      const screenWidth = window.innerWidth;
      const rtl = document.documentElement.dir === 'rtl';
      const fromEdge = rtl
        ? touchStartX.current <= screenWidth * 0.1
        : touchStartX.current >= screenWidth * 0.9;
      if (!fromEdge) touchStartX.current = null;
    };

    const handleTouchEnd = (e) => {
      if (touchStartX.current === null) return;

      touchEndX.current = e.changedTouches[0].clientX;
      const deltaX = touchStartX.current - touchEndX.current;
      const rtl = document.documentElement.dir === 'rtl';

      if (rtl) {
        if (deltaX < -50) setNavOpen(true);
        if (deltaX > 50) setNavOpen(false);
      } else {
        if (deltaX > 50) setNavOpen(true);
        if (deltaX < -50) setNavOpen(false);
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [lang]);

  return (
    <div className="p-4 pb-3 fixed w-full top-0 start-0 z-30 bg-gray-b">
      <SideLinks />
      <div className="app-container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-white font-bold flex items-center gap-1 py-1">
            <Logo size={35} staticLogo={true} />
            MoizDev
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          <ul className="flex gap-4 lg:gap-6">
            {NAV.map((btn) => (
              <li key={btn.id}>
                <NavLink
                  to={btn.link}
                  className={({ isActive }) => (isActive ? 'text-white' : 'hover:text-white')}
                >
                  <span className="text-primary">#</span>
                  {t(btn.key)}
                </NavLink>
              </li>
            ))}
          </ul>
          <PrefsToggles />
        </div>

        <div className="md:hidden flex items-center gap-3">
          <PrefsToggles />
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="text-white focus:outline-none z-40"
          >
            {navOpen ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          navOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setNavOpen(false)}
      />

      <div
        className={`fixed top-0 end-0 h-full w-64 bg-gray-b shadow-lg transform transition-transform duration-500 ease-in-out ${
          navOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'
        }`}
      >
        <ul className="flex flex-col p-6 space-y-6 text-lg mt-7">
          {NAV.map((btn) => (
            <li key={btn.id}>
              <NavLink
                to={btn.link}
                onClick={() => setNavOpen(false)}
                className={({ isActive }) => (isActive ? 'text-white' : 'hover:text-white')}
              >
                <span className="text-primary">#</span>
                {t(btn.key)}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
