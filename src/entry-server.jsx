import { StrictMode } from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom';
import App from './App.jsx';
import { PreferencesProvider } from './context/Preferences.jsx';

/** Renders one route to HTML at build time, waiting for its lazy page chunk. */
export async function render(url) {
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <PreferencesProvider>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </PreferencesProvider>
    </StrictMode>,
  );
  let html = '';
  for await (const chunk of prelude) html += chunk;
  return html;
}
