import { AI_FAIL_FALLBACK, callAI } from './aiClient';
import { buildContext } from './contextBuilder';
import { SYSTEM_PROMPT } from './systemPrompt';

/**
 * Chat pipeline: compact context + system prompt + OpenRouter models.
 * @param {string} query
 * @param {{ signal?: AbortSignal, history?: { role: string, text: string }[] }} [options]
 * @returns {Promise<string>}
 */
export async function handleChat(query, { signal, history = [], lang = 'en' } = {}) {
  const question = String(query || '').trim();
  if (!question) {
    return AI_FAIL_FALLBACK;
  }

  const context = buildContext(question);

  const prior = history
    .filter((m) => m.role === 'user' || m.role === 'bot')
    .slice(-2)
    .map((m) => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text,
    }));

  const messages = [
    {
      role: 'system',
      content:
        lang === 'ar'
          ? `${SYSTEM_PROMPT}\n\nThe site language is Arabic. Reply in Arabic unless the visitor writes in another language.`
          : SYSTEM_PROMPT,
    },
    ...prior,
    {
      role: 'user',
      content: `Context:\n${JSON.stringify(context)}\n\nQuestion:\n${question}`,
    },
  ];

  try {
    return await callAI(messages, { signal });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    console.warn('chatHandler failed:', err);
    return AI_FAIL_FALLBACK;
  }
}
