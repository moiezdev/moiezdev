import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { STORAGE_KEY, applyDom, readPrefs } from './prefs';

const PreferencesContext = createContext(null);

// what the prerendered HTML was built with
const SERVER_PREFS = { lang: 'en', theme: 'dark' };
const isServer = typeof window === 'undefined';

export function PreferencesProvider({ children, hydrating = false }) {
  // hydration must start from the server's state; the real prefs follow right after
  const [prefs, setPrefs] = useState(() => (isServer || hydrating ? SERVER_PREFS : readPrefs()));
  const [synced, setSynced] = useState(!hydrating);

  useLayoutEffect(() => {
    if (synced) return;
    setPrefs(readPrefs());
    setSynced(true);
  }, [synced]);

  // layout effect: lang/dir/theme change in the same frame as the re-render
  useLayoutEffect(() => {
    if (!synced) return;
    document.documentElement.classList.remove('prerender-hide');
    applyDom(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs, synced]);

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
