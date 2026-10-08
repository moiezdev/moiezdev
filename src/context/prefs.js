/** Language/theme preferences: storage and DOM helpers (no React). */

export const STORAGE_KEY = 'moiz-prefs';

function systemTheme() {
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/** Saved (or system) preferences. Safe to call on the server, where it returns defaults. */
export function readPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        lang: parsed.lang === 'ar' ? 'ar' : 'en',
        theme: parsed.theme === 'light' || parsed.theme === 'dark' ? parsed.theme : systemTheme(),
      };
    }
  } catch {
    /* ignore */
  }

  const nav = typeof navigator !== 'undefined' ? navigator.language || '' : '';
  return {
    lang: nav.toLowerCase().startsWith('ar') ? 'ar' : 'en',
    theme: systemTheme(),
  };
}

export function applyDom({ lang, theme }) {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  root.setAttribute('data-theme', theme);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#000000' : '#fbfbfd');
}
