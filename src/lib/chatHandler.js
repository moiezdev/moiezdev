import { requestReply } from './aiClient';

const HISTORY_TURNS = 8;

/**
 * Chat pipeline: page-aware fact sheet + recent conversation → /api/chat.
 * @param {string} query
 * @param {{ signal?: AbortSignal, history?: { role: string, text: string }[], lang?: string, path?: string }} [options]
 * @returns {Promise<string>}
 */
export async function handleChat(query, { signal, history = [], lang = 'en', path = '/' } = {}) {
  const question = String(query || '').trim();
  const turns = history.filter((m) => (m.role === 'user' || m.role === 'bot') && m.id !== 'welcome');

  return requestReply(
    {
      question,
      lang,
      // the server builds the fact sheet itself from the site's data (api/chat.js)
      path,
      history: turns.slice(-HISTORY_TURNS).map((m) => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.text,
      })),
    },
    { signal },
  );
}
