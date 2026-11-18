/** Language/theme preferences: storage and DOM helpers (no React). */

export const STORAGE_KEY = 'moiz-prefs';

/** Saved preferences, or the defaults. Safe to call on the server, where it returns defaults.
 * The theme is light unless the visitor picked one with the toggle (`themeChosen`); the
 * OS colour scheme is ignored. Entries saved before `themeChosen` existed stored the OS
 * theme on every visit, so they can't tell a choice from a default and fall back to light. */
export function readPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const chosen = parsed.themeChosen === true && (parsed.theme === 'light' || parsed.theme === 'dark');
      return {
        lang: parsed.lang === 'ar' ? 'ar' : 'en',
        theme: chosen ? parsed.theme : 'light',
        themeChosen: chosen,
      };
    }
  } catch {
    /* ignore */
  }

  const nav = typeof navigator !== 'undefined' ? navigator.language || '' : '';
  return {
    lang: nav.toLowerCase().startsWith('ar') ? 'ar' : 'en',
    theme: 'light',
    themeChosen: false,
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
