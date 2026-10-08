import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// self-hosted Arabic font (Inter is declared in index.css); only the Arabic
// subset, and browsers download a file only when it's needed
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css';
import './index.css';
import App from './App.jsx';
import { PreferencesProvider } from './context/Preferences.jsx';
import { readPrefs } from './context/prefs';

// The site used hash URLs (moiez.dev/#/works/tdm). Keep old shared links working.
const fromHash = window.location.hash.startsWith('#/');
if (fromHash) {
  window.history.replaceState(null, '', window.location.hash.slice(1));
}

const container = document.getElementById('root');
// Pages are prerendered in English. Hydrate that HTML when it's what the visitor
// should see; otherwise (Arabic, or an old hash link to another page) render fresh.
const hydrate = container.hasChildNodes() && !fromHash && readPrefs().lang === 'en';

const app = (
  <StrictMode>
    <PreferencesProvider hydrating={hydrate}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PreferencesProvider>
  </StrictMode>
);

if (hydrate) hydrateRoot(container, app);
else createRoot(container).render(app);
