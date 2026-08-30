import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'moiz-prefs';

function readPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        lang: parsed.lang === 'ar' ? 'ar' : 'en',
        theme: parsed.theme === 'light' ? 'light' : 'dark',
      };
    }
  } catch {
    /* ignore */
  }

  const nav = typeof navigator !== 'undefined' ? navigator.language : '';
  return {
    lang: nav.toLowerCase().startsWith('ar') ? 'ar' : 'en',
    theme: 'dark',
  };
}

function applyDom({ lang, theme }) {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  root.setAttribute('data-theme', theme);
}

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(readPrefs);

  useEffect(() => {
    applyDom(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs]);

  const setLang = useCallback((lang) => {
    setPrefs((prev) => ({ ...prev, lang: lang === 'ar' ? 'ar' : 'en' }));
  }, []);

  const setTheme = useCallback((theme) => {
    setPrefs((prev) => ({ ...prev, theme: theme === 'light' ? 'light' : 'dark' }));
  }, []);

  const toggleLang = useCallback(() => {
    setPrefs((prev) => ({ ...prev, lang: prev.lang === 'ar' ? 'en' : 'ar' }));
  }, []);

  const toggleTheme = useCallback(() => {
    setPrefs((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const value = useMemo(
    () => ({ ...prefs, setLang, setTheme, toggleLang, toggleTheme }),
    [prefs, setLang, setTheme, toggleLang, toggleTheme],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return ctx;
}
